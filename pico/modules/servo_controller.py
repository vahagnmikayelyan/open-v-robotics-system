from machine import Pin, PWM
from queues import Queue

import uasyncio as asyncio
import config

class ServoController:
    """
    Controller for High-Torque Digital Servo (e.g., 20kg, 270 degrees).
    Handles PWM generation, angle calculation, and smooth movement mechanisms
    to prevent mechanical stress on the robot's head.
    """
    def __init__(self, response_queue):
        print("Initialization Servo controller")

        self.queue = Queue()
        self.response_queue = response_queue
        self.current_task = None

        self.pwm = PWM(Pin(config.SERVO_HEAD_PIN))
        self.pwm.freq(config.SERVO_HEAD_PWM_FREQ)

        # Convert microseconds (us) to nanoseconds (ns) for higher precision on Pico
        self.min_ns = config.SERVO_HEAD_MIN_US * 1000
        self.max_ns = config.SERVO_HEAD_MAX_US * 1000
        self.max_angle_range = config.SERVO_HEAD_MAX_ANGLE

        # Calculate "nanoseconds per degree" resolution
        self.ns_per_degree = (self.max_ns - self.min_ns) / self.max_angle_range

        # Define CENTER position (Logical Zero for the robot head)
        # Usually, 1500us is the absolute center for servos
        self.center_ns = 1_500_000

        # Store current logical angle to ensure smooth transitions
        self.current_angle = 0

        # Initial position: Center (0 degrees)
        self.set_angle_instant(0)

    def add_command(self, cmd):
        self.queue.put_nowait(cmd)

    async def run(self):
        while True:
            cmd = await self.queue.get()
            action = cmd.get("a")
            cmd_id = cmd.get("i")
            target_angle = cmd.get("v", 0)

            try:
                if action == "rotate":
                    if self.current_task:
                        self.current_task.cancel()
                    self.current_task = asyncio.create_task(self.move_smooth_task(target_angle, cmd_id))

                elif action == "disable":
                    self.disable()
                    await self.response_queue.put({"i": cmd_id, "s": "ok"})
            except Exception as e:
                await self.response_queue.put({"i": cmd_id, "e": str(e)})

    async def move_smooth_task(self, target_angle, cmd_id):
        try:
            await self.move_smooth_async(target_angle)
            await self.response_queue.put({"i": cmd_id, "s": "ok"})
        except asyncio.CancelledError:
            pass
        except Exception as e:
            await self.response_queue.put({"i": cmd_id, "e": str(e)})

    async def move_smooth_async(self, target_angle, speed_ms=20):
        target_angle = max(min(target_angle, config.SERVO_HEAD_SOFT_MAX_ANGLE), config.SERVO_HEAD_SOFT_MIN_ANGLE)

        start_angle = self.current_angle
        step = 1 if target_angle > start_angle else -1

        if int(start_angle) == int(target_angle):
            return

        for angle in range(int(start_angle), int(target_angle) + step, step):
            self.set_angle_instant(angle)
            await asyncio.sleep_ms(speed_ms)

        self.set_angle_instant(target_angle)

    def _angle_to_ns(self, angle):
        offset_ns = angle * self.ns_per_degree
        target_ns = self.center_ns + offset_ns

        if target_ns < self.min_ns: target_ns = self.min_ns
        if target_ns > self.max_ns: target_ns = self.max_ns

        return int(target_ns)

    def set_angle_instant(self, angle):
        ns = self._angle_to_ns(angle)
        self.pwm.duty_ns(ns)
        self.current_angle = angle

    def disable(self):
        self.pwm.duty_ns(0)
