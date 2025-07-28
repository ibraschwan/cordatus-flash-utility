# JetsonFlash Pro - Ultimate Jetson Flashing Tool

A premium, modern desktop application for flashing NVIDIA Jetson devices with an elegant glassmorphic UI and professional-grade features.

## 🚀 Features

- **Premium UI**: Glassmorphic design with NVIDIA green accents and smooth animations
- **Device Management**: Auto-detect connected Jetson devices in recovery mode
- **Configuration Profiles**: Pre-built profiles for Production, Developer, and AI Workstation setups
- **Real-time Progress**: Advanced progress tracking with detailed logs
- **Command Palette**: Quick actions with Cmd+K
- **Analytics Dashboard**: Track flash statistics and performance metrics
- **Cross-platform**: Works on Windows, macOS, and Linux

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Rust (Tauri) for native performance
- **UI**: Glassmorphic design with premium animations
- **Build**: Vite for fast development

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- Rust (install from https://rustup.rs/)

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎯 Usage

### Modern Premium App (Recommended)
```bash
npm run dev
```

### Legacy Python Version (Backup)
```bash
python3 main.py
```

---

# Original Cordatus Flashing Utility

## Overview
This project provides a utility for flashing a wide range of Jetson devices, ranging from Jetson Nano to Jetson AGX Orin, with support for JetPack versions ranging from 4.6.1 - L4T 32.7.1 up to 6.0 - L4T 36.3. The utility can flash storage devices including NVMe SSD and Micro SD cards.

The utility consists of a Python graphical user interface (GUI) and a Bash script. The GUI allows users to select options from dropdown lists based on vendor, product, module, and JetPack version, making the flashing process intuitive and user-friendly. The Bash script automates the process of downloading, extracting, and flashing a Jetson Linux image to a device, simplifying the overall workflow.

### Configuration
The configuration file is stored under the folder `data` along with some image files used for the GUI. This configuration file can be updated by users to add their custom devices, but the Bash script file also must be modified accordingly.

### Prerequisites

- Ubuntu 22.04, 20.04 or 18.04
- Python 3.6 or higher (Installation codes are provided in the usage section)
- Pandas (Installation codes are provided in the usage section)
- tkinter (Installation codes are provided in the usage section)
- Qemu User Emulation (Installation codes are provided in the usage section)
- PySimpleGUI (Installation codes are provided in the usage section)
- Stable and high-speed internet connection
- 40GB of free space on your host computer

## Features
- Automated flashing process with customizable parameters.
- Graphical user interface for easy interaction.
- Support for specifying device details such as vendor, product, module, JetPack version, and storage device.
- Option to keep installation files after flashing.

## Usage
Follow these steps to flash your Jetson device:

1. **Clone the Repository**: Clone this repository to your local machine.

   ```bash
   git clone https://github.com/CordatusAI/cordatus-flash-utility.git

2. **Navigate to the Project Directory**: Move into the project directory.

   ```bash
   cd cordatus-flash-utility

3. **Ensure Dependencies**: Make sure you have Python, Pandas and PySimpleGUI installed on your system. If not, you can install them using pip:

   ```bash
   sudo apt update
   sudo apt install qemu-user-static
   sudo apt install python3
   sudo apt install python3-tk
   sudo apt install python3-pip
   pip3 install pandas

4. **Run the Python GUI**: Execute the Python GUI script to initiate the flashing process.

   ```bash
   python3 main.py

5. **Prepare for Flashing**: Connect your Jetson device to your host computer in forced recovery mode (Make sure that the device is connected to the host coputer after the program started as in step 4).

6. **Provide Details**: Users will be prompted to enter the required details such as vendor, product, module, JetPack version, storage device, and password. It's important to note that not every device supports every feature. For instance, for nano devices, the NVMe SSD storage option may not be visible as it's not supported. Users can only choose from the available options presented based on their previous selections.

7. **Begin Flashing**: Click the "Run" button in the GUI to start the flashing process.

8. **Follow On-Screen Instructions**: Follow the progress displayed in the GUI. Ensure that the flashing process completes successfully.

9. **Disconnect Device**: After flashing is complete, safely disconnect your Jetson device from your host computer.
    
11. **Complete Installation**: This application only installs Linux for Tegra (L4T). After the flashing process is complete, log in to your Jetson device and run the following commands to complete the NVIDIA JetPack installation:

```bash
sudo apt update
sudo apt install nvidia-jetpack
```


## Notes
- Make sure to run the Python GUI script with appropriate permissions (e.g., using `sudo`).
- Stop the `udisks2` service before flashing if it interferes with the process.
- Ensure that the flashing script is executed on a system with Ubuntu 22.04, 20.04 or 18.04.
- The script may prompt for password when accessing system resources.
- Adjust the URLs and version numbers in the flashing script based on the latest available releases.
- For D131 devices, the installation is done automatically and does not prompt for a username or password. The default username and password are "nvidia".
- If Super Mode is supported, the utility uses it to flash the device.
