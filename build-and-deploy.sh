#!/bin/bash

PROJECT_DIR="$HOME/open-v-robotics-system"
MPY_DIR="$PROJECT_DIR/micropython"
SRC_DIR="$PROJECT_DIR/pico"
PORT_DIR="$MPY_DIR/ports/rp2"
MY_MANIFEST="$PROJECT_DIR/manifest.py"
CFG_FILE="$PROJECT_DIR/rpi5-pico-swd.cfg"
FIRMWARE_PATH="$PROJECT_DIR/micropython/ports/rp2/build-RPI_PICO/firmware.elf"

if [ ! -f $MY_MANIFEST ]; then echo "Manifest file not found!"; exit 1; fi

echo "--- Building firmware using Manifest ---"
cd $PORT_DIR
make clean BOARD=RPI_PICO
make -j4 BOARD=RPI_PICO FROZEN_MANIFEST=$MY_MANIFEST

if [ ! -f $FIRMWARE_PATH ]; then echo "File not found!"; exit 1; fi

echo "--- Cleaning and flashing Pico via SWD ---"
# Erase everything (2MB) so the old file code doesn't interfere.
# Then upload the new .elf file.
openocd -f $CFG_FILE -c "init; reset halt; flash erase_address 0x10000000 0x200000; program $FIRMWARE_PATH verify; reset run; exit"