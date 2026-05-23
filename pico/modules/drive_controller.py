from machine import Pin, I2C
from queues import Queue
from libs.pca9685 import PCA9685

import uasyncio as asyncio
import math
import time
import config

class Encoder:
    """
    Quadrature encoder with 2x decode (both edges on channel A).
    Direction is determined by comparing pin_a state AT the moment of
    IRQ (passed as argument) with pin_b current value.
    """

    def __init__(self, pin_a, pin_b):
        self.pin_a = Pin(pin_a, Pin.IN, Pin.PULL_UP)
        self.pin_b = Pin(pin_b, Pin.IN, Pin.PULL_UP)
        self._count = 0
        self.pin_a.irq(trigger=Pin.IRQ_RISING, handler=self._callback)

    def _callback(self, pin):
        # Use pin.value() which is the state of pin_a at the moment IRQ triggered,
        # rather than after the callback execution delay. pin_b is stable.
        if pin.value() != self.pin_b.value():
            self._count += 1
        else:
            self._count -= 1

    @property
    def count(self):
        return self._count

    def reset(self):
        self._count = 0


class Motor:
    def __init__(self, pca, ch_in1, ch_in2, enc_pin_a, enc_pin_b):
        self.pca = pca
        self.ch_in1 = ch_in1
        self.ch_in2 = ch_in2
        self.encoder = Encoder(enc_pin_a, enc_pin_b)
        self.stop()

    def _percent_to_duty(self, percent):
        return int((abs(percent) / 100) * 4095)

    def drive(self, speed):
        """
        Speed and direction control.
        speed: from -100 (reverse) to 100 (forward). 0 - stop.
        """
        speed = max(min(speed, 100), -100)
        duty = self._percent_to_duty(speed)

        if speed > 0:
            self.pca.duty(self.ch_in1, duty)
            self.pca.duty(self.ch_in2, 0)
        elif speed < 0:
            self.pca.duty(self.ch_in1, 0)
            self.pca.duty(self.ch_in2, duty)
        else:
            self.stop()

    def stop(self):
        self.pca.duty(self.ch_in1, 0)
        self.pca.duty(self.ch_in2, 0)

    def brake(self):
        self.pca.duty(self.ch_in1, 4095)
        self.pca.duty(self.ch_in2, 4095)


