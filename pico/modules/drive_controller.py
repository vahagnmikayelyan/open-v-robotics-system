from machine import Pin, PWM
from queues import Queue

import uasyncio as asyncio
import math
import time
import config

class Motor:
    def __init__(self, pin_a, pin_b):
        self.pwm_a = PWM(Pin(pin_a))
        self.pwm_b = PWM(Pin(pin_b))

        self.pwm_a.freq(config.MOTOR_PWM_FREQ)
        self.pwm_b.freq(config.MOTOR_PWM_FREQ)

        self.stop()

    def _percent_to_u16(self, percent):
        return int((abs(percent) / 100) * 65535)

    def drive(self, speed):
        """
        Speed and direction control.
        speed: from -100 (revers) to 100 (forward). 0 - stop.
        """
        speed = max(min(speed, 100), -100)

        duty = self._percent_to_u16(speed)

        if speed > 0:
            self.pwm_a.duty_u16(duty)
            self.pwm_b.duty_u16(0)
        elif speed < 0:
            self.pwm_a.duty_u16(0)
            self.pwm_b.duty_u16(duty)
        else:
            self.stop()

    def stop(self):
        self.pwm_a.duty_u16(0)
        self.pwm_b.duty_u16(0)

    def brake(self):
        self.pwm_a.duty_u16(65535)
        self.pwm_b.duty_u16(65535)

class DriveController:
    def __init__(self, response_queue, inertial_sensor):
        print("Initialization Drive controller")

        self.queue = Queue()
        self.response_queue = response_queue
        self.inertial_sensor = inertial_sensor
        self.current_task = None

        self.fl = Motor(config.MOTOR_FL_IN1_PIN, config.MOTOR_FL_IN2_PIN)
        self.fr = Motor(config.MOTOR_FR_IN1_PIN, config.MOTOR_FR_IN2_PIN)
        self.bl = Motor(config.MOTOR_BL_IN1_PIN, config.MOTOR_BL_IN2_PIN)
        self.br = Motor(config.MOTOR_BR_IN1_PIN, config.MOTOR_BR_IN2_PIN)

    def add_command(self, cmd):
        self.queue.put_nowait(cmd)

    async def run(self):
        while True:
            cmd = await self.queue.get()
            action = cmd.get("a")
            cmd_id = cmd.get("i")
            speed = cmd.get("s", 50)
            value = cmd.get("v", 0)
            fl_speed = cmd.get("fl", 50)
            fr_speed = cmd.get("fr", 50)
            bl_speed = cmd.get("bl", 50)
            br_speed = cmd.get("br", 50)

            if action == "stop":
                if self.current_task:
                    self.current_task.cancel()
                self.stop()
                await self.response_queue.put({"i": cmd_id, "s": "ok"})
            elif action == "control":
                if self.current_task:
                    self.current_task.cancel()
                self.current_task = asyncio.create_task(self.control_task(fl_speed, fr_speed, bl_speed, br_speed))
            elif action == "move_distance":
                if self.current_task:
                    self.current_task.cancel()
                self.current_task = asyncio.create_task(self.move_distance_task(speed, value, cmd_id))
            elif action == "rotate_angle":
                if self.current_task:
                    self.current_task.cancel()
                self.current_task = asyncio.create_task(self.rotate_angle_task(speed, value, cmd_id))

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

    def calculate_time_for_distance(self, speed_percent, distance_mm):
        wheel_circumference_mm = math.pi * config.WHEEL_DIAMETER_MM
        if speed_percent <= 0:
            return 0
        rpm = (speed_percent / 100) * config.MOTOR_MAX_RPM
        linear_speed_mm_s = (rpm / 60) * wheel_circumference_mm
        return distance_mm / linear_speed_mm_s

    async def control_task(self, fl_speed, fr_speed, bl_speed, br_speed):
        try:
            self.fl.drive(fl_speed)
            self.fr.drive(fr_speed)
            self.bl.drive(bl_speed)
            self.br.drive(br_speed)
        except asyncio.CancelledError:
            self.stop()
            await self.response_queue.put({"i": cmd_id, "s": "stopped"})

    async def move_distance_task(self, speed, distance_mm, cmd_id):
        try:
            abs_distance = abs(distance_mm)
            travel_time = self.calculate_time_for_distance(speed, abs_distance)
            if travel_time <= 0:
                await self.response_queue.put({"i": cmd_id, "s": "ok"})
                return

            direction = 1 if distance_mm >= 0 else -1
            motor_speed = speed * direction

            self.set_speed(motor_speed, motor_speed)
            await asyncio.sleep(travel_time)
            self.stop()
            await self.response_queue.put({"i": cmd_id, "s": "ok"})
        except asyncio.CancelledError:
            self.stop()
            await self.response_queue.put({"i": cmd_id, "s": "stopped"})

    async def rotate_angle_task(self, speed, angle, cmd_id):
        try:
            # Preparation: determine target angle and rotation direction
            target_angle = abs(angle)
            direction = 1 if angle > 0 else -1

            # Short zero-calibration right before movement (takes 0.1 sec)
            # This captures the immediate sensor drift/noise while the robot is stationary
            offset = 0
            for _ in range(10):
                offset += self.inertial_sensor.read_gyro_raw_z()
                await asyncio.sleep_ms(10)

            gyro_bias = offset / 10

            current_angle = 0
            last_time = time.ticks_us()

            # Start motors for a skid-steer tank turn
            self.set_speed(speed * direction, -speed * direction)

            # Tracking loop
            # We subtract ~7 degrees from the target to compensate for the TT motors' inertia
            # Adjust this threshold if the robot overshoots or undershoots
            stop_threshold = target_angle

            while abs(current_angle) < stop_threshold:
                now = time.ticks_us()

                # Calculate delta time (dt) in seconds using Pico's high-res timer
                dt = time.ticks_diff(now, last_time) / 1000000.0
                last_time = now

                # Read the raw Z-axis speed and subtract our calculated bias
                gyro_speed = self.inertial_sensor.read_gyro_raw_z() - gyro_bias

                # Integrate angular velocity to get the current angle
                current_angle += gyro_speed * dt

                # Yield control back to the event loop (high polling rate for accuracy)
                await asyncio.sleep_ms(5)

            # Target reached, stop the motors immediately
            self.stop()
            await self.response_queue.put({"i": cmd_id, "s": "ok"})
        except asyncio.CancelledError:
            self.stop()
            await self.response_queue.put({"i": cmd_id, "s": "stopped"})
