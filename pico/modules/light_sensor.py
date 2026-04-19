from machine import ADC, Pin
from queues import Queue

import config

class LightSensor:
    def __init__(self, response_queue):
        print("Initialization Light sensor")

        self.queue = Queue()
        self.response_queue = response_queue

        # Initialize ADC on the specified pin (GP26)
        # ADC values range from 0 (0V) to 65535 (3.3V)
        self.sensor = ADC(Pin(config.LIGHT_SENSOR_PIN))

        self.min_val = 21000   # Value in pitch black
        self.max_val = 53000   # Value in bright light (flashlight)

    def add_command(self, cmd):
        self.queue.put_nowait(cmd)

    async def run(self):
        while True:
            cmd = await self.queue.get()
            action = cmd.get("a")
            cmd_id = cmd.get("i")

            if action == "get":
                try:
                    raw = self.read_raw()
                    await self.response_queue.put({"i": cmd_id, "v": raw, "p": self.get_percentage(raw)})
                except Exception as e:
                    await self.response_queue.put({"i": cmd_id, "e": str(e)})

    def read_raw(self):
        return self.sensor.read_u16()

    def get_percentage(self, raw=None):
        if raw is None:
            raw = self.read_raw()

        if raw < self.min_val:
            raw = self.min_val
        if raw > self.max_val:
            raw = self.max_val

        percent = (raw - self.min_val) * 100 / (self.max_val - self.min_val)

        return int(percent)

    def is_dark(self, threshold=20):
        return self.get_percentage() < threshold
