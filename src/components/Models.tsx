import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Download, 
  Search, 
  Filter,
  Eye,
  Brain,
  Bot,
  Cpu,
  CheckCircle,
  Clock,
  Star,
  Container,
  Monitor
} from "lucide-react";
import ContainerBrowser from './ContainerBrowser';
import { JetsonDevice } from '../types';
import DeviceService from '../services/deviceService';

export default function Models() {
  const [viewMode, setViewMode] = useState<'models' | 'containers'>('containers');
  const [connectedDevice, setConnectedDevice] = useState<JetsonDevice | null>(null);
  
  const deviceService = DeviceService.getInstance();

  useEffect(() => {
    loadConnectedDevice();
  }, []);

  const loadConnectedDevice = async () => {
    try {
      const devices = await deviceService.getConnectedDevices();
      const connected = devices.find(d => d.isConnected);
      if (connected) {
        setConnectedDevice(connected);
      }
    } catch (error) {
      console.error('Failed to load connected device:', error);
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
        <h2 className="text-3xl font-bold text-white mb-2">AI Models & Containers</h2>
        <p className="text-gray-400">
          {viewMode === 'containers' 
            ? 'Jetson-containers ecosystem for AI/ML development'
            : 'AI models and libraries optimized for Jetson devices'
          }
        </p>
        {connectedDevice && (
          <p className="text-sm text-nvidia-400 mt-1">
            Connected: {connectedDevice.vendor} {connectedDevice.product}
          </p>
        )}
      </motion.div>

      {/* View Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="glass p-1 rounded-lg">
          <button
            onClick={() => setViewMode('containers')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'containers' 
              ? 'bg-nvidia-500/20 text-nvidia-400' 
              : 'text-gray-400 hover:text-white'
            }`}
          >
            <Container className="w-4 h-4" />
            <span>Containers</span>
          </button>
          <button
            onClick={() => setViewMode('models')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'models' 
              ? 'bg-nvidia-500/20 text-nvidia-400' 
              : 'text-gray-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Models</span>
          </button>
        </div>
      </motion.div>

      {/* Content based on view mode */}
      {viewMode === 'containers' ? (
        <ContainerBrowser device={connectedDevice} />
      ) : (
        <div className="text-center py-20">
          <Package className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">Models Library Coming Soon</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            We're working on a comprehensive model library with pre-trained models 
            optimized for Jetson devices. For now, explore the containers ecosystem!
          </p>
          <button
            onClick={() => setViewMode('containers')}
            className="btn-primary mt-6"
          >
            Browse Containers
          </button>
        </div>
      )}
    </div>
  );
}