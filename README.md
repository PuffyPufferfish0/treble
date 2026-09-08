# ESP32 I2S Audio Player

A hardware-based audio player built around the ESP32, utilizing a PCM5102A DAC for high-quality I2S digital audio output, a MicroSD card reader for storage, and an analog joystick for intuitive control.

## Features
* **High-Fidelity Audio:** Hardware-decoded streaming via the PCM5102A DAC over the I2S bus.
* **Expandable Storage:** Reads audio files (e.g., 8MB `.mp3` streams) directly from a MicroSD card via SPI.
* **Analog Navigation:** KY-023 joystick integration for track/menu navigation, paired with a dedicated momentary trigger button.
* **Custom PCB:** Designed in KiCad to transition from a breadboard prototype to a clean, modular printed circuit board.

## Hardware Components
* ESP32-DevKitC
* PCM5102A I2S DAC Module *(Note: XSMT pin physically bridged to HIGH for hardware unmuting)*
* MicroSD Card Adapter
* KY-023 Analog Joystick
* Momentary Push Button

## Pin Mapping

| Component | Pin | ESP32 GPIO | Notes |
| :--- | :--- | :--- | :--- |
| **PCM5102A DAC** | BCK | GPIO 26 | I2S Bit Clock |
| | DIN | GPIO 22 | I2S Data In |
| | LCK | GPIO 25 | I2S Word Select |
| | SCK | GPIO 13 | Driven LOW in software |
| **MicroSD Reader**| MISO | GPIO 19 | VSPI Bus |
| | MOSI | GPIO 23 | VSPI Bus |
| | CLK | GPIO 18 | VSPI Bus |
| | CS | GPIO 5 | VSPI Bus |
| **KY-023 Joystick**| VRX | GPIO 32 | Analog Input (Powered via 3.3V) |
| | VRY | GPIO 33 | Analog Input (Powered via 3.3V) |
| **Trigger Button** | Pin 1 | GPIO 27 | Requires `INPUT_PULLUP` |\
## WARNING
this project *is* still in development 



## Software & Dependencies
This project is built using the Arduino IDE/PlatformIO for the ESP32.
* [ESP32-audioI2S](https://github.com/schreibfaul1/ESP32-audioI2S) - Core library for I2S output and MP3 decoding.
* Standard `SPI.h` and `SD.h` libraries for file system management.

- [x] Breadboard prototyping and hardware debugging
- [x] Hardware mute-bypass modification on DAC
- [x] Schematic in KiCad
- [x] PCB layout and routing
- [ ] Custom PCB fabrication and assembly

# trebleIDE

An Electron application with React

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
