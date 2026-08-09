import React from 'react';
import { motion } from 'framer-motion';
import { 
  FolderKanban, 
  Building2, 
  CheckSquare, 
  AlertTriangle,
  Clock,
  Users,
  FileText,
  ClipboardCheck,
  BarChart3,
  UserCheck,
  Briefcase,
  Crown,
  HardHat,
  Camera,
  Calendar,
  TrendingUp,
  Zap,
  PlusCircle,
  Edit3,
  Eye,
  Download,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import { useAuth } from '../../hooks/useAuth';
import { getRoleDisplayName, getRoleDescription } from '../../constants/roles';

/**
 * DashboardLoader - Renders role-specific dashboards
 * Each role gets a tailored dashboard view
 */
function DashboardLoader({ userProfile }) {
  const { userRole } = useAuth();
  const userName = userProfile?.fullName || 'User';
  const roleDisplayName = getRoleDisplayName(userRole);
  const roleDescription = getRoleDescription(userRole);

  // Render appropriate dashboard based on role
  switch (userRole) {
    case 'director':
      return <DirectorDashboard userName={userName} roleDisplayName={roleDisplayName} roleDescription={roleDescription} />;
    case 'engineer':
      return <EngineerDashboard userName={userName} roleDisplayName={roleDisplayName} roleDescription={roleDescription} />;
    case 'supervisor':
      return <SupervisorDashboard userName={userName} roleDisplayName={roleDisplayName} roleDescription={roleDescription} />;
    case 'documentation_assistant':
      return <DocumentationDashboard userName={userName} roleDisplayName={roleDisplayName} roleDescription={roleDescription} />;
    case 'foreman':
      return <ForemanDashboard userName={userName} roleDisplayName={roleDisplayName} roleDescription={roleDescription} />;
    case 'electrician':
      return <ElectricianDashboard userName={userName} roleDisplayName={roleDisplayName} roleDescription={roleDescription} />;
    case 'hr':
      return <HRDashboard userName={userName} roleDisplayName={roleDisplayName} roleDescription={roleDescription} />;
    default:
      return <DefaultDashboard userName={userName} roleDisplayName={roleDisplayName} roleDescription={roleDescription} />;
  }
}

// ============================================================
// ROLE-SPECIFIC DASHBOARDS
// ============================================================

// 1. DOCUMENTATION ASSISTANT (Site Secretary)
function DocumentationDashboard({ userName, roleDisplayName, roleDescription }) {
  const recentProgress = [
    { space: 'Space 305', progress: 80, status: 'In Progress', updated: '2 hours ago' },
    { space: 'Space 210', progress: 100, status: 'Complete', updated: 'Yesterday' },
    { space: 'Space 108', progress: 45, status: 'In Progress', updated: '3 hours ago' },
    { space: 'Space 101', progress: 0, status: 'Not Started', updated: 'Today' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Documentation Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {userName}! {roleDescription}
          </p>
        </div>
        <Badge variant="accent" size="lg">
          <FileText size={16} className="mr-1" />
          {roleDisplayName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value="4" icon={FolderKanban} color="text-primary-500" />
        <StatCard label="Overall Progress" value="78%" icon={BarChart3} color="text-green-500" />
        <StatCard label="Pending Reports" value="12" icon={FileText} color="text-accent-500" />
        <StatCard label="Photos to Organize" value="34" icon={Camera} color="text-blue-500" />
      </div>

      <Card title="📊 Overall Project Progress" subtitle="Track and update general progress for all Spaces">
        <div className="space-y-4">
          {recentProgress.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.space}</span>
                  <span className={`text-sm font-medium ${
                    item.status === 'Complete' ? 'text-green-500' :
                    item.status === 'In Progress' ? 'text-yellow-500' :
                    'text-gray-400'
                  }`}>
                    {item.progress}%
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        item.progress === 100 ? 'bg-green-500' :
                        item.progress > 0 ? 'bg-primary-500' :
                        'bg-gray-400'
                      }`}
                    />
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{item.updated}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full flex items-center justify-center gap-2 p-3 bg-primary-50 dark:bg-primary-950/30 border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-950/50 transition-colors text-primary-700 dark:text-primary-400 text-sm font-medium">
            <Edit3 size={18} />
            Update General Progress
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="📋 Recent Documents" subtitle="Manage site documentation">
          <div className="space-y-3">
            <DocumentItem name="Qwetu Qejani - Electrical Layout" date="Today" />
            <DocumentItem name="Casa Pasha - Progress Report" date="Yesterday" />
            <DocumentItem name="Block A - Assessment Report" date="2 days ago" />
            <DocumentItem name="Daily Site Report - Aug 7" date="Today" />
          </div>
        </Card>
        <Card title="⚡ Quick Actions">
          <div className="space-y-2">
            <QuickActionButton label="📸 Upload Photos" icon={Camera} />
            <QuickActionButton label="📋 Generate Report" icon={FileText} />
            <QuickActionButton label="📝 Create Assessment" icon={ClipboardCheck} />
            <QuickActionButton label="📊 Update Progress" icon={BarChart3} />
            <QuickActionButton label="📁 Organize Documents" icon={FolderKanban} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// 2. DIRECTOR
function DirectorDashboard({ userName, roleDisplayName, roleDescription }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Director Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {userName}! {roleDescription}</p>
        </div>
        <Badge variant="primary" size="lg">
          <Crown size={16} className="mr-1" />
          {roleDisplayName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value="4" icon={FolderKanban} color="text-primary-500" />
        <StatCard label="Buildings" value="12" icon={Building2} color="text-accent-500" />
        <StatCard label="Team Members" value="45" icon={Users} color="text-blue-500" />
        <StatCard label="Overall Progress" value="78%" icon={BarChart3} color="text-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Project Health">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Qwetu Qejani</span>
                <span className="font-medium text-green-500">78%</span>
              </div>
              <ProgressBar value={78} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Casa Pasha</span>
                <span className="font-medium text-green-500">92%</span>
              </div>
              <ProgressBar value={92} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Qwetu Hurlingham</span>
                <span className="font-medium text-yellow-500">45%</span>
              </div>
              <ProgressBar value={45} />
            </div>
          </div>
        </Card>
        <Card title="Executive Summary">
          <div className="space-y-3">
            <SummaryItem label="Total Progress" value="78%" />
            <SummaryItem label="Open Issues" value="23" />
            <SummaryItem label="Team Members" value="45" />
            <SummaryItem label="Completed Spaces" value="87" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// 3. ENGINEER
function EngineerDashboard({ userName, roleDisplayName, roleDescription }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Engineer Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {userName}! {roleDescription}</p>
        </div>
        <Badge variant="primary" size="lg">
          <UserCheck size={16} className="mr-1" />
          {roleDisplayName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value="4" icon={FolderKanban} color="text-primary-500" />
        <StatCard label="Pending Assessments" value="7" icon={ClipboardCheck} color="text-accent-500" />
        <StatCard label="Open Issues" value="23" icon={AlertTriangle} color="text-red-500" />
        <StatCard label="Quality Score" value="94%" icon={BarChart3} color="text-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Project Quality Overview">
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
                <span className="font-medium">92%</span>
              </div>
              <ProgressBar value={92} />
            </div>
          </div>
        </Card>
        <Card title="Recent Assessments">
          <div className="space-y-3">
            <AssessmentItem space="Space 305" result="Passed" date="Today" />
            <AssessmentItem space="Space 210" result="Failed" date="Yesterday" />
            <AssessmentItem space="Space 108" result="Pending" date="2 days ago" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// 4. SUPERVISOR
function SupervisorDashboard({ userName, roleDisplayName, roleDescription }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Supervisor Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {userName}! {roleDescription}</p>
        </div>
        <Badge variant="accent" size="lg">
          <Users size={16} className="mr-1" />
          {roleDisplayName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Team Members" value="12" icon={Users} color="text-primary-500" />
        <StatCard label="Active Tasks" value="45" icon={CheckSquare} color="text-accent-500" />
        <StatCard label="Open Issues" value="23" icon={AlertTriangle} color="text-red-500" />
        <StatCard label="Completion Rate" value="87%" icon={BarChart3} color="text-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Team Progress">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Electrical Team A</span>
                <span className="font-medium">85%</span>
              </div>
              <ProgressBar value={85} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Electrical Team B</span>
                <span className="font-medium">72%</span>
              </div>
              <ProgressBar value={72} />
            </div>
          </div>
        </Card>
        <Card title="Recent Activity">
          <div className="space-y-3">
            <ActivityItem user="John Doe" action="completed Socket Installation" time="10 min ago" />
            <ActivityItem user="Jane Smith" action="submitted assessment" time="2 hours ago" />
            <ActivityItem user="Mike Johnson" action="reported issue in Space 305" time="4 hours ago" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// 5. FOREMAN
function ForemanDashboard({ userName, roleDisplayName, roleDescription }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Foreman Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {userName}! {roleDescription}</p>
        </div>
        <Badge variant="secondary" size="lg">
          <HardHat size={16} className="mr-1" />
          {roleDisplayName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Workers" value="8" icon={Users} color="text-primary-500" />
        <StatCard label="Tasks Today" value="14" icon={CheckSquare} color="text-accent-500" />
        <StatCard label="Completed" value="9" icon={CheckSquare} color="text-green-500" />
        <StatCard label="Pending" value="5" icon={Clock} color="text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Today's Tasks">
          <div className="space-y-3">
            <TaskItem task="Chasing - Space 305" status="In Progress" priority="High" />
            <TaskItem task="Routing - Space 210" status="Pending" priority="Medium" />
            <TaskItem task="Wiring - Space 108" status="Completed" priority="Low" />
          </div>
        </Card>
        <Card title="Quick Actions">
          <div className="space-y-2">
            <QuickActionButton label="Assign Task" icon={PlusCircle} />
            <QuickActionButton label="Record Progress" icon={BarChart3} />
            <QuickActionButton label="Report Issue" icon={AlertTriangle} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// 6. ELECTRICIAN
function ElectricianDashboard({ userName, roleDisplayName, roleDescription }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Electrician Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {userName}! {roleDescription}</p>
        </div>
        <Badge variant="secondary" size="lg">
          <Zap size={16} className="mr-1" />
          {roleDisplayName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="My Tasks" value="6" icon={CheckSquare} color="text-primary-500" />
        <StatCard label="Completed" value="4" icon={CheckSquare} color="text-green-500" />
        <StatCard label="Due Today" value="2" icon={Clock} color="text-accent-500" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card title="My Assigned Tasks">
          <div className="space-y-3">
            <TaskItem task="Chasing - Space 305" status="In Progress" priority="High" />
            <TaskItem task="Socket Installation - Space 210" status="Pending" priority="Medium" />
            <TaskItem task="Wiring - Space 108" status="Completed" priority="Low" />
            <TaskItem task="Lighting Installation - Space 101" status="Pending" priority="High" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// 7. HR
function HRDashboard({ userName, roleDisplayName, roleDescription }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HR Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {userName}! {roleDescription}</p>
        </div>
        <Badge variant="primary" size="lg">
          <Users size={16} className="mr-1" />
          {roleDisplayName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value="45" icon={Users} color="text-primary-500" />
        <StatCard label="Active Roles" value="7" icon={Briefcase} color="text-accent-500" />
        <StatCard label="New Hires" value="3" icon={UserCheck} color="text-green-500" />
        <StatCard label="Departments" value="4" icon={Building2} color="text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Team Distribution">
          <div className="space-y-3">
            <TeamItem role="Engineers" count="8" />
            <TeamItem role="Supervisors" count="4" />
            <TeamItem role="Documentation Assistants" count="3" />
            <TeamItem role="Foremen" count="6" />
            <TeamItem role="Electricians" count="20" />
            <TeamItem role="HR" count="2" />
            <TeamItem role="Directors" count="2" />
          </div>
        </Card>
        <Card title="Recent Activity">
          <div className="space-y-3">
            <ActivityItem user="System" action="New role created: Documentation Assistant" time="Today" />
            <ActivityItem user="HR Team" action="Added 2 new electricians" time="Yesterday" />
            <ActivityItem user="System" action="Role updated for John Doe" time="2 days ago" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// 8. DEFAULT
function DefaultDashboard({ userName, roleDisplayName, roleDescription }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {userName}! {roleDescription}</p>
        </div>
        <Badge variant="secondary" size="lg">
          <UserCheck size={16} className="mr-1" />
          {roleDisplayName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value="4" icon={FolderKanban} color="text-primary-500" />
        <StatCard label="Buildings" value="12" icon={Building2} color="text-accent-500" />
        <StatCard label="Completed Spaces" value="87" icon={CheckSquare} color="text-green-500" />
        <StatCard label="Open Issues" value="23" icon={AlertTriangle} color="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <span className="font-medium">92%</span>
                </div>
                <ProgressBar value={92} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Qwetu Hurlingham</span>
                  <span className="font-medium">45%</span>
                </div>
                <ProgressBar value={45} />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card title="Recent Activity" subtitle="Latest project updates">
            <div className="space-y-3">
              <ActivityItem user="John Doe" action="updated progress on Space 305" time="2 min ago" />
              <ActivityItem user="Jane Smith" action="uploaded assessment report" time="15 min ago" />
              <ActivityItem user="Mike Johnson" action="added new issue" time="1 hour ago" />
              <ActivityItem user="Sarah Wilson" action="completed testing" time="3 hours ago" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`${color} bg-gray-100 dark:bg-gray-800 p-3 rounded-xl`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
}

function DocumentItem({ name, date }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
      <span className="text-xs text-gray-400 dark:text-gray-500">{date}</span>
    </div>
  );
}

function QuickActionButton({ label, icon: Icon }) {
  return (
    <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
      <Icon size={16} className="text-primary-500" />
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </button>
  );
}

function AssessmentItem({ space, result, date }) {
  const colors = {
    Passed: 'text-green-500',
    Failed: 'text-red-500',
    Pending: 'text-yellow-500',
  };
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <span className="text-sm text-gray-700 dark:text-gray-300">{space}</span>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${colors[result]}`}>{result}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{date}</span>
      </div>
    </div>
  );
}

function TaskItem({ task, status, priority }) {
  const statusColors = {
    'In Progress': 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    'Pending': 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    'Completed': 'text-green-500 bg-green-50 dark:bg-green-900/20',
  };
  const priorityColors = {
    High: 'text-red-500',
    Medium: 'text-yellow-500',
    Low: 'text-blue-500',
  };
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <span className="text-sm text-gray-700 dark:text-gray-300">{task}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[status]}`}>{status}</span>
        <span className={`text-xs font-medium ${priorityColors[priority]}`}>{priority}</span>
      </div>
    </div>
  );
}

function ActivityItem({ user, action, time }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white">
          <span className="font-medium">{user}</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{action}</p>
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{time}</span>
    </div>
  );
}

function TeamItem({ role, count }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

export default DashboardLoader;