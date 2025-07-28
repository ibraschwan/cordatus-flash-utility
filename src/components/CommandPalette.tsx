import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Monitor, Zap, Activity, Settings, ArrowRight } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = [
    {
      id: "devices",
      label: "Go to Devices",
      description: "View and select Jetson devices",
      icon: Monitor,
      action: () => {
        onNavigate("devices");
        onClose();
      },
      keywords: ["device", "jetson", "select"]
    },
    {
      id: "flash",
      label: "Start Flashing",
      description: "Begin the flash process",
      icon: Zap,
      action: () => {
        onNavigate("flashing");
        onClose();
      },
      keywords: ["flash", "start", "begin"]
    },
    {
      id: "analytics",
      label: "View Analytics", 
      description: "Check flash statistics",
      icon: Activity,
      action: () => {
        onNavigate("analytics");
        onClose();
      },
      keywords: ["analytics", "stats", "reports"]
    },
    {
      id: "settings",
      label: "Open Settings",
      description: "Configure preferences",
      icon: Settings,
      action: () => {
        onNavigate("settings");
        onClose();
      },
      keywords: ["settings", "preferences", "config"]
    }
  ];

  const filteredCommands = commands.filter(command =>
    command.label.toLowerCase().includes(query.toLowerCase()) ||
    command.description.toLowerCase().includes(query.toLowerCase()) ||
    command.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case "Enter":
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case "Escape":
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="glass border border-white/20 rounded-xl w-full max-w-2xl mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-white/10">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-700 rounded">ESC</kbd>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No commands found</p>
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((command, index) => (
                  <motion.button
                    key={command.id}
                    onClick={command.action}
                    className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
                      index === selectedIndex
                        ? "bg-nvidia-500/20 border-l-2 border-nvidia-500"
                        : "hover:bg-white/5"
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <command.icon className={`w-5 h-5 ${
                      index === selectedIndex ? "text-nvidia-400" : "text-gray-400"
                    }`} />
                    <div className="flex-1">
                      <div className="text-white font-medium">{command.label}</div>
                      <div className="text-gray-400 text-sm">{command.description}</div>
                    </div>
                    <ArrowRight className={`w-4 h-4 ${
                      index === selectedIndex ? "text-nvidia-400" : "text-gray-500"
                    }`} />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">↵</kbd>
                  <span>Select</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">⌘K</kbd>
                <span>Command Palette</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}