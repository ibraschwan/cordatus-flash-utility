import { useState } from "react";
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
  Star
} from "lucide-react";

interface ModelPackage {
  id: string;
  name: string;
  category: "computer-vision" | "nlp" | "robotics" | "edge-ai";
  description: string;
  size: string;
  version: string;
  downloads: number;
  rating: number;
  supportedDevices: string[];
  requirements: string[];
  downloadUrl: string;
  documentationUrl?: string;
}

// Real model data that would be loaded from a catalog
const modelCategories = [
  {
    id: "computer-vision",
    name: "Computer Vision",
    icon: Eye,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    description: "Object detection, classification, and segmentation models"
  },
  {
    id: "nlp",
    name: "Natural Language Processing", 
    icon: Brain,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    description: "Language models and text processing libraries"
  },
  {
    id: "robotics",
    name: "Robotics & Control",
    icon: Bot,
    color: "text-green-400", 
    bgColor: "bg-green-400/10",
    description: "ROS packages, navigation, and control systems"
  },
  {
    id: "edge-ai",
    name: "Edge AI Frameworks",
    icon: Cpu,
    color: "text-nvidia-400",
    bgColor: "bg-nvidia-400/10", 
    description: "TensorRT, DeepStream, and optimization tools"
  }
];

const sampleModels: ModelPackage[] = [
  {
    id: "yolov8-tensorrt",
    name: "YOLOv8 TensorRT",
    category: "computer-vision",
    description: "Real-time object detection optimized for Jetson with TensorRT",
    size: "245 MB",
    version: "8.0.2",
    downloads: 12500,
    rating: 4.8,
    supportedDevices: ["AGX Orin", "Xavier NX", "AGX Xavier"],
    requirements: ["TensorRT 8.0+", "CUDA 11.4+", "OpenCV 4.5+"],
    downloadUrl: "https://models.nvidia.com/yolov8-tensorrt",
    documentationUrl: "https://docs.nvidia.com/yolov8-tensorrt"
  },
  {
    id: "deepstream-reference",
    name: "DeepStream Reference App",
    category: "edge-ai",
    description: "Complete video analytics pipeline with multiple AI models",
    size: "1.2 GB", 
    version: "6.3.0",
    downloads: 8900,
    rating: 4.6,
    supportedDevices: ["AGX Orin", "AGX Xavier"],
    requirements: ["DeepStream 6.3", "GStreamer", "CUDA 11.8+"],
    downloadUrl: "https://models.nvidia.com/deepstream-reference",
    documentationUrl: "https://docs.nvidia.com/deepstream"
  },
  {
    id: "ros2-navigation",
    name: "ROS2 Navigation Stack",
    category: "robotics",
    description: "Complete autonomous navigation system for mobile robots",
    size: "890 MB",
    version: "2.1.0",
    downloads: 6700,
    rating: 4.5,
    supportedDevices: ["AGX Orin", "Xavier NX", "AGX Xavier", "Nano"],
    requirements: ["ROS2 Humble", "Ubuntu 22.04", "4GB+ RAM"],
    downloadUrl: "https://models.nvidia.com/ros2-navigation"
  },
  {
    id: "bert-tensorrt",
    name: "BERT TensorRT",
    category: "nlp",
    description: "Optimized BERT model for natural language understanding tasks",
    size: "420 MB",
    version: "1.4.0", 
    downloads: 5400,
    rating: 4.7,
    supportedDevices: ["AGX Orin", "AGX Xavier"],
    requirements: ["TensorRT 8.0+", "Python 3.8+", "Transformers 4.0+"],
    downloadUrl: "https://models.nvidia.com/bert-tensorrt"
  }
];

export default function Models() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showInstalled, setShowInstalled] = useState(false);

  const filteredModels = sampleModels.filter(model => {
    const matchesCategory = selectedCategory === "all" || model.category === selectedCategory;
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleInstall = (modelId: string) => {
    // TODO: Implement actual model installation
    console.log(`Installing model: ${modelId}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Models & Prebuilt Libraries</h2>
        <p className="text-gray-400">AI models and libraries optimized for Jetson devices</p>
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
            placeholder="Search models and libraries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nvidia-500/50"
          />
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button 
            onClick={() => setShowInstalled(!showInstalled)}
            className={`btn-secondary ${showInstalled ? 'bg-nvidia-500/20 text-nvidia-400' : ''}`}
          >
            Installed Only
          </button>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
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
          <div className="text-white font-medium text-sm">All Models</div>
          <div className="text-gray-400 text-xs">{sampleModels.length} available</div>
        </motion.button>

        {modelCategories.map((category) => (
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
              {sampleModels.filter(m => m.category === category.id).length} models
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Models Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredModels.map((model, index) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="glass p-6 rounded-xl glass-hover"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  modelCategories.find(c => c.id === model.category)?.bgColor
                }`}>
                  {(() => {
                    const category = modelCategories.find(c => c.id === model.category);
                    const Icon = category?.icon || Package;
                    return <Icon className={`w-5 h-5 ${category?.color}`} />;
                  })()}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{model.name}</h3>
                  <p className="text-gray-400 text-sm">v{model.version}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm">{model.rating}</span>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-4">{model.description}</p>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Size:</span>
                <span className="text-white">{model.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Downloads:</span>
                <span className="text-white">{model.downloads.toLocaleString()}</span>
              </div>
            </div>

            {/* Supported Devices */}
            <div className="mb-4">
              <div className="text-gray-400 text-xs mb-2">Supported Devices:</div>
              <div className="flex flex-wrap gap-1">
                {model.supportedDevices.map((device) => (
                  <span
                    key={device}
                    className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                  >
                    {device}
                  </span>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="mb-4">
              <div className="text-gray-400 text-xs mb-2">Requirements:</div>
              <div className="space-y-1">
                {model.requirements.slice(0, 2).map((req) => (
                  <div key={req} className="flex items-center space-x-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-gray-300">{req}</span>
                  </div>
                ))}
                {model.requirements.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{model.requirements.length - 2} more
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleInstall(model.id)}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Install</span>
              </button>
              {model.documentationUrl && (
                <button className="btn-secondary">
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

          {filteredModels.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No models found</h3>
              <p className="text-gray-400">Try adjusting your search or category filter</p>
            </motion.div>
          )}
          </motion.div>
        </>
      )}
    </div>
  );
}