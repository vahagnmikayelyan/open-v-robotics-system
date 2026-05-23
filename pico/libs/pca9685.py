import time

_MODE1 = 0x00
_PRESCALE = 0xFE
_LED0_ON_L = 0x06

class PCA9685:
    def __init__(self, i2c, address=0x40):
        self.i2c = i2c
        self.address = address
        self.reset()

    def reset(self):
        self.i2c.writeto_mem(self.address, _MODE1, b'\x00')
        time.sleep_ms(5)

    def set_freq(self, freq):
        prescale = int(25000000.0 / (4096.0 * freq) + 0.5) - 1
        if prescale < 3:
            prescale = 3
        old_mode = self.i2c.readfrom_mem(self.address, _MODE1, 1)[0]
        self.i2c.writeto_mem(self.address, _MODE1, bytes([(old_mode & 0x7F) | 0x10]))
        self.i2c.writeto_mem(self.address, _PRESCALE, bytes([prescale]))
        self.i2c.writeto_mem(self.address, _MODE1, bytes([old_mode]))
        time.sleep_us(500)
        self.i2c.writeto_mem(self.address, _MODE1, bytes([old_mode | 0xA0]))

    def duty(self, channel, value):
        """Set PWM duty for a channel. value: 0-4095."""
        reg = _LED0_ON_L + 4 * channel
        if value <= 0:
            self.i2c.writeto_mem(self.address, reg, bytes([0x00, 0x00, 0x00, 0x10]))
        elif value >= 4095:
            self.i2c.writeto_mem(self.address, reg, bytes([0x00, 0x10, 0x00, 0x00]))
        else:
            self.i2c.writeto_mem(self.address, reg, bytes([0x00, 0x00, value & 0xFF, (value >> 8) & 0x0F]))

    def off(self, channel):
        self.duty(channel, 0)

    def all_off(self):
        for ch in range(16):
            self.off(ch)
