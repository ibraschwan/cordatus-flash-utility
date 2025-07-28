import { motion } from "framer-motion";
import { CheckCircle, Clock, Zap, Activity, TrendingUp } from "lucide-react";

export default function Analytics() {
  const stats = [
    {
      title: "Success Rate",
      value: "98.5%",
      change: "+2.3%",
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-400/10"
    },
    {
      title: "Avg Flash Time",
      value: "12:34",
      change: "-45s",
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10"
    },
    {
      title: "Devices Flashed",
      value: "1,234",
      change: "+156",
      icon: Zap,
      color: "text-nvidia-400",
      bgColor: "bg-nvidia-400/10"
    },
    {
      title: "Active Sessions",
      value: "24",
      change: "+8",
      icon: Activity,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
        <p className="text-gray-400">Track your flashing performance and device statistics</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="glass p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <div className={`flex items-center mt-2 text-sm ${
                  stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>{stat.change}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Recent Flash Activity</h3>
        <div className="space-y-3">
          {[
            {
              device: "AGX Orin #1234",
              profile: "Production Ready",
              time: "2 minutes ago",
              status: "success",
              duration: "12:34"
            },
            {
              device: "Xavier NX #5678",
              profile: "Developer Mode",
              time: "15 minutes ago",
              status: "success",
              duration: "11:22"
            },
            {
              device: "AGX Xavier #9012",
              profile: "AI Workstation",
              time: "1 hour ago",
              status: "failed",
              duration: "8:45"
            }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === "success" ? "bg-green-400" : "bg-red-400"
                }`} />
                <div>
                  <p className="text-white font-medium">{activity.device}</p>
                  <p className="text-sm text-gray-400">{activity.profile}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">{activity.time}</p>
                <p className="text-xs text-gray-500">{activity.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}