#!/usr/bin/env bash

################################################################################
# Description:
#   This Bash script automates the process of flashing Jetson devices with
#   customizable parameters such as device vendor, product, module, JetPack
#   version, storage device, and user name. It downloads appropriate files,
#   prepares them, creates an image, and flashes the connected Jetson device.
#
# Usage:
#   ./flash_jetson.sh <product> <device_module> <jetpack_version>
#                      <storage_device> <keep_files> <user_name>
#
#   Parameters:
#     <product>          : The product model of the Jetson device
#     <device_module>    : The specific module of the Jetson device
#     <jetpack_version>  : The JetPack version to be flashed
#     <storage_device>   : The storage device type (Micro SD or NVMe SSD)
#     <keep_files>       : A boolean indicating whether to keep installation files
#     <user_name>        : The username for downloading files and folder creation
#
# Notes:
#   - Make sure to run the script with appropriate permissions (e.g., sudo).
#   - Stop the udisks2 service before flashing if it interferes with the process.
#   - Ensure that the script is executed on a system with Ubuntu 20.04 or 18.04.
#   - The script may prompt for password when accessing system resources.
#   - Adjust the URLs and version numbers based on the latest available releases.
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

# Global Variables
product="$1"
device_module="$2"
jetpack_version="$3"
storage_device="$4"
keep_files="$5"
user_name="$6"
device_flashed=""
device_name=""
host_version=""

