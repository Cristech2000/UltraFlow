import React from 'react';
import { motion } from 'framer-motion';
import { 
  FolderKanban, 
  Building2, 
  CheckSquare, 
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';

function Dashboard() {
  // Placeholder data - will be replaced with real data from Firestore
  const stats = [
    { label: 'Active Projects', value: '4', icon: FolderKanban, color: 'text-primary-500' },
    { label: 'Buildings', value: '12', icon: Building2, color: 'text-accent-500' },
    { label: 'Completed Spaces', value: '87', icon: CheckSquare, color: 'text-green-500' },
    { label: 'Open Issues', value: '23', icon: AlertTriangle, color: 'text-red-500' },
  ];

  const recentActivity = [
    { time: '2 min ago', user: 'John Doe', action: 'updated progress on Space 305' },
    { time: '15 min ago', user: 'Jane Smith', action: 'uploaded assessment report' },
    { time: '1 hour ago', user: 'Mike Johnson', action: 'added new issue to Qwetu Qejani' },
    { time: '3 hours ago', user: 'Sarah Wilson', action: 'completed testing on Block A' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, Crispus! Here's your project overview.
          </p>
        </div>
        <Badge variant="accent" size="lg">
          <Clock size={16} className="mr-1" />
          Last updated: 10:32 AM
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} bg-gray-100 dark:bg-gray-800 p-3 rounded-xl`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress */}
        <div className="lg:col-span-2">
          <Card title="Project Progress">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Qwetu Qejani</span>
                  <span className="font-medium">78%</span>
                </div>
                <ProgressBar value={78} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Casa Pasha</span>
                  <span className="font-medium">45%</span>
                </div>
                <ProgressBar value={45} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Qwetu Hurlingham</span>
                  <span className="font-medium">92%</span>
                </div>
                <ProgressBar value={92} />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <Card title="Recent Activity" subtitle="Latest project updates">
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.user}</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {activity.action}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {activity.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;