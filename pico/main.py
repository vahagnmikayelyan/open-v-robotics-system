import uasyncio as asyncio
import machine
import json
import config

from queues import Queue

from modules.distance_sensor import DistanceSensor
from modules.drive_controller import DriveController
from modules.fan_controller import FanController
from modules.inertial_sensor import InertialSensor
from modules.light_controller import LightController
from modules.light_sensor import LightSensor
from modules.power_monitor import PowerMonitor
from modules.servo_controller import ServoController
from modules.thermal_sensor import ThermalSensor

class HardwareManager:
    def __init__(self):
        self.uart = machine.UART(config.UART_ID, baudrate=config.UART_BAUDRATE, tx=machine.Pin(config.UART_TX_PIN), rx=machine.Pin(config.UART_RX_PIN))

        self.response_queue = Queue()

        # Init modules
        self.distance_sensor = DistanceSensor(self.response_queue)
        self.fan = FanController(self.response_queue)
        self.inertial_sensor = InertialSensor(self.response_queue)
        self.drive = DriveController(self.response_queue, self.inertial_sensor)
        self.light = LightController(self.response_queue)
        self.light_sensor = LightSensor(self.response_queue)
        self.power = PowerMonitor(self.response_queue)
        self.head_servo = ServoController(self.response_queue)
        self.thermal_sensor = ThermalSensor(self.response_queue)

        self.modules = {
            "distanceSensor": self.distance_sensor,
            "drive": self.drive,
            "fan": self.fan,
            "inertialSensor": self.inertial_sensor,
            "light": self.light,
            "lightSensor": self.light_sensor,
            "power": self.power,
            "headServo": self.head_servo,
            "thermalSensor": self.thermal_sensor
        }

    async def uart_router(self):
        buffer = b""
        while True:
            if self.uart.any():
                chunk = self.uart.read()
                if chunk:
                    buffer += chunk

                    if len(buffer) > 4096:
                        print("UART buffer overflow, resetting")
                        buffer = b""

                    while b'\n' in buffer:
                        line, buffer = buffer.split(b'\n', 1)
                        line = line.strip()
                        if not line:
                            continue

                        try:
                            data = json.loads(line.decode('ascii'))
                            target = data.get("m")
                            if target in self.modules:
                                self.modules[target].add_command(data)
                        except Exception as e:
                            print(f"JSON Error: {e}, Raw data: {line}")

            await asyncio.sleep(0.005)

    async def uart_sender(self):
        while True:
            resp = await self.response_queue.get()
            try:
                self.uart.write(json.dumps(resp) + "\n")
            except Exception as e:
                print(f"UART Send Error: {e}")

    async def run(self):
        await self.response_queue.put({"m": "pico", "s": "init", "v": "0.0.2"})

        # Run all modules
        await asyncio.gather(
            self.uart_router(),
            self.uart_sender(),
            self.distance_sensor.run(),
            self.drive.run(),
            self.fan.run(),
            self.inertial_sensor.run(),
            self.light.run(),
            self.light_sensor.run(),
            self.power.run(),
            self.head_servo.run(),
            self.thermal_sensor.run()
        )

if __name__ == "__main__":
    core = HardwareManager()
    asyncio.run(core.run())
