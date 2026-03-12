from machine import Pin, PWM
from queues import Queue

import uasyncio as asyncio
import time
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
            id = cmd.get("i")
            target_angle = cmd.get("v", 0)

            if action == "rotate":
                if self.current_task:
                    self.current_task.cancel()
                self.current_task = asyncio.create_task(self.move_smooth_task(target_angle, id))

            elif action == "disable":
                self.disable()
                await self.response_queue.put({"i": id, "status": "done"})

    async def move_smooth_task(self, target_angle, cmd_id):
        try:
            await self.move_smooth_async(target_angle)
            await self.response_queue.put({"i": cmd_id, "status": "done"})
        except asyncio.CancelledError:
            pass

    async def move_smooth_async(self, target_angle, speed_ms=20):
        # Safety Limits
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
        # Calculate offset from the center
        offset_ns = angle * self.ns_per_degree
        target_ns = self.center_ns + offset_ns

        # Safety Clamping: Ensure we never send a signal outside the physical limits
        # This prevents the servo from hitting its internal mechanical stops
        if target_ns < self.min_ns: target_ns = self.min_ns
        if target_ns > self.max_ns: target_ns = self.max_ns
        
        return int(target_ns)

    def set_angle_instant(self, angle):
        """
        Moves the servo to the target angle immediately (Maximum speed).
        """
        ns = self._angle_to_ns(angle)
        self.pwm.duty_ns(ns)
        self.current_angle = angle

    def move_smooth(self, target_angle, speed_ms=20):
        """
        Moves the servo smoothly to the target angle by breaking the movement into small steps.

        :param target_angle: Desired angle in degrees (relative to center 0).
        :param speed_ms: Delay in milliseconds between steps. Higher = Slower/Smoother.
        """
        if target_angle > config.SERVO_HEAD_SOFT_MAX_ANGLE: target_angle = config.SERVO_HEAD_SOFT_MAX_ANGLE
        if target_angle < config.SERVO_HEAD_SOFT_MIN_ANGLE: target_angle = config.SERVO_HEAD_SOFT_MIN_ANGLE
        
        start_angle = self.current_angle
        
        # Determine direction: +1 for moving up, -1 for moving down
        if target_angle > start_angle:
            step = 1
        else:
            step = -1

        # If already at target, do nothing
        if int(start_angle) == int(target_angle):
            return

        # Smooth movement loop
        # We iterate through every degree from start to target
        for angle in range(int(start_angle), int(target_angle) + step, step):
            self.set_angle_instant(angle)
            time.sleep_ms(speed_ms) # Delay controls the speed

        # Ensure we land exactly on the target angle at the end
        self.set_angle_instant(target_angle)

    def disable(self):
        """
        Stops the PWM signal. The servo will stop holding its position (goes limp).
        Useful for saving power or preventing hum when idle.
        """
        self.pwm.duty_ns(0)