from machine import Pin, PWM
from queues import Queue

import uasyncio as asyncio
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
    def __init__(self, response_queue):
        print("Initialization Drive controller")

        self.queue = Queue()
        self.response_queue = response_queue
        self.current_task = None

        self.fl = Motor(config.MOTOR_FL_IN1_PIN, config.MOTOR_FL_IN2_PIN)
        self.fr = Motor(config.MOTOR_FR_IN1_PIN, config.MOTOR_FR_IN2_PIN)
        self.bl = Motor(config.MOTOR_BL_IN1_PIN, config.MOTOR_BL_IN2_PIN)
        self.br = Motor(config.MOTOR_BR_IN1_PIN, config.MOTOR_BR_IN2_PIN)

    def add_command(self, cmd):
        action = cmd.get("a")

        if action == "stop":
            if self.current_task:
                self.current_task.cancel()

            while not self.queue.empty():
                self.queue.get_nowait()

            print("EMERGENCY STOP: Queue cleared, task cancelled")
        else:
            self.queue.put_nowait(cmd)

    async def run(self):
        while True:
            cmd = await self.queue.get()
            action = cmd.get("a")
            cmd_id = cmd.get("i")
            val = cmd.get("v", 50)
            fl_speed = cmd.get("fl", 50)
            fr_speed = cmd.get("fr", 50)
            bl_speed = cmd.get("bl", 50)
            br_speed = cmd.get("br", 50)

            if action == "stop":
                if self.current_task:
                    self.current_task.cancel()
                self.stop_hardware();
                await self.response_queue.put({"i": cmd_id, "s": "ok"})
            elif action == "control":
                if self.current_task: 
                    self.current_task.cancel()
                self.current_task = asyncio.create_task(self.control_task(fl_speed, fr_speed, bl_speed, br_speed))
            elif action == "move":
                if self.current_task: 
                    self.current_task.cancel()
                self.current_task = asyncio.create_task(self.move_forward_task(val, cmd_id))
            elif action == "back":
                if self.current_task: 
                    self.current_task.cancel()
                self.current_task = asyncio.create_task(self.move_back_task(val, cmd_id))
            elif action == "spin_left":
                if self.current_task: 
                    self.current_task.cancel()
                self.current_task = asyncio.create_task(self.spin_left(val, cmd_id))
            elif action == "spin_right":
                if self.current_task: 
                    self.current_task.cancel()
                self.current_task = asyncio.create_task(self.spin_right(val, cmd_id))

    def set_speed(self, left_speed, right_speed):
        self.fl.drive(left_speed)
        self.bl.drive(left_speed)

        self.fr.drive(right_speed)
        self.br.drive(right_speed)

    def stop(self):
        self.set_speed(0, 0)

    async def control_task(self, fl_speed, fr_speed, bl_speed, br_speed):
        try:
            self.fl.drive(fl_speed)
            self.fr.drive(fr_speed)
            self.bl.drive(bl_speed)
            self.br.drive(br_speed)
        except asyncio.CancelledError:
            self.stop_hardware()

    async def move_forward_task(self, speed, cmd_id):
        try:
            print(f"Moving forward: {speed}")
            self.set_hardware_speed(speed, speed)

            await asyncio.sleep(2) 

            self.stop_hardware()

            await self.response_queue.put({"i": cmd_id, "s": "ok"})
        except asyncio.CancelledError:
            self.stop_hardware()
            await self.response_queue.put({"i": cmd_id, "s": "ok"})

    async def move_back_task(self, speed, cmd_id):
        try:
            print(f"Moving forward: {speed}")
            self.set_hardware_speed(-speed, -speed)

            await asyncio.sleep(2)
            self.stop_hardware()

            await self.response_queue.put({"i": cmd_id, "s": "ok"})
        except asyncio.CancelledError:
            self.stop_hardware()
            await self.response_queue.put({"i": cmd_id, "s": "stopped"})

    def set_hardware_speed(self, left, right):
        self.fl.drive(left)
        self.bl.drive(left)
        self.fr.drive(right)
        self.br.drive(right)

    def stop_hardware(self):
        self.fl.stop()
        self.bl.stop()
        self.fr.stop()
        self.br.stop()

    def move_forward(self, speed=50):
        self.set_speed(speed, speed)

    def move_backward(self, speed=50):
        self.set_speed(-speed, -speed)

    async def spin_left(self, speed=50, cmd_id = 0):
        self.set_hardware_speed(-speed, speed)
        await asyncio.sleep(2) 
        self.stop_hardware()
        await self.response_queue.put({"i": cmd_id, "s": "ok"})

    async def spin_right(self, speed=50, cmd_id = 0):
        self.set_hardware_speed(speed, -speed)
        await asyncio.sleep(2) 
        self.stop_hardware()
        await self.response_queue.put({"i": cmd_id, "s": "ok"})

    def turn_left(self, speed=50):
        self.set_speed(speed * 0.2, speed)

    def turn_right(self, speed=50):
        self.set_speed(speed, speed * 0.2)