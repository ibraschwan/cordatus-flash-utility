import sys
from PyQt6.QtWidgets import QApplication, QMainWindow, QPushButton, QVBoxLayout, QWidget, QTableWidget, QTableWidgetItem, QHeaderView, QLabel
from PyQt6.QtGui import QColor, QPalette
from PyQt6.QtCore import Qt

# Color Palette from PREMIUM_DESIGN_SPEC.md
class AppPalette:
    primary = "#76B900"
    primary_dark = "#5A8C00"
    primary_light = "#8FD400"

    neutral_900 = "#0A0B0D"
    neutral_800 = "#141519"
    neutral_700 = "#1E1F26"
    neutral_600 = "#2A2B35"
    neutral_500 = "#404252"
    neutral_400 = "#6B6D7C"
    neutral_300 = "#9194A1"
    neutral_200 = "#C4C6D0"
    neutral_100 = "#E8E9F0"
    neutral_50 = "#F5F6FA"

    success = "#22C55E"
    warning = "#F59E0B"
    error = "#EF4444"
    info = "#3B82F6"

class JetsonFlashPro(QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("JetsonFlash Pro")
        self.setGeometry(100, 100, 1200, 800)

        # Apply a dark theme
        self.setStyleSheet(f"""
            QMainWindow {{
                background-color: {AppPalette.neutral_800};
            }}
            QWidget {{
                color: {AppPalette.neutral_100};
                font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
                font-size: 16px;
            }}
            QPushButton {{
                background-color: {AppPalette.primary};
                color: {AppPalette.neutral_900};
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {AppPalette.primary_light};
            }}
            QTableWidget {{
                background-color: {AppPalette.neutral_700};
                border: 1px solid {AppPalette.neutral_600};
                gridline-color: {AppPalette.neutral_600};
            }}
            QHeaderView::section {{
                background-color: {AppPalette.neutral_600};
                color: {AppPalette.neutral_100};
                padding: 8px;
                border: none;
                font-weight: bold;
            }}
        """)

        # Main widget and layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)

        # Title
        title_label = QLabel("JetsonFlash Pro")
        title_label.setStyleSheet(f"font-size: 36px; font-weight: bold; color: {AppPalette.neutral_50}; padding: 20px;")
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title_label)

        # Table for device data
        self.table = QTableWidget()
        self.table.setColumnCount(4)
        self.table.setHorizontalHeaderLabels(["Select", "Device", "Serial Number", "Status"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        layout.addWidget(self.table)

        # Buttons
        button_layout = QVBoxLayout()
        self.select_csv_button = QPushButton("Select CSV")
        self.flash_button = QPushButton("Flash Selected Devices")
        button_layout.addWidget(self.select_csv_button)
        button_layout.addWidget(self.flash_button)
        layout.addLayout(button_layout)

        # Connect signals
        self.select_csv_button.clicked.connect(self.load_csv)
        self.flash_button.clicked.connect(self.flash_selected_devices)

    def load_csv(self):
        from PyQt6.QtWidgets import QFileDialog
        file_path, _ = QFileDialog.getOpenFileName(self, "Select CSV File", "", "CSV Files (*.csv)")
        if file_path:
            self.populate_table(file_path)

    def populate_table(self, file_path):
        import csv
        with open(file_path, 'r') as file:
            reader = csv.reader(file)
            header = next(reader) # Skip header
            self.table.setRowCount(0)
            for row_data in reader:
                row = self.table.rowCount()
                self.table.insertRow(row)
                # Add a checkbox for selection
                chkBoxItem = QTableWidgetItem()
                chkBoxItem.setFlags(Qt.ItemFlag.ItemIsUserCheckable | Qt.ItemFlag.ItemIsEnabled)
                chkBoxItem.setCheckState(Qt.CheckState.Unchecked)
                self.table.setItem(row, 0, chkBoxItem)

                self.table.setItem(row, 1, QTableWidgetItem(row_data[0]))
                self.table.setItem(row, 2, QTableWidgetItem(row_data[1]))
                self.table.setItem(row, 3, QTableWidgetItem("Ready"))

    def flash_selected_devices(self):
        import subprocess
        import os
        from PyQt6.QtWidgets import QApplication
        from PyQt6.QtCore import QThread, pyqtSignal

        script_path = os.path.join(os.path.dirname(__file__), "flash_cordatus.sh")

        selected_devices = []
        for row in range(self.table.rowCount()):
            checkbox_item = self.table.item(row, 0)
            if checkbox_item and checkbox_item.checkState() == Qt.CheckState.Checked:
                device_name = self.table.item(row, 1).text()
                serial_number = self.table.item(row, 2).text()
                selected_devices.append((device_name, serial_number))

        if not selected_devices:
            self.log_output.append("No devices selected for flashing.")
            return

        self.log_output.clear()
        self.log_output.append("Starting flashing process...")

        for device_name, serial_number in selected_devices:
            self.log_output.append(f"\nFlashing device: {device_name} (Serial: {serial_number})")
            # Placeholder for actual parameters. You'll need to map these from your CSV/UI
            # to the arguments expected by flash_cordatus.sh
            # Example: product, device_module, jetpack_version, storage_device, keep_files, user_name
            # For now, using dummy values or hardcoded ones for demonstration
            product = "Orin"
            device_module = "AGX Orin"
            jetpack_version = "6.0 - L4T 36.3"
            storage_device = "Micro SD"
            keep_files = "False"
            user_name = os.getlogin() # Get current system username

            command = [
                script_path,
                product,
                device_module,
                jetpack_version,
                storage_device,
                keep_files,
                user_name
            ]

            try:
                process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
                for line in process.stdout:
                    self.log_output.append(line.strip())
                    QApplication.processEvents() # Keep GUI responsive
                for line in process.stderr:
                    self.log_output.append(f"ERROR: {line.strip()}")
                    QApplication.processEvents() # Keep GUI responsive
                process.wait()
                if process.returncode == 0:
                    self.log_output.append(f"Flashing of {device_name} completed successfully.")
                else:
                    self.log_output.append(f"Flashing of {device_name} failed with exit code {process.returncode}.")
            except Exception as e:
                self.log_output.append(f"An error occurred: {e}")

        self.log_output.append("\nFlashing process finished.")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    main_win = JetsonFlashPro()
    main_win.show()
    sys.exit(app.exec())