class DriveController:
    def __init__(self, response_queue, inertial_sensor):
        print("Initialization Drive controller")

        self.queue = Queue()
        self.response_queue = response_queue
        self.inertial_sensor = inertial_sensor
        self.current_task = None

        i2c = I2C(config.PCA9685_I2C_ID,
                   scl=Pin(config.PCA9685_SCL_PIN),
                   sda=Pin(config.PCA9685_SDA_PIN))
        self.pca = PCA9685(i2c, config.PCA9685_I2C_ADDR)
        self.pca.set_freq(config.PCA9685_PWM_FREQ)

        self.counts_per_rev = config.ENCODER_PPR * config.GEAR_RATIO

        self.fl = Motor(self.pca, config.PCA_FL_IN1_CH, config.PCA_FL_IN2_CH,
                        config.ENC_FL_A_PIN, config.ENC_FL_B_PIN)
        self.fr = Motor(self.pca, config.PCA_FR_IN1_CH, config.PCA_FR_IN2_CH,
                        config.ENC_FR_A_PIN, config.ENC_FR_B_PIN)
        self.bl = Motor(self.pca, config.PCA_BL_IN1_CH, config.PCA_BL_IN2_CH,
                        config.ENC_BL_A_PIN, config.ENC_BL_B_PIN)
        self.br = Motor(self.pca, config.PCA_BR_IN1_CH, config.PCA_BR_IN2_CH,
                        config.ENC_BR_A_PIN, config.ENC_BR_B_PIN)

    def add_command(self, cmd):
        self.queue.put_nowait(cmd)

    async def run(self):
        while True:
            cmd = await self.queue.get()
            action = cmd.get("a")
            cmd_id = cmd.get("i")
            speed = max(80, abs(cmd.get("s", 80)))
            value = cmd.get("v", 0)
            fl_speed = cmd.get("fl", 80)
            fr_speed = cmd.get("fr", 80)
            bl_speed = cmd.get("bl", 80)
            br_speed = cmd.get("br", 80)

            try:
                if action == "stop":
                    if self.current_task:
                        self.current_task.cancel()
                    self.stop()
                    await self.response_queue.put({"i": cmd_id, "s": "ok"})
                elif action == "control":
                    if self.current_task:
                        self.current_task.cancel()
                    self.current_task = asyncio.create_task(
                        self.control_task(cmd_id, fl_speed, fr_speed, bl_speed, br_speed))
                elif action == "move_distance":
                    if self.current_task:
                        self.current_task.cancel()
                    self.current_task = asyncio.create_task(
                        self.move_distance_task(speed, value, cmd_id))
                elif action == "rotate_angle":
                    if self.current_task:
                        self.current_task.cancel()
                    self.current_task = asyncio.create_task(
                        self.rotate_angle_task(speed, value, cmd_id))
            except Exception as e:
                self.stop()
                await self.response_queue.put({"i": cmd_id, "e": str(e)})


    def set_speed(self, left_speed, right_speed):
        self.fl.drive(left_speed)
        self.bl.drive(left_speed)
        self.fr.drive(right_speed)
        self.br.drive(right_speed)

    def stop(self):
        self.fl.stop()
        self.bl.stop()
        self.fr.stop()
        self.br.stop()

    def brake(self):
        self.fl.brake()
        self.bl.brake()
        self.fr.brake()
        self.br.brake()

    def _reset_encoders(self):
        self.fl.encoder.reset()
        self.fr.encoder.reset()
        self.bl.encoder.reset()
        self.br.encoder.reset()

    def _avg_encoder_count(self):
        # Use diagonal encoders (Front-Left and Back-Right) like an ABS system on a car
        return (abs(self.fl.encoder.count) + abs(self.br.encoder.count)) / 2

    async def control_task(self, cmd_id, fl_speed, fr_speed, bl_speed, br_speed):
        try:
            self.fl.drive(fl_speed)
            self.fr.drive(fr_speed)
            self.bl.drive(bl_speed)
            self.br.drive(br_speed)
        except asyncio.CancelledError:
            self.stop()
            await self.response_queue.put({"i": cmd_id, "s": "stopped"})
        except Exception as e:
            self.stop()
            await self.response_queue.put({"i": cmd_id, "e": str(e)})

    async def move_distance_task(self, speed, distance_mm, cmd_id):
        try:
            abs_distance = abs(distance_mm)
            if abs_distance == 0:
                await self.response_queue.put({"i": cmd_id, "s": "ok"})
                return

            direction = 1 if distance_mm >= 0 else -1

            wheel_circumference = math.pi * config.WHEEL_DIAMETER_MM
            target_counts = (abs_distance / wheel_circumference) * self.counts_per_rev

            # Deceleration zone: larger at higher speed (25%..50%)
            decel_ratio = 0.25 + (speed / 100.0) * 0.25
            decel_zone = target_counts * decel_ratio
            min_speed = 80  # below min_speed, the robot does not move under load

            # Timeout based on actual speed (50%..100% -> real range)
            # JGA25-370 280RPM, 65mm wheel -> ~950mm/s at 100%, under load ~60%
            estimated_speed_mm_s = max(30.0, 950.0 * (speed / 100.0) * 0.6)
            max_time_ms = int((abs_distance / estimated_speed_mm_s) * 1000 * 2.5) + 1000

            # Stall detection: if encoders do not change for 1 sec -> stop
            STALL_TIMEOUT_MS = 1000
            stall_ms = 0
            last_count = 0.0
            elapsed_ms = 0

            self._reset_encoders()

            # Disable interrupts on inactive diagonal encoders (FR and BL) to cut CPU load in half
            self.fr.encoder.pin_a.irq(trigger=0)
            self.bl.encoder.pin_a.irq(trigger=0)

            last_speed = None

            while True:
                current_counts = self._avg_encoder_count()

                if current_counts >= target_counts:
                    break

                if elapsed_ms >= max_time_ms:
                    break

                if abs(current_counts - last_count) < 1.0:
                    stall_ms += 10
                    if stall_ms >= STALL_TIMEOUT_MS:
                        break
                else:
                    stall_ms = 0
                    last_count = current_counts

                remaining = target_counts - current_counts
                if remaining < decel_zone:
                    scale = remaining / decel_zone
                    current_speed = max(min_speed, speed * scale)
                else:
                    current_speed = speed

                # Write to PCA9685 via I2C only if the target speed changed
                target_speed = current_speed * direction
                if target_speed != last_speed:
                    self.set_speed(target_speed, target_speed)
                    last_speed = target_speed

                await asyncio.sleep_ms(10)
                elapsed_ms += 10

            self.brake()
            await asyncio.sleep_ms(200)
            self.stop()
            await self.response_queue.put({"i": cmd_id, "s": "ok"})
        except asyncio.CancelledError:
            self.stop()
        except Exception as e:
            self.stop()
            try:
                await self.response_queue.put({"i": cmd_id, "e": str(e)})
            except:
                pass
        finally:
            # Guarantee re-enabling interrupts of the disabled encoders (FR and BL)
            self.fr.encoder.pin_a.irq(trigger=Pin.IRQ_RISING, handler=self.fr.encoder._callback)
            self.bl.encoder.pin_a.irq(trigger=Pin.IRQ_RISING, handler=self.bl.encoder._callback)


    async def rotate_angle_task(self, speed, angle, cmd_id):
        try:
            target_angle = abs(angle)
            direction = 1 if angle > 0 else -1

            offset = 0
            for _ in range(10):
                offset += self.inertial_sensor.read_gyro_raw_z()
                await asyncio.sleep_ms(10)

            gyro_bias = offset / 10

            current_angle = 0
            last_time = time.ticks_us()

            self.set_speed(speed * direction, -speed * direction)

            stop_threshold = target_angle

            while abs(current_angle) < stop_threshold:
                now = time.ticks_us()
                dt = time.ticks_diff(now, last_time) / 1000000.0
                last_time = now

                gyro_speed = self.inertial_sensor.read_gyro_raw_z() - gyro_bias
                current_angle += gyro_speed * dt

                await asyncio.sleep_ms(5)

            self.stop()
            await self.response_queue.put({"i": cmd_id, "s": "ok"})
        except asyncio.CancelledError:
            self.stop()
            await self.response_queue.put({"i": cmd_id, "s": "stopped"})
        except Exception as e:
            self.stop()
            await self.response_queue.put({"i": cmd_id, "e": str(e)})
