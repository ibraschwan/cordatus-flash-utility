import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Monitor, 
  Cpu, 
  HardDrive, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Loader2
} from "lucide-react";
import { JetsonDevice, FlashProfile } from "../types";
import DeviceService from "../services/deviceService";

interface DeviceSelectionProps {
  onFlashStart: (device: JetsonDevice, profile: FlashProfile) => void;
  selectedDevice?: JetsonDevice | null;
  selectedProfile?: FlashProfile | null;
}

export default function DeviceSelection({ onFlashStart, selectedDevice: initialDevice, selectedProfile: initialProfile }: DeviceSelectionProps) {
  const [selectedDevice, setSelectedDevice] = useState<JetsonDevice | null>(initialDevice || null);
  const [selectedProfile, setSelectedProfile] = useState<FlashProfile | null>(initialProfile || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [devices, setDevices] = useState<JetsonDevice[]>([]);
  const [allAvailableDevices, setAllAvailableDevices] = useState<JetsonDevice[]>([]);
  const [profiles, setProfiles] = useState<FlashProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const deviceService = DeviceService.getInstance();

  // Load real device data on component mount
  const loadDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load all available devices from CSV
      const allDevices = await deviceService.getAllAvailableDevices();
      setAllAvailableDevices(allDevices);
      
      // Try to detect USB connections and update device status
      try {
        await deviceService.detectUSBDevices();
        const connectedDevices = await deviceService.getConnectedDevices();
        setDevices(connectedDevices);
        
        // Auto-select first connected device if available
        const connectedDevice = connectedDevices.find(d => d.isConnected);
        if (connectedDevice && !selectedDevice) {
          setSelectedDevice(connectedDevice);
        }
      } catch (usbError) {
        // If USB detection fails, show all devices as non-connected
        console.warn('USB detection failed:', usbError);
        setDevices([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
      console.error('Device loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load profiles when device is selected
  const loadProfiles = async (device: JetsonDevice) => {
    try {
      const deviceProfiles = await deviceService.getFlashProfiles(device);
      setProfiles(deviceProfiles);
      
      // Auto-select recommended profile
      const recommendedProfile = deviceProfiles.find(p => p.tags.includes('recommended'));
      if (recommendedProfile) {
        setSelectedProfile(recommendedProfile);
      } else if (deviceProfiles.length > 0) {
        setSelectedProfile(deviceProfiles[0]);
      }
    } catch (err) {
      console.error('Profile loading error:', err);
      setProfiles([]);
    }
  };

  // Refresh device detection
  const refreshDevices = async () => {
    setIsRefreshing(true);
    await loadDevices();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadProfiles(selectedDevice);
    } else {
      setProfiles([]);
      setSelectedProfile(null);
    }
  }, [selectedDevice]);

  const filteredDevices = devices.filter(device =>
    device.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.module.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get non-available devices (in CSV but not connected)
  const connectedDeviceIds = new Set(devices.map(d => d.id));
  const nonAvailableDevices = allAvailableDevices.filter(device => 
    !connectedDeviceIds.has(device.id) &&
    (device.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
     device.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
     device.product.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFlashStart = () => {
    if (selectedDevice && selectedProfile) {
      onFlashStart(selectedDevice, selectedProfile);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Select Device & Profile</h2>
        <p className="text-gray-400">Choose your Jetson device and flashing configuration</p>
      </motion.div>

      {/* Search and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex space-x-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nvidia-500/50"
          />
        </div>
        <button 
          onClick={refreshDevices}
          disabled={isRefreshing}
          className="btn-secondary flex items-center space-x-2"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Refresh</span>
        </button>
        <button className="btn-secondary flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
      </motion.div>

      {/* Loading/Error States */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Loader2 className="w-8 h-8 text-nvidia-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading device configurations...</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-4 rounded-xl border-red-500/50 bg-red-500/10"
        >
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading devices</span>
          </div>
          <p className="text-red-300 text-sm mt-1">{error}</p>
          <button 
            onClick={loadDevices}
            className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
          >
            Try again
          </button>
        </motion.div>
      )}

      {!isLoading && !error && (
        <div className="space-y-8">
          {/* Connected Devices Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              Connected Devices ({filteredDevices.length})
            </h3>
            <div className="space-y-3">
              {filteredDevices.map((device) => (
                <motion.div
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`glass glass-hover p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedDevice?.id === device.id
                      ? "border-nvidia-500 bg-nvidia-500/10"
                      : "border-white/10"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-nvidia-500 to-nvidia-600 rounded-lg flex items-center justify-center">
                        <Cpu className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{device.vendor} {device.product}</h4>
                        <p className="text-sm text-gray-400">{device.module}</p>
                        <p className="text-xs text-gray-500">Board ID: {device.boardId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {device.isConnected ? (
                        <div className="flex items-center space-x-1 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Not Connected</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Storage Options */}
                  <div className="mt-3 flex space-x-2">
                    {device.storageOptions.map((storage) => (
                      <span
                        key={storage}
                        className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                      >
                        {storage.toUpperCase()}
                      </span>
                    ))}
                  </div>

                  {/* L4T Versions */}
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Supported L4T: {device.supportedL4T.slice(0, 3).join(', ')}
                      {device.supportedL4T.length > 3 && ` +${device.supportedL4T.length - 3} more`}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Non-Available Devices Section */}
          {nonAvailableDevices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
                Available for Flashing ({nonAvailableDevices.length})
              </h3>
              <div className="space-y-3">
                {nonAvailableDevices.map((device) => (
                  <motion.div
                    key={device.id}
                    onClick={() => setSelectedDevice(device)} 
                    className={`glass p-4 rounded-xl cursor-pointer transition-all duration-300 opacity-75 hover:opacity-100 ${
                      selectedDevice?.id === device.id
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-white/10"
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                          <Cpu className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{device.vendor} {device.product}</h4>
                          <p className="text-sm text-gray-400">{device.module}</p>
                          <p className="text-xs text-gray-500">Board ID: {device.boardId}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Not Connected</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Storage Options */}
                    <div className="mt-3 flex space-x-2">
                      {device.storageOptions.map((storage) => (
                        <span
                          key={storage}
                          className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                        >
                          {storage.toUpperCase()}
                        </span>
                      ))}
                    </div>

                    {/* L4T Versions */}
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">
                        Supported L4T: {device.supportedL4T.slice(0, 3).join(', ')}
                        {device.supportedL4T.length > 3 && ` +${device.supportedL4T.length - 3} more`}
                      </div>
                    </div>
                    
                    {/* Warning for non-connected devices */}
                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                      Device must be connected in recovery mode to flash
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Profile Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <HardDrive className="w-5 h-5 mr-2 text-nvidia-500" />
              Flash Profiles ({profiles.length})
            </h3>
            
            {!selectedDevice ? (
              <div className="glass p-6 rounded-xl text-center">
                <Monitor className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Select a device to view available profiles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <motion.div
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile)}
                    className={`glass glass-hover p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedProfile?.id === profile.id
                        ? "border-nvidia-500 bg-nvidia-500/10"
                        : "border-white/10"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{profile.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{profile.name}</h4>
                          <p className="text-sm text-gray-400 mt-1">{profile.description}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            {profile.configuration.jetpackVersion}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {profile.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-xs bg-nvidia-500/20 text-nvidia-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {profile.successRate && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-400">
                            {profile.successRate}%
                          </div>
                          <div className="text-xs text-gray-500">Success Rate</div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* No devices found */}
      {!isLoading && !error && filteredDevices.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Monitor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No devices found</h3>
          <p className="text-gray-400 mb-4">
            {searchTerm ? 'No devices match your search.' : 'No Jetson devices detected.'}
          </p>
          <button 
            onClick={refreshDevices}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Devices</span>
          </button>
        </motion.div>
      )}

      {/* Flash Button */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <button
            onClick={handleFlashStart}
            disabled={!selectedDevice || !selectedProfile || !selectedDevice.isConnected}
            className={`
              flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 mx-auto
              ${selectedDevice && selectedProfile && selectedDevice.isConnected
                ? "btn-primary hover:scale-105 shadow-xl shadow-nvidia-500/30"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            <Zap className="w-5 h-5" />
            <span>
              {!selectedDevice 
                ? "Select Device" 
                : !selectedProfile 
                ? "Select Profile" 
                : !selectedDevice.isConnected 
                ? "Device Not Connected" 
                : "Start Setup Wizard"
              }
            </span>
          </button>
          
          {selectedDevice && selectedProfile && !selectedDevice.isConnected && (
            <p className="text-yellow-400 text-sm mt-2">
              Please connect the device in recovery mode to start flashing
            </p>
          )}

          {selectedDevice && selectedProfile && selectedDevice.isConnected && (
            <div className="glass p-3 rounded-lg mt-4 max-w-md mx-auto">
              <div className="text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Device:</span>
                  <span className="text-white">{selectedDevice.vendor} {selectedDevice.product}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Profile:</span>
                  <span className="text-white">{selectedProfile.name}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Version:</span>
                  <span className="text-white">{selectedProfile.configuration.jetpackVersion}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}