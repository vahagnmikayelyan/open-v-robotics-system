from machine import Pin, PWM
from queues import Queue

import config

class FanController:
    def __init__(self, response_queue):
        print("Initializing Fan Controller")

        self.queue = Queue()
        self.response_queue = response_queue

        self.pin = Pin(config.FAN_PIN, Pin.OUT)
        self.pwm = PWM(self.pin)
        self.pwm.freq(config.FAN_PWM_FREQ)
        self.speed = 0
        self.setSpeed(0)

    def add_command(self, cmd):
        self.queue.put_nowait(cmd)

    async def run(self):
        while True:
            cmd = await self.queue.get()
            action = cmd.get("a")
            id = cmd.get("i")
            val = cmd.get("v", 50)

            if action == "changeSpeed":
                self.setSpeed(val)
                await self.response_queue.put({"i": id, "s": "ok"})

    def setSpeed(self, percentage):
        if percentage < 0: percentage = 0
        if percentage > 100: percentage = 100

        self.speed = percentage

        duty = int(percentage * 65535 / 100)
        self.pwm.duty_u16(duty)