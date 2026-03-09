from machine import Pin, PWM
from queues import Queue

import config
import time

"""
HARDWARE LOGIC (INVERTED):
Based on the driver datasheet:
- Signal LOW (0V)  -> LED turns ON
- Signal HIGH (3.3V) -> LED turns OFF
"""

class Led:
    def __init__(self, pin_num, freq):
        self.pwm = PWM(Pin(pin_num))
        self.pwm.freq(freq)

        # SAFETY: Turn off immediately upon initialization
        self.off()

    def _percent_to_u16_inverted(self, percent):
        # Clamp percentage between 0 and 100
        percent = max(min(percent, 100), 0)

        # Invert the math
        # If percent is 100, we want 0. If percent is 0, we want 65535.
        duty = int(65535 - (percent / 100 * 65535))
        return duty

    def on(self, brightness=100):
        duty = self._percent_to_u16_inverted(brightness)
        self.pwm.duty_u16(duty)

    def off(self):
        self.pwm.duty_u16(65535)

class LightController:
    def __init__(self, response_queue):
        print("Initializing Light Controller")
        
        self.queue = Queue()
        self.response_queue = response_queue

        # Initialize individual LEDs using pins from config
        self.left = Led(config.LED_LEFT_PIN, config.LED_PWM_FREQ)
        self.right = Led(config.LED_RIGHT_PIN, config.LED_PWM_FREQ)
        
        # Ensure everything is off at startup
        self.off()

    def add_command(self, cmd):
        self.queue.put_nowait(cmd)

    async def run(self):
        while True:
            cmd = await self.queue.get()
            action = cmd.get("a")
            left_val = cmd.get("l", 50)
            right_val = cmd.get("r", 50)
            id = cmd.get("i")

            if action == "light":
                self.on(left_val, right_val)
                await self.response_queue.put({"i": id, "s": "ok"})

            if action == "turnOn":
                self.on(50, 50)
                await self.response_queue.put({"i": id, "s": "ok"})

            if action == "turnOff":
                self.off()
                await self.response_queue.put({"i": id, "s": "ok"})

    def on(self, left_percent=100, right_percent=100):
        self.left.on(left_percent)
        self.right.on(right_percent)

    def off(self):
        self.left.off()
        self.right.off()