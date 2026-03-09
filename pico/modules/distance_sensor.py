from machine import Pin, I2C
from queues import Queue
from libs.vl53l1x import VL53L1X

import config

class DistanceSensor:
    def __init__(self, response_queue):
        print("Initialization Distance sensor")
        
        self.queue = Queue()
        self.response_queue = response_queue

        self.i2c = I2C(config.TOF_LIDAR_I2C_ID, sda=Pin(config.TOF_LIDAR_SDA_PIN), scl=Pin(config.TOF_LIDAR_SCL_PIN))

        try:
            self.sensor = VL53L1X(self.i2c)
        except Exception as e:
            print(f"Error in initialization Distance sensor: {e}")
            self.sensor = None

    def add_command(self, cmd):
        self.queue.put_nowait(cmd)

    async def run(self):
        while True:
            cmd = await self.queue.get()
            action = cmd.get("a")
            id = cmd.get("i")

            if action == "get":
                await self.response_queue.put({"i": id, "v": self.get_distance()})

    def get_distance(self):
        if self.sensor:
            try:
                return self.sensor.read()
            except:
                return None
        return None
