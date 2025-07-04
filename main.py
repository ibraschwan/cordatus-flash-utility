################################################################################
# Description:
#   This Python script provides a graphical interface for flashing Jetson devices.
#   It utilizes Python's subprocess module to execute a bash script (flash_cordatus.sh)
#   with customizable parameters such as product, module, JetPack
#   version, storage device, and user name. The subprocess module allows
#   communication with the bash script, enabling the display of progress and output
#   in the GUI window.
#
# Usage:
#   python3 main.py
#
# Notes:
#   - Ensure that the required dependencies (PySimpleGUI, pandas) are installed.
#   - Make sure to run the script on a system with appropriate permissions (e.g., sudo).
#   - Connect your forced recovery device to the host computer after running the program.
#   - Adjust the paths and filenames as necessary to match your environment.
#   - The GUI provides options for selecting device parameters and initiating the flashing process.
#   - Output and progress are displayed in the GUI window during the flashing operation.
#
# Copyright 2024 OmniWise Teknoloji A.S.
#
# Licensed under the GNU General Public License, version 3 (GPLv3).
# You may obtain a copy of the License at
#
#     https://www.gnu.org/licenses/gpl-3.0.html
#
# This script is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.
################################################################################


"""Python's subprocess module allows you to run other programs from within Python code,\
    enabling communication with them and retrieving their output."""
import subprocess
import threading
import getpass
from collections import deque
import PySimpleGUI as sg
import pandas as pd

TOGGLE_BTN_OFF = "data/unchecked.png"
TOGGLE_BTN_ON = "data/checked.png"
TEXT_COLOR = 'chartreuse2'
HIGHLIGHT_COLOR = "#94ff00"
GRAY_BACKGROUND = "#262626"
DARK_GRAY_BACKGROUND = "#0d0d0d"
GRAY_TITLE_COLOR = '#dcf1d7'

df_org = pd.read_csv('data/template.csv')
combo_names = ['ComboVendor','ComboProduct','ComboModule','ComboJetpack', 'ComboStorage']
stop_service = ['sudo', 'systemctl', 'stop', 'udisks2.service']

font = ("Arial", 17)
small_font = ("Arial", 12)
csize = (30,10)
osize = (csize[0]+34, csize[1])
main_padding = ((40,40),(10,20))
padding_value = ((20,20),(0,10))
padding_value_ext = ((0,0),(0,10))
username = getpass.getuser()

sg.theme('DarkBlack')

# Stop udisk service
try:
    subprocess.run(stop_service, check=True)
    print("udisks2.service stopped successfully.")
except subprocess.CalledProcessError as e:
    print(f"Error stopping udisks2.service: {e}")

def disable(window):
    """Function disabling inuputs during flashing."""
    window['ComboVendor'].update(disabled=True)
    window['ComboProduct'].update(disabled=True)
    window['ComboModule'].update(disabled=True)
    window['ComboJetpack'].update(disabled=True)
    window['ComboStorage'].update(disabled=True)
    window['KeepFiles'].update(disabled=True)
    window['SudoPass'].update(disabled=True)
    window['Run'].update(disabled=True)

def enable(window):
    """Function enabling inuputs after flashing."""
    window['ComboVendor'].update(disabled=False)
    window['ComboProduct'].update(disabled=False)
    window['ComboModule'].update(disabled=False)
    window['ComboJetpack'].update(disabled=False)
    window['ComboStorage'].update(disabled=False)
    window['KeepFiles'].update(disabled=False)
    window['SudoPass'].update(disabled=False)
    window['Run'].update(disabled=False)

def update_text_element(window, values):
    """Function displaying outputs during flashing."""
    is_download_finished = False
    sudo_command = f"echo '{values['SudoPass']}' | sudo -E -S bash flash_cordatus.sh\
          '{values['ComboProduct']}' '{values['ComboModule']}'\
              '{values['ComboJetpack']}' '{values['ComboStorage']}'\
                  '{str(window['KeepFiles'].metadata)}' '{username}'"
    process = subprocess.Popen(sudo_command, shell=True, stdout=subprocess.PIPE,\
                                stderr=subprocess.STDOUT)
    output_deque = deque(maxlen=20)
    while True:
        try :
            line = process.stdout.readline().decode('utf-8')
            if line == "Downloading has been finished!\n":
                is_download_finished = True
            print(line)
            if not is_download_finished and '%' in line:
                out=line.split("%")[0].split()[-1]
                print(out)
                window['Download-Progress'].update(current_count=int(out))
                window['Download_Text'].update(value=f"Download Progress: {int(out)}%")
                continue
            output_deque.append(line)
            window['-OUTPUT-'].update(value=''.join(list(output_deque)))
            if not line:
                break
        except Exception as err:
            sg.cprint(err, text_color='red')
    enable(window)

