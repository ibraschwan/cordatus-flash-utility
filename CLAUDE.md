# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cordatus Flash Utility is a graphical flashing utility for NVIDIA Jetson devices. It provides a user-friendly interface for flashing various Jetson models with different JetPack versions.

## Commands

### Running the Application
```bash
python3 main.py
```

### Direct Script Execution (Advanced)
```bash
./flash_cordatus.sh <product> <device_module> <jetpack_version> <storage_device> <keep_files> <user_name>
```

### Testing GUI Changes
To test GUI modifications, simply run `python3 main.py`. The GUI uses PySimpleGUI (included locally as PySimpleGUI.py).

## Architecture

The project follows a two-tier architecture:

1. **GUI Layer (`main.py`)**: 
   - Uses PySimpleGUI for the interface
   - Handles device selection and validation
   - Executes flash_cordatus.sh as a subprocess
   - Displays real-time progress

2. **Flashing Logic (`flash_cordatus.sh`)**: 
   - Downloads L4T/JetPack files from NVIDIA
   - Prepares and flashes images to Jetson devices
   - Supports both standard and "Super Mode" flashing

3. **Configuration**:
   - `data/template.csv`: Device compatibility matrix
   - `data/urls.sh`: JetPack version URL mappings

## Key Development Notes

- Device compatibility is controlled by `data/template.csv` - this CSV defines which combinations of vendor/product/module/jetpack/storage are valid
- The GUI dynamically populates dropdowns based on template.csv entries
- All flashing operations require sudo permissions
- The script downloads large files (several GB) from NVIDIA servers
- Progress tracking is done via subprocess output parsing in the GUI