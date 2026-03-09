from machine import Pin, I2C
from queues import Queue

import config

class PowerMonitor:
    def __init__(self, response_queue):
        print("Initializing Power monitor")

        self.queue = Queue()
        self.response_queue = response_queue

        self.i2c = I2C(config.INA219_I2C_ID, sda=Pin(config.INA219_SDA_PIN), scl=Pin(config.INA219_SCL_PIN), freq=400000)
        self.device_addr = config.INA219_I2C_ADDR

    def add_command(self, cmd):
        self.queue.put_nowait(cmd)

    async def run(self):
        while True:
            cmd = await self.queue.get()
            action = cmd.get("a")
            id = cmd.get("i")

            if action == "get":
                voltage, percentage = self.get_battery_status()
                await self.response_queue.put({"i": id, "v": voltage, "p": percentage})

    def get_battery_status(self):
        voltage = self.get_voltage()
        percentage = self.calculate_percentage(voltage)
        return round(voltage, 2), percentage

    def get_voltage(self):
        try:
            data = self.i2c.readfrom_mem(self.device_addr, 0x02, 2)
            raw_value = (data[0] << 8) | data[1]
            value_shifted = raw_value >> 3
            voltage = value_shifted * 0.004
            
            return voltage
        except:
            return 0.0

    def calculate_percentage(self, voltage):
        min_v = 6.4
        max_v = 8.4

        if voltage < min_v: return 0
        if voltage > max_v: return 100

        percent = (voltage - min_v) / (max_v - min_v) * 100
        return int(percent)
