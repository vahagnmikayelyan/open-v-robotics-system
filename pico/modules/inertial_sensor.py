from machine import Pin, I2C
from queues import Queue
from libs.mpu9250 import MPU9250

import config

class InertialSensor:
    def __init__(self, response_queue):
        print('Initialization INU sensor')

        self.queue = Queue()
        self.response_queue = response_queue

        self.i2c = I2C(config.MPU9250_I2C_ID, scl=Pin(config.MPU9250_SCL_PIN), sda=Pin(config.MPU9250_SDA_PIN))
        self.sensor = MPU9250(self.i2c)
        self.sensor.mpu6500.calibrate()

    def add_command(self, cmd):
        self.queue.put_nowait(cmd)

    async def run(self):
        while True:
            cmd = await self.queue.get()
            action = cmd.get("a")
            id = cmd.get("i")

            if action == "get":
                acc = self.sensor.acceleration # (x, y, z)
                gyro = self.sensor.gyro         # (x, y, z)

                await self.response_queue.put({"i": id, "a": list(acc), "g": list(gyro)})