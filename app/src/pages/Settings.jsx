import React, { useState } from 'react';
import { 
  Bell, 
  Shield, 
  Key, 
  Smartphone, 
  Mail, 
  CheckSquare, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { database } from '../lib/firebase';
import { ref, set } from 'firebase/database';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  
  // [DISABLED] const [isNuking, setIsNuking] = useState(false);

  // Mock states for preferences 
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    taskAssignments: true,
    issueUpdates: false,
    assessmentReports: true
  });

  const handlePasswordReset = () => {
    // TODO: Wire up to Firebase sendPasswordResetEmail
    alert(`A password reset link would be sent to ${user?.email}`);
  };

  /* 
  // 🔥 THE EMERGENCY NUKE FUNCTION (Commented out for safety)
  const handleEmergencyNuke = async () => {
    if (!window.confirm("🚨 WARNING: This will instantly delete ALL buildings, levels, wings, spaces, and activities across the entire system. Are you absolutely sure?")) {
      return;
    }

    setIsNuking(true);
    try {
      // Setting a node to null in Firebase deletes it instantly
      await set(ref(database, 'activities'), null);
      await set(ref(database, 'spaces'), null);
      await set(ref(database, 'wings'), null);
      await set(ref(database, 'floors'), null);
      await set(ref(database, 'buildings'), null);

      alert('💥 Database wiped clean! You can now start fresh.');
      window.location.reload(); // Refresh the page to clear local state
    } catch (err) {
      console.error('Nuke failed:', err);
      alert('Failed to wipe database.');
    } finally {
      setIsNuking(false);
    }
  };
  */

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your system notifications and security access.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Bell size={18} />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Shield size={18} />
            Security & Access
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1">
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card title="Alert Preferences">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Mail className="text-gray-400 mt-0.5" size={18} />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Global Email Alerts</h4>
                        <p className="text-sm text-gray-500">Receive daily summaries and critical alerts via email.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 mt-1 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      checked={notifications.emailAlerts}
                      onChange={(e) => setNotifications({...notifications, emailAlerts: e.target.checked})}
                    />
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <CheckSquare className="text-gray-400 mt-0.5" size={18} />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Task Assignments</h4>
                        <p className="text-sm text-gray-500">Get notified when you are assigned a new location or activity.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 mt-1 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      checked={notifications.taskAssignments}
                      onChange={(e) => setNotifications({...notifications, taskAssignments: e.target.checked})}
                    />
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <AlertTriangle className="text-gray-400 mt-0.5" size={18} />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Site Issues</h4>
                        <p className="text-sm text-gray-500">Alerts for new blockers or issues logged on your active projects.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 mt-1 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      checked={notifications.issueUpdates}
                      onChange={(e) => setNotifications({...notifications, issueUpdates: e.target.checked})}
                    />
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <FileText className="text-gray-400 mt-0.5" size={18} />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Assessment Reports</h4>
                        <p className="text-sm text-gray-500">Notify me when a new digital site assessment is completed.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 mt-1 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      checked={notifications.assessmentReports}
                      onChange={(e) => setNotifications({...notifications, assessmentReports: e.target.checked})}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card title="Password & Authentication">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Change Password</h4>
                    <p className="text-sm text-gray-500">Receive a secure link to reset your account password.</p>
                  </div>
                  <Button variant="outline" icon={<Key size={16} />} onClick={handlePasswordReset}>
                    Send Reset Link
                  </Button>
                </div>
              </Card>

              <Card title="Active Sessions">
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-full">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Current Session</p>
                      <p className="text-xs text-gray-500">Nairobi, Kenya • Active now</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">This Device</Badge>
                </div>
              </Card>

              {/* DANGER ZONE FOR DB NUKE (Commented out for safety)
              <Card 
                title="Danger Zone" 
                className="border-red-200 dark:border-red-900/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-red-600 dark:text-red-400">Emergency Database Wipe</h4>
                    <p className="text-sm text-gray-500">Instantly delete all buildings, levels, wings, spaces, and activities globally.</p>
                  </div>
                  <Button 
                    variant="danger" 
                    icon={<AlertTriangle size={16} />} 
                    onClick={handleEmergencyNuke}
                    loading={isNuking}
                  >
                    Nuke Database
                  </Button>
                </div>
              </Card>
              */}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}