# URLs for different Jetson versions
# Each array contains the URLs for BSP files and sample root filesystem
# The version numbers and URLs might need to be updated accordingly
readonly NANO_4_6_1=("https://developer.nvidia.com/embedded/l4t/r32_release_v7.1/t210/jetson-210_linux_r32.7.1_aarch64.tbz2" \
"https://developer.nvidia.com/embedded/l4t/r32_release_v7.1/t210/tegra_linux_sample-root-filesystem_r32.7.1_aarch64.tbz2")
readonly NANO_4_6_2=("https://developer.nvidia.com/embedded/l4t/r32_release_v7.2/t210/jetson-210_linux_r32.7.2_aarch64.tbz2" \
"https://developer.nvidia.com/embedded/l4t/r32_release_v7.2/t210/tegra_linux_sample-root-filesystem_r32.7.2_aarch64.tbz2")
readonly NANO_4_6_3=("https://developer.nvidia.com/downloads/remetpack-463r32releasev73t210jetson-210linur3273aarch64tbz2" \
"https://developer.nvidia.com/downloads/remeleasev73t210tegralinusample-root-filesystemr3273aarch64tbz2")
readonly NANO_4_6_4=("https://developer.nvidia.com/downloads/embedded/l4t/r32_release_v7.4/t210/jetson-210_linux_r32.7.4_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r32_release_v7.4/t210/tegra_linux_sample-root-filesystem_r32.7.4_aarch64.tbz2")
readonly NANO_4_6_5=("https://developer.nvidia.com/downloads/embedded/l4t/r32_release_v7.5/t210/jetson-210_linux_r32.7.5_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r32_release_v7.5/t210/tegra_linux_sample-root-filesystem_r32.7.5_aarch64.tbz2")
readonly AGX_XAVIER_XAVIER_NX_4_6_1=("https://developer.nvidia.com/embedded/l4t/r32_release_v7.1/t186/jetson_linux_r32.7.1_aarch64.tbz2" \
"https://developer.nvidia.com/embedded/l4t/r32_release_v7.1/t186/tegra_linux_sample-root-filesystem_r32.7.1_aarch64.tbz2")
readonly AGX_XAVIER_XAVIER_NX_4_6_2=("https://developer.nvidia.com/embedded/l4t/r32_release_v7.2/t186/jetson_linux_r32.7.2_aarch64.tbz2" \
"https://developer.nvidia.com/embedded/l4t/r32_release_v7.2/t186/tegra_linux_sample-root-filesystem_r32.7.2_aarch64.tbz2")
readonly AGX_XAVIER_XAVIER_NX_4_6_3=("https://developer.nvidia.com/downloads/remksjetpack-463r32releasev73t186jetsonlinur3273aarch64tbz2" \
"https://developer.nvidia.com/downloads/remeleasev73t186tegralinusample-root-filesystemr3273aarch64tbz2" \
"https://developer.nvidia.com/downloads/remsdksjetpack-463r32releasev73t186securebootr3273aarch64tbz2")
readonly AGX_XAVIER_XAVIER_NX_4_6_4=("https://developer.nvidia.com/downloads/embedded/l4t/r32_release_v7.4/t186/jetson_linux_r32.7.4_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r32_release_v7.4/t186/tegra_linux_sample-root-filesystem_r32.7.4_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r32_release_v7.4/t186/secureboot_r32.7.4_aarch64.tbz2")
readonly AGX_XAVIER_XAVIER_NX_4_6_5=("https://developer.nvidia.com/downloads/embedded/l4t/r32_release_v7.5/t186/jetson_linux_r32.7.5_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r32_release_v7.5/t186/tegra_linux_sample-root-filesystem_r32.7.5_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r32_release_v7.5/t186/secureboot_r32.7.5_aarch64.tbz2")
readonly ALL_5_0_2=("https://developer.nvidia.com/embedded/l4t/r35_release_v1.0/release/jetson_linux_r35.1.0_aarch64.tbz2" \
"https://developer.nvidia.com/embedded/l4t/r35_release_v1.0/release/tegra_linux_sample-root-filesystem_r35.1.0_aarch64.tbz2")
readonly ALL_5_1=("https://developer.nvidia.com/downloads/jetson-linux-r3521-aarch64tbz2" \
"https://developer.nvidia.com/downloads/linux-sample-root-filesystem-r3521aarch64tbz2")
readonly ALL_5_1_1=("https://developer.nvidia.com/downloads/embedded/l4t/r35_release_v3.1/release/jetson_linux_r35.3.1_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r35_release_v3.1/release/tegra_linux_sample-root-filesystem_r35.3.1_aarch64.tbz2" 
"http://download.comarge.com/omniwise/orin-nx/ONX101_5_1_1.zip")
readonly ALL_5_1_2=("https://developer.nvidia.com/downloads/embedded/l4t/r35_release_v4.1/release/jetson_linux_r35.4.1_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r35_release_v4.1/release/tegra_linux_sample-root-filesystem_r35.4.1_aarch64.tbz2" \
"http://download.comarge.com/omniwise/orin-nx/ONX101_5_1_2.zip")
readonly ALL_5_1_3=("https://developer.nvidia.com/downloads/embedded/l4t/r35_release_v5.0/release/jetson_linux_r35.5.0_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r35_release_v5.0/release/tegra_linux_sample-root-filesystem_r35.5.0_aarch64.tbz2" \
"http://download.comarge.com/omniwise/orin-nx/ONX101_5_1_3.zip")
readonly ALL_5_1_4=("https://developer.nvidia.com/downloads/embedded/l4t/r35_release_v6.0/release/jetson_linux_r35.6.0_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r35_release_v6.0/release/tegra_linux_sample-root-filesystem_r35.6.0_aarch64.tbz2")
readonly ALL_6_0_DP=("https://developer.nvidia.com/downloads/embedded/l4t/r36_release_v2.0/release/jetson_linux_r36.2.0_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r36_release_v2.0/release/tegra_linux_sample-root-filesystem_r36.2.0_aarch64.tbz2")
readonly ALL_6_0=("https://developer.nvidia.com/downloads/embedded/l4t/r36_release_v3.0/release/jetson_linux_r36.3.0_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r36_release_v3.0/release/tegra_linux_sample-root-filesystem_r36.3.0_aarch64.tbz2" \
"http://download.comarge.com/omniwise/orin-nx/ONX101_6_0.zip")
readonly ALL_6_1=("https://developer.nvidia.com/downloads/embedded/l4t/r36_release_v4.0/release/Jetson_Linux_R36.4.0_aarch64.tbz2" \
"https://developer.nvidia.com/downloads/embedded/l4t/r36_release_v4.0/release/Tegra_Linux_Sample-Root-Filesystem_R36.4.0_aarch64.tbz2")
readonly D131_5_1_3=("http://download.comarge.com/avermedia/orin-nano/D131_ORIN-R2.4.1.5.1.3.tar.gz")
readonly D131_5_1_2=("http://download.comarge.com/avermedia/orin-nano/D131ON-R2.1.0.5.1.2.tar.gz")
readonly D131_5_1_1=("http://download.comarge.com/avermedia/orin-nano/D131ON-R2.0.3.5.1.1.tar.gz")
readonly D315_5_0_2=("https://download.comarge.com/avermedia/agx-orin/D315AO-R2.1.8.5.0.2.tar.gz")
readonly D315_5_1_1=("https://download.comarge.com/avermedia/agx-orin/D315AO-R2.3.1.5.1.1.tar.gz")
readonly D315_5_1_2=("https://download.comarge.com/avermedia/agx-orin/D315AO-R2.4.1.5.1.2.tar.gz")
readonly D315_5_1_3=("https://download.comarge.com/avermedia/agx-orin/D315AO-R2.5.2.5.1.3.tar.gz")
readonly D315_6_0=("https://download.comarge.com/avermedia/agx-orin/D315AO-R3.1.0.6.0.0.tar.gz")
readonly D315_6_1=("https://download.comarge.com/avermedia/agx-orin/D315AO-36.4.0.6.1.tar.gz")
readonly D315_6_2=("https://download.comarge.com/avermedia/agx-orin/D315AO-36.4.3.6.2.tar.gz")
readonly J401_6_1=("https://download.comarge.com/seeed/orin-nx-16/J401ONX16-6.1.tar.gz")

