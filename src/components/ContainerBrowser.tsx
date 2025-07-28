import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Container,
  Download,
  Search,
  Filter,
  Play,
  Terminal,
  Package,
  Brain,
  Bot,
  Eye,
  Cpu,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Trash2,
  RefreshCw
} from "lucide-react";
import TauriService, { ContainerInfo } from "../services/tauriService";

interface ContainerBrowserProps {
  device?: any; // JetsonDevice
}

export default function ContainerBrowser({ device }: ContainerBrowserProps) {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [installingContainers, setInstallingContainers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const tauriService = TauriService.getInstance();

  const containerCategories = [
    {
      id: "ml",
      name: "Machine Learning",
      icon: Brain,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      description: "PyTorch, TensorFlow, ONNX Runtime"
    },
    {
      id: "llm", 
      name: "Large Language Models",
      icon: Terminal,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10", 
      description: "Text generation, chat models"
    },
    {
      id: "vision",
      name: "Computer Vision",
      icon: Eye,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      description: "Object detection, segmentation"
    },
    {
      id: "robotics",
      name: "Robotics", 
      icon: Bot,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      description: "ROS, navigation, control"
    },
    {
      id: "edge-ai",
      name: "Edge AI",
      icon: Cpu,
      color: "text-nvidia-400", 
      bgColor: "bg-nvidia-400/10",
      description: "TensorRT, DeepStream"
    }
  ];

  // Enhanced container list based on jetson-containers ecosystem
  const jetsonContainers: ContainerInfo[] = [
    // ML Frameworks
    {
      name: "l4t-pytorch",
      tag: "r36.2.0",
      category: "ml",
      description: "PyTorch with CUDA support optimized for L4T",
      size: "2.1 GB",
      supported_devices: ["AGX Orin", "Orin NX", "Orin Nano", "AGX Xavier"],
      is_installed: false
    },
    {
      name: "l4t-tensorflow", 
      tag: "r36.2.0",
      category: "ml",
      description: "TensorFlow with GPU acceleration for Jetson",
      size: "3.2 GB", 
      supported_devices: ["AGX Orin", "Orin NX", "AGX Xavier"],
      is_installed: false
    },
    // LLM Containers
    {
      name: "text-generation-webui",
      tag: "latest",
      category: "llm",
      description: "Web interface for running large language models locally",
      size: "8.5 GB",
      supported_devices: ["AGX Orin", "Orin NX"],
      is_installed: false
    },
    {
      name: "nanollm",
      tag: "latest", 
      category: "llm",
      description: "Optimized LLM inference engine for Jetson devices",
      size: "3.2 GB",
      supported_devices: ["AGX Orin", "Orin NX", "Orin Nano"],
      is_installed: false
    },
    {
      name: "ollama",
      tag: "latest",
      category: "llm", 
      description: "Run large language models locally with ease",
      size: "4.1 GB",
      supported_devices: ["AGX Orin", "Orin NX"],
      is_installed: false
    },
    // Vision/VLM
    {
      name: "llava",
      tag: "latest",
      category: "vision",
      description: "Large Language and Vision Assistant multimodal model",
      size: "12.1 GB",
      supported_devices: ["AGX Orin"],
      is_installed: false
    },
    {
      name: "nanoowl",
      tag: "latest",
      category: "vision", 
      description: "Open vocabulary object detection with ViT",
      size: "2.8 GB",
      supported_devices: ["AGX Orin", "Orin NX", "Orin Nano"],
      is_installed: false
    },
    {
      name: "nanosam",
      tag: "latest",
      category: "vision",
      description: "Segment Anything Model optimized for Jetson",
      size: "1.9 GB", 
      supported_devices: ["AGX Orin", "Orin NX", "Orin Nano"],
      is_installed: false
    },
    // Robotics
    {
      name: "ros",
      tag: "humble-desktop",
      category: "robotics",
      description: "ROS2 Humble with desktop tools and rviz",
      size: "4.2 GB",
      supported_devices: ["AGX Orin", "Orin NX", "AGX Xavier"],
      is_installed: false
    },
    {
      name: "lerobot", 
      tag: "latest",
      category: "robotics",
      description: "Real-world robotics with PyTorch and Hugging Face",
      size: "6.8 GB",
      supported_devices: ["AGX Orin", "Orin NX"],
      is_installed: false
    },
    // Edge AI
    {
      name: "deepstream",
      tag: "6.4-devel",
      category: "edge-ai",
      description: "NVIDIA DeepStream SDK for video analytics",
      size: "5.1 GB",
      supported_devices: ["AGX Orin", "Orin NX", "AGX Xavier"],
      is_installed: false
    },
    {
      name: "tensorrt",
      tag: "latest",
      category: "edge-ai", 
      description: "NVIDIA TensorRT for high-performance inference",
      size: "3.8 GB",
      supported_devices: ["AGX Orin", "Orin NX", "AGX Xavier"],
      is_installed: false
    }
  ];

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would query the jetson-containers registry
      // For now, use the predefined list
      setTimeout(() => {
        setContainers(jetsonContainers);
        setIsLoading(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load containers');
      setIsLoading(false);
    }
  };

  const handleInstallContainer = async (container: ContainerInfo) => {
    setInstallingContainers(prev => new Set([...prev, container.name]));
    
    try {
      await tauriService.pullContainer(container.name, container.tag);
      
      // Update container status
      setContainers(prev => prev.map(c => 
        c.name === container.name 
          ? { ...c, is_installed: true }
          : c
      ));
    } catch (error) {
      console.error(`Failed to install container ${container.name}:`, error);
    } finally {
      setInstallingContainers(prev => {
        const newSet = new Set(prev);
        newSet.delete(container.name);
        return newSet;
      });
    }
  };

  const filteredContainers = containers.filter(container => {
    const matchesCategory = selectedCategory === "all" || container.category === selectedCategory;
    const matchesSearch = container.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         container.description.toLowerCase().includes(searchTerm.toLowerCase());
    const deviceCompatible = !device || container.supported_devices.includes(device.module);
    
    return matchesCategory && matchesSearch && deviceCompatible;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Jetson Containers</h2>
        <p className="text-gray-400">AI/ML containers optimized for NVIDIA Jetson devices</p>
        {device && (
          <p className="text-sm text-gray-500 mt-1">
            Showing containers compatible with {device.vendor} {device.product}
          </p>
        )}
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search containers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nvidia-500/50"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadContainers}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-6 gap-4"
      >
        <motion.button
          onClick={() => setSelectedCategory("all")}
          className={`p-4 rounded-xl glass glass-hover transition-all duration-200 ${
            selectedCategory === "all" ? "border-nvidia-500 bg-nvidia-500/10" : ""
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Package className="w-6 h-6 text-nvidia-400 mx-auto mb-2" />
          <div className="text-white font-medium text-sm">All Containers</div>
          <div className="text-gray-400 text-xs">{containers.length} available</div>
        </motion.button>

        {containerCategories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`p-4 rounded-xl glass glass-hover transition-all duration-200 ${
              selectedCategory === category.id ? "border-nvidia-500 bg-nvidia-500/10" : ""
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`p-2 rounded-lg ${category.bgColor} mx-auto mb-2 w-fit`}>
              <category.icon className={`w-6 h-6 ${category.color}`} />
            </div>
            <div className="text-white font-medium text-sm">{category.name}</div>
            <div className="text-gray-400 text-xs">
              {containers.filter(c => c.category === category.id).length} containers
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-nvidia-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading container registry...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-4 rounded-xl border-red-500/50 bg-red-500/10"
        >
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Failed to load containers</span>
          </div>
          <p className="text-red-300 text-sm mt-1">{error}</p>
          <button 
            onClick={loadContainers}
            className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
          >
            Try again
          </button>
        </motion.div>
      )}

      {/* Containers Grid */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredContainers.map((container, index) => {
            const category = containerCategories.find(c => c.id === container.category);
            const isInstalling = installingContainers.has(container.name);
            
            return (
              <motion.div
                key={`${container.name}-${container.tag}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="glass p-6 rounded-xl glass-hover"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${category?.bgColor || 'bg-gray-700'}`}>
                      {category?.icon ? (
                        <category.icon className={`w-5 h-5 ${category.color}`} />
                      ) : (
                        <Container className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{container.name}</h3>
                      <p className="text-gray-400 text-sm">v{container.tag}</p>
                    </div>
                  </div>
                  {container.is_installed && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </div>

                <p className="text-gray-300 text-sm mb-4">{container.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white">{container.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Compatible:</span>
                    <span className="text-white">
                      {container.supported_devices.length > 2 
                        ? `${container.supported_devices.slice(0, 2).join(', ')} +${container.supported_devices.length - 2}`
                        : container.supported_devices.join(', ')
                      }
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {container.is_installed ? (
                    <>
                      <button className="btn-primary flex-1 flex items-center justify-center space-x-2">
                        <Play className="w-4 h-4" />
                        <span>Run</span>
                      </button>
                      <button className="btn-secondary">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleInstallContainer(container)}
                      disabled={isInstalling}
                      className={`btn-primary flex-1 flex items-center justify-center space-x-2 ${
                        isInstalling ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {isInstalling ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>{isInstalling ? 'Installing...' : 'Install'}</span>
                    </button>
                  )}
                  <button className="btn-secondary">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* No containers found */}
      {!isLoading && !error && filteredContainers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No containers found</h3>
          <p className="text-gray-400">
            {searchTerm ? 'Try adjusting your search terms' : 'No containers match your filter criteria'}
          </p>
        </motion.div>
      )}
    </div>
  );
}