def execute(window, values):
    """Function that starts flashing."""
    disable(window)
    thread = threading.Thread(target=update_text_element, args=(window,values))
    thread.daemon = True
    thread.start()

def handle_titlebar_exit(event):
    """Function handles titlebar exit event."""
    if event == '-CLOSE-':
        layout_window.close()

def event_loop(window):
    """Function that starts the main window."""
    graphic_off = False
    while True:
        event, values = window.read()
        handle_titlebar_exit(event)
        if event == sg.WIN_CLOSED or event == 'Exit':
            break
        if event == 'Run':
            if not values['SudoPass']:
                continue
            for cname in combo_names:
                if values[cname] == "":
                    break
            else:
                execute(window, values)
        elif event in ['ComboVendor']:
            df = df_org.copy()
            df = df[df.Vendor ==values['ComboVendor']]
            window['ComboProduct'].update(values = df.Product.unique().tolist())
            window['ComboModule'].update(values = [])
            window['ComboJetpack'].update(values = [])
            window['ComboStorage'].update(values = [])
        elif event in ['ComboProduct']:
            df = df_org.copy()
            df = df[df.Vendor ==values['ComboVendor']]
            df = df[df.Product ==values['ComboProduct']]
            window['ComboModule'].update(values = df.Module.unique().tolist())
            window['ComboJetpack'].update(values = [])
            window['ComboStorage'].update(values = [])
        elif event in ['ComboModule']:
            df = df_org.copy()
            df = df[df.Vendor ==values['ComboVendor']]
            df = df[df.Product ==values['ComboProduct']]
            df = df[df.Module ==values['ComboModule']]
            window['ComboJetpack'].update(values = df.Jetpack.unique().tolist())
            window['ComboStorage'].update(values = [])
        elif event in ['ComboJetpack']:
            df = df_org.copy()
            df = df[df.Vendor ==values['ComboVendor']]
            df = df[df.Product ==values['ComboProduct']]
            df = df[df.Module ==values['ComboModule']]
            df = df[df.Jetpack ==values['ComboJetpack']]
            window['ComboStorage'].update(values = df.Storage.unique().tolist())
        elif event == 'KeepFiles':
            graphic_off = not graphic_off
            if graphic_off:
                window['KeepFiles'].update(image_filename=TOGGLE_BTN_ON)
            else:
                window['KeepFiles'].update(image_filename=TOGGLE_BTN_OFF)
            window['KeepFiles'].metadata = graphic_off
    window.close()

custom_titlebar_layout = [
    [sg.Image('data/logo_cordatus_half.png',background_color=GRAY_BACKGROUND),
     sg.Text('Cordatus Flash Utility',text_color=GRAY_TITLE_COLOR,\
              background_color=GRAY_BACKGROUND, font=('Any', 10),\
                  key='-CUSTOM_TITLE-', pad=((0,0),(6,0))),
     sg.Text("", expand_x=True,background_color=GRAY_BACKGROUND),
     sg.Button('',size=(30,30) ,image_filename='data/close.png',\
                button_color=("#c1272d", GRAY_BACKGROUND), border_width=0,\
                  key='-CLOSE-')],
]

settings_layout = [
          [sg.Text('Vendor', size=(7, None), font= font, pad= ((20,20),(20,10)),\
                    text_color= TEXT_COLOR), sg.Text(":",font= font, pad= ((0,0),(20,10)),\
                      text_color= TEXT_COLOR), sg.Combo(df_org.Vendor.unique().tolist(),\
                        key='ComboVendor', enable_events=True , size=csize, font= font,\
                          pad= ((20,20),(20,15)), auto_size_text=False, background_color = DARK_GRAY_BACKGROUND,\
                             button_background_color = GRAY_TITLE_COLOR)],
          [sg.Text('Product', size=(7, None),  font= font, pad= padding_value,\
                    text_color= TEXT_COLOR), sg.Text(":",font= font, pad= padding_value_ext,\
                      text_color= TEXT_COLOR), sg.Combo([], key='ComboProduct', enable_events=True,\
                        size=csize,auto_size_text=False, pad= padding_value, font= font,\
                          background_color = DARK_GRAY_BACKGROUND,\
                            button_background_color = GRAY_TITLE_COLOR) ],
          [sg.Text('Module', size=(7, None),  font= font, pad= padding_value,\
                    text_color= TEXT_COLOR), sg.Text(":",font= font, pad= padding_value_ext,\
                      text_color= TEXT_COLOR), sg.Combo([], key='ComboModule', enable_events=True,\
                        size=csize,auto_size_text=False, pad= padding_value, font= font,\
                          background_color = DARK_GRAY_BACKGROUND,\
                            button_background_color = GRAY_TITLE_COLOR)],
          [sg.Text('Jetpack', size=(7, None),  font= font, pad= padding_value,\
                    text_color= TEXT_COLOR), sg.Text(":",font= font, pad= padding_value_ext,\
                      text_color= TEXT_COLOR), sg.Combo([], key='ComboJetpack', enable_events=True,\
                        size=csize,auto_size_text=False,  pad= padding_value, font= font,\
                          background_color = DARK_GRAY_BACKGROUND,\
                            button_background_color = GRAY_TITLE_COLOR) ],
          [sg.Text('Storage', size=(7, None),  font= font, pad= padding_value,\
                    text_color= TEXT_COLOR), sg.Text(":",font= font, pad= padding_value_ext,\
                      text_color= TEXT_COLOR), sg.Combo([], key='ComboStorage', enable_events=True,\
                        size=csize,auto_size_text=False,  pad= padding_value, font= font,\
                              background_color = DARK_GRAY_BACKGROUND,\
                                button_background_color = GRAY_TITLE_COLOR) ],
          [sg.Column([[sg.Text('Sudo', size=(7, None),  font=font, pad= ((20,20),(0,0)),\
                    text_color= TEXT_COLOR)],[sg.Text('(Host Machine)', size=(12, None),  font=("Arial", 9), pad= ((20,20),(0,0)),\
                    text_color= TEXT_COLOR)]],pad= ((0,0),(0,0))), sg.Text(":",font= font, pad= padding_value_ext,\
                      text_color= TEXT_COLOR), sg.InputText(key='SudoPass', password_char='*',\
                        size=(31, 1), pad= padding_value, font=font,\
                          background_color = DARK_GRAY_BACKGROUND)],
          [sg.Button('', image_filename=TOGGLE_BTN_OFF, key='KeepFiles', pad= ((20,20),(10,10)),\
                      button_color=(sg.theme_background_color(), sg.theme_background_color()),\
                        border_width=0, metadata= False), sg.Text('Keep Files After Installation!',\
                          text_color= GRAY_TITLE_COLOR, font=font, pad= ((0,20),(10,10)))]]

layout = [
          [sg.Column(custom_titlebar_layout, expand_x=True, pad=(0, 0),\
                      background_color=GRAY_BACKGROUND)],
          [sg.Frame("Settings",settings_layout, title_color = TEXT_COLOR,\
                     pad = main_padding, font = font)],
          [sg.Multiline(size= osize, autoscroll = True, key='-OUTPUT-', disabled=True,\
                         font= small_font, reroute_cprint=True, pad = main_padding)],
          [sg.Text('Download Progress: 0%', key="Download_Text", font= small_font,\
                    text_color= TEXT_COLOR, pad = ((40,0),(0,10)))],
          [sg.ProgressBar(100, key='Download-Progress', size=(54,10), pad = ((40,40),(0,20)),\
                           bar_color = (TEXT_COLOR, None))],
          [sg.Button('Run', font= font, pad = ((350,15),(10,20)), button_color=TEXT_COLOR,\
                      mouseover_colors = HIGHLIGHT_COLOR),sg.Button('Exit', font= font,\
                        pad = ((15,40),(10,20)), button_color=TEXT_COLOR,\
                          mouseover_colors = HIGHLIGHT_COLOR)],
          [sg.Image('data/logo_cordatus.png', pad = ((10,0),(10,10))),\
            sg.Text('Copyright © 2024, OmniWise Teknoloji A.S.', font= ("Arial", 9))],
        ]

# Creates the window and shows it
layout_window = sg.Window("", layout, grab_anywhere=True, resizable=False, keep_on_top= False,\
                           margins=(0,0), alpha_channel= 0.95, no_titlebar = True, finalize=True)
layout_window['Run'].expand(True, True, True)
layout_window['Exit'].expand(True, True, True)

event_loop(layout_window)