# Functions
function err() {
  echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $*" >&2
}

function d315_62(){
    j_version=$(echo "$jetpack_version" | cut -d " " -f 1)
    cfg_folder_name='generic'
    cd ~/openzeka/JetPack_"${j_version}"_Linux_JETSON_desktop/Linux_for_Tegra || { err "Failed to change directory"; exit 1; }
    sudo tools/l4t_create_default_user.sh -u "nvidia" -p "nvidia" -a -n "tegra-ubuntu" --accept-license
    cd ~/openzeka/JetPack_"${j_version}"_Linux_JETSON_desktop/Linux_for_Tegra/settings/D315 || { err "Failed to change directory"; exit 1; }
    sudo rsync -a --exclude=".*" "./pinmux/" "../../bootloader/"
    sudo chmod +x ./addition_setup.sh
    sudo ./addition_setup.sh 0
    cd ~/openzeka/JetPack_"${j_version}"_Linux_JETSON_desktop/Linux_for_Tegra || { err "Failed to change directory"; exit 1; }
}

# Checking Host Computer Version Compatibility
host_version=$(sudo -S cat /etc/os-release | grep 'VERSION_ID' | cut -d '"' -f 2)
jetpack_initial="${jetpack_version:0:1}"

if [[ "${host_version}" == '20.04' || "${host_version}" == '18.04' ]] || [[ "${host_version}" == '22.04' && "${jetpack_initial}" -ge 5 ]]; then
  echo "Ubuntu version is compatible, processing with flashing"
else
  err "Your host computer Ubuntu version is ${host_version}, please use Ubuntu 20.04 or 18.04"
  exit 1
fi

# Selection of the module
if [[ "${product}" == 'Orin' ]]; then
  
  if [[ "${device_module}" == 'AGX Orin' ]]; then
    device_flashed="agx_orin_devkit"
    device_name="jetson-agx-orin-devkit"
  fi

elif [[ "${product}" == 'Xavier' ]]; then

  if [[ "${device_module}" == 'AGX Xavier' ]]; then
    device_flashed="agx_xavier_xavier_nx"
    device_name="jetson-agx-xavier-devkit"
  elif [[ "${device_module}" == 'Xavier NX' ]]; then
    device_flashed="agx_xavier_xavier_nx"
    device_name="jetson-xavier-nx-devkit"
  fi

elif [[ "${product}" == 'D131L' ]]; then

  if [[ "${device_module}" == 'Orin NX' ]]; then
    device_flashed="D131L"
    device_name="jetson-orin-nano-devkit"
  elif [[ "${device_module}" == 'Orin Nano - 4GB' ]]; then
    device_flashed="D131L"
    device_name="jetson-orin-nano-devkit"
  fi

