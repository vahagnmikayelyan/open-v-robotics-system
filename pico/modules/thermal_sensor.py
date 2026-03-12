from machine import Pin
from queues import Queue

import uasyncio as asyncio
import onewire, ds18x20
import config

class ThermalSensor:
    def __init__(self, response_queue):
        print("Initialization Thermal sensor")

        self.queue = Queue()
        self.response_queue = response_queue

        self.data_pin = Pin(config.TEMP_SENSOR_PIN)
        self.sensor = ds18x20.DS18X20(onewire.OneWire(self.data_pin))
        self.roms = self.sensor.scan()

        if not self.roms:
            print("TEMP ERROR: No DS18B20 sensors found!")

    def add_command(self, cmd):
        self.queue.put_nowait(cmd)

    async def run(self):
        while True:
            cmd = await self.queue.get()
            action = cmd.get("a")
            id = cmd.get("i")

            if action == "get" and self.roms:
                temp = await self.read_temp_async()
                await self.response_queue.put({"i": id, "v": temp})

    async def read_temp_async(self):
        try:
            self.sensor.convert_temp()
            await asyncio.sleep_ms(750) 

            return self.sensor.read_temp(self.roms[0])
        except Exception as e:
            return f"Error: {str(e)}"