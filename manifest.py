# Include standard manifest.py
include("$(MPY_DIR)/ports/rp2/boards/manifest.py")

# Add pico source code folder to frozen
freeze("pico")