elif [[ "${product}" == 'D131' ]]; then

  if [[ "${device_module}" == 'Orin Nano' ]]; then

    if [[ "${jetpack_version}" == '5.1.3 - L4T 35.5.0' ]]; then
      device_flashed="D131"
      device_name="jetson-orin-d131"
    elif [[ "${jetpack_version}" == '5.1.2 - L4T 35.4.1' || "${jetpack_version}" == '5.1.1 - L4T 35.3.1' ]]; then
      device_flashed="D131"
      device_name="jetson-orin-nano-d131on"
    elif [[ "${jetpack_version}" == '6.0 - L4T 36.3' ]]; then
      device_flashed="D131"
      device_name="jetson-orin-d131"   
    fi
  fi

elif [[ "${product}" == 'D315' ]]; then
    device_flashed="D315"
    device_name="jetson-agx-orin-d315ao"

elif [[ "${product}" == 'J401' ]]; then
    device_flashed="J401"

elif [[ "${product}" == 'Nano' ]]; then
  device_flashed="Nano"
  device_name="jetson-nano-devkit"

fi

# Checking whether a force recovery device is connected to the host
if [[ ${host_version} == '20.04' ]]; then
  recovery_status=$(lsusb | grep 'NVIDIA Corp.' | cut -d " " -f 7)
elif [[ ${host_version} == '18.04' ]]; then
  recovery_status=$(lsusb | grep 'NVidia Corp.' | cut -d " " -f 7)
fi

if [[ ! "${recovery_status^^}" == 'NVIDIA' ]]; then
  err "Cannot find a force recovery device"
  exit 1
fi

# Flashing the device
# Downloading the required files based on JetPack version and device
jetpack_code=$(echo "${jetpack_version//\./_}" | cut -d " " -f 1)


if (( "${jetpack_code:0:1}" != 4 )) && [[ "${device_flashed}" != "D131" ]] && [[ "${device_flashed}" != "D315" ]] && [[ "${device_flashed}" != "J401" ]]; then
  device_flashed='ALL'
fi

download_link_1="${device_flashed^^}_${jetpack_code}[0]"
download_link_2="${device_flashed^^}_${jetpack_code}[1]"
download_link_3="${device_flashed^^}_${jetpack_code}[2]"
filename_1="bsp_files_${device_flashed}_${jetpack_code}.tbz2"
filename_2="sample_root_files_${device_flashed}_${jetpack_code}.tbz2"
filename_3="secure_boot_${device_flashed}_${jetpack_code}.tbz2"

# Creating necessary folders and downloading files if they don't exist
if [[ ! -d ~/openzeka ]]; then
  if ! sudo -u "${user_name}" mkdir ~/openzeka; then
    err "Unable to create openzeka folder"
    exit 1
  fi
fi

if [[ ! -e ~/openzeka/"${filename_1}" ]]; then
echo "downloading file ${filename_1}"
  if ! sudo -u "${user_name}" wget -O ~/openzeka/"${filename_1}" "${!download_link_1}"; then
    err "Unable to download BSP files"
    exit 1
  fi
fi

if [[ ! -e ~/openzeka/"${filename_2}" ]] && [[ "${device_flashed}" != "D131" ]] && [[ "${device_flashed}" != "D315" ]] && [[ "${device_flashed}" != "J401" ]]; then
echo "downloading file ${filename_2}"
  if ! sudo -u "${user_name}" wget -O ~/openzeka/"${filename_2}" "${!download_link_2}"; then
    err "Unable to download Sample Root Filesystem"
    exit 1
  fi
fi


if [[  "${jetpack_code}" == '4_6_3' || "${jetpack_code}" == '4_6_4' || "${jetpack_code}" == '4_6_5' ||  "${product}" == "ONX-101" ]]; then
echo "downloading file ${filename_3}"
  if [[  "${product}" == 'Xavier' || "${product}" == 'ONX-101' ]]; then
      if [[ ! -e ~/openzeka/"${filename_3}" ]]; then
        if ! sudo -u "${user_name}" wget -O ~/openzeka/"${filename_3}" "${!download_link_3}"; then
          err "Unable to download Secure Boot Files"
          exit 1
        fi
    fi
  fi

fi

echo "Downloading has been finished!"

# # Removing the old folder
if [[ -d ~/openzeka/Linux_for_Tegra ]]; then
  echo "Removing old files..."
  cd ~/openzeka/ || { err "Failed to change directory"; exit 1; }
  sudo rm -r Linux_for_Tegra ./*.txt ./*.sh ./*.ko ./*.conf ./*.common ./*.dtsi ./*.dts ./*.dtb Image
fi

# Extracting the downloaded files

if [[ "${device_flashed}" == "D131" ]] || [[ "${device_flashed}" == "D315" ]]; then
  command="zxf"
elif [[ "${device_flashed}" == "J401" ]]; then
  command="xpf"
else
  command="xf"
fi

echo "Extracting ${filename_1}, this may take a while..."
if ! sudo tar ${command} ~/openzeka/"${filename_1}" -C ~/openzeka/; then
  err "Unable to extract BSP files"
  exit 1
fi

if [[ "${device_flashed}" != "D131" ]] && [[ "${device_flashed}" != "D315" ]] && [[ "${device_flashed}" != "J401" ]]; then

  echo "Extracting ${filename_2}, this may take a while..."
  if ! sudo tar xpf ~/openzeka/"${filename_2}" -C ~/openzeka/Linux_for_Tegra/rootfs/; then
    err "Unable to extract Sample Root Filesystem"
    exit 1
  fi

  if [[ "${jetpack_code}" == '4_6_3' || "${jetpack_code}" == '4_6_4' || "${jetpack_code}" == '4_6_5'  ]]; then
    if [[  "${product}" == 'Xavier' ]]; then
      echo "Extracting ${filename_3} ..."
      if ! sudo tar xvjf ~/openzeka/"${filename_3}" -C ~/openzeka/; then
        err "Unable to extract Secure Boot Files"
        exit 1
      fi
    fi
  fi

fi

# Applying binaries, preparing the additional files and flashing the device based on storage device type

if [[ "${device_flashed}" != "D131" ]] && [[ "${device_flashed}" != "D315" ]] && [[ "${device_flashed}" != "J401" ]]; then

  echo "Applying binaries ..."
  cd ~/openzeka/Linux_for_Tegra/ || { err "Failed to change directory"; exit 1; }
  if ! sudo ./apply_binaries.sh; then
    err "Unable to apply binaries"
    exit 1
  fi

  if ! sudo ./tools/l4t_flash_prerequisites.sh; then
    err "Unable to complete flash prerequisites"
    exit 1
  fi

  if [[  "${product}" == 'ONX-101' ]]; then
    echo "Extracting and preparing ${filename_3} ..."
    cd ~/openzeka/ || { err "Failed to change directory"; exit 1; }
    if ! sudo -u "${user_name}" unzip ~/openzeka/"${filename_3}"; then
      err "Unable to extract Secure Boot Files"
      exit 1
    fi

    chmod u+x orin_nx_replace_files.sh
    sudo ./orin_nx_replace_files.sh

  fi
fi

# Flashing the device

if [[ "${storage_device}" == 'Micro SD' ]]; then
  
  if [[ "${product}" == 'D315' ]]; then
    d315_62
  fi

  if [[ "${device_module}" == 'AGX Orin' && "${jetpack_version}" == '6.0.DP - L4T 36.2' ]] || [[ "${product}" == 'D315' ]]; then
    boot_dev='internal'
  else
    boot_dev='mmcblk0p1'
  fi

  echo "sudo ./flash.sh ${device_name} ${boot_dev}"
  if ! sudo ./flash.sh "${device_name}" "${boot_dev}"; then
    err "Unable to flash the device"
    exit 1
  fi



elif [[ "${storage_device}" == 'NVMe SSD' ]]; then

  if [[ "${product}" == 'ONX-101' ]]; then

    if [[ "${jetpack_code}" == '6_0' ]]; then
      l4t_config="flash_l4t_t234_nvme.xml"
      bootloader_config="generic"
    else
      l4t_config="flash_l4t_external.xml"
      bootloader_config="t186ref"
    fi    

    cd ~/openzeka/Linux_for_Tegra/ || { err "Failed to change directory"; exit 1; }
    if ! sudo ./tools/kernel_flash/l4t_initrd_flash.sh --external-device nvme0n1p1 -c tools/kernel_flash/"${l4t_config}" \
    -p "-c bootloader/${bootloader_config}/cfg/flash_t234_qspi.xml" --showlogs --network usb0 p3509-a02+p3767-0000 internal; then
      err "Unable to flash the device"
      exit 1
    fi

  elif [[ "${product}" == 'D131' ]] || [[ "${product}" == 'D315' ]]; then

    j_version=$(echo "$jetpack_version" | cut -d " " -f 1)
    
    if [[ "${jetpack_version}" == '6.0 - L4T 36.3' ]] || [[ "${jetpack_version}" == '6.1 - L4T 36.4.0' ]] || [[ "${jetpack_version}" == '6.2 - L4T 36.4.3' ]]; then
      cfg_folder_name='generic'
    else
      cfg_folder_name='t186ref'
    fi
    
    if [[ "${product}" == 'D315' ]] && [[ "${jetpack_version}" == '5.0.2 - L4T 35.1' ]] ; then
      cd ~/openzeka/JetPack_"${j_version}"_Linux_JETSON_AGX_ORIN_TARGETS/Linux_for_Tegra || { err "Failed to change directory"; exit 1; }  
    elif [[ "${product}" == 'D315' ]] && [[ "${jetpack_version}" == '6.2 - L4T 36.4.3' ]] ; then
      cd ~/openzeka/JetPack_"${j_version}"_Linux_JETSON_desktop/Linux_for_Tegra || { err "Failed to change directory"; exit 1; }     
    else
      cd ~/openzeka/JetPack_"${j_version}"_Linux_JETSON/Linux_for_Tegra || { err "Failed to change directory"; exit 1; }      
    fi
    
    sudo tools/l4t_create_default_user.sh -u "nvidia" -p "nvidia" -a -n "tegra-ubuntu" --accept-license

    if [[ "${product}" == 'D131' ]]; then
      if [[ "${jetpack_version}" == '5.1.3 - L4T 35.5.0' ]]; then
        cam_selection="5"
      else
        cam_selection="8"
      fi
    elif [[ "${product}" == 'D315' ]]; then
      
      if [[ "${jetpack_version}" == '6.1 - L4T 36.4.0' ]] || [[ "${jetpack_version}" == '6.2 - L4T 36.4.3' ]]; then
        cam_selection="0"
      else
        cam_selection="8"
      fi

      if [[ "${jetpack_version}" == '6.2 - L4T 36.4.3' ]]; then
        cd ~/openzeka/JetPack_"${j_version}"_Linux_JETSON_desktop/Linux_for_Tegra/settings/D315 || { err "Failed to change directory"; exit 1; }
        sudo rsync -a --exclude=".*" "./pinmux/" "../../bootloader/"
        sudo chmod +x ./addition_setup.sh
        sudo ./addition_setup.sh "$cam_selection"
        cd ~/openzeka/JetPack_"${j_version}"_Linux_JETSON_desktop/Linux_for_Tegra || { err "Failed to change directory"; exit 1; }
      else
        sudo ./setup.sh "$cam_selection"
      fi
    fi

    if ! sudo ./tools/kernel_flash/l4t_initrd_flash.sh --external-device nvme0n1p1 -c tools/kernel_flash/flash_l4t_external.xml \
    -p "-c bootloader/${cfg_folder_name}/cfg/flash_t234_qspi.xml" --showlogs --network usb0 "${device_name}" internal; then
      err "Unable to flash the device"
      exit 1
    fi
  elif [[ "${product}" == 'J401' ]]; then

    cd ~/openzeka/mfi_recomputer-orin-j401 || { err "Failed to change directory"; exit 1; }
    if ! sudo ./tools/kernel_flash/l4t_initrd_flash.sh --flash-only --massflash 1 --network usb0  --showlogs; then
      err "Unable to flash the device"
      exit 1
    fi

  else
    echo "./nvsdkmanager_flash.sh --storage nvme0n1p1"
    if ! sudo ./nvsdkmanager_flash.sh --storage nvme0n1p1; then
      err "Unable to flash the device"
      exit 1
    fi
  fi

fi

Removing installation files if requested
if [[ "${keep_files}" == 'False' ]]; then
echo "Deleting installation files"
  if ! sudo rm -r ~/openzeka; then
    err "Unable to delete installation files"
    exit 1
  fi
fi

echo "Your device has been flashed successfully..."

# exit 0