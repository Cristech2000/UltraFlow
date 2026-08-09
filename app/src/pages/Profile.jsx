import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../services/userService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { User, Mail, Phone, Briefcase, Building2, CheckCircle, AlertCircle } from 'lucide-react';
import { getRoleDisplayName } from '../constants/roles';

function Profile() {
  const { user, userProfile, refreshProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    photoURL: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        photoURL: userProfile.photoURL || '',
      });
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      await updateUserProfile(user.uid, {
        fullName: formData.fullName,
        phone: formData.phone,
        photoURL: formData.photoURL,
      });
      
      await refreshProfile();
      setSaveSuccess(true);
      setIsEditing(false);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      fullName: userProfile?.fullName || '',
      phone: userProfile?.phone || '',
      photoURL: userProfile?.photoURL || '',
    });
    setIsEditing(false);
    setSaveError('');
  };

  const roleDisplayName = getRoleDisplayName(userProfile?.role);

  const getStatusBadge = (status) => {
    const variants = {
      active: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: AlertCircle },
      suspended: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
    };
    const variant = variants[status] || variants.active;
    const Icon = variant.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${variant.color}`}>
        <Icon size={12} />
        {status || 'Active'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage your personal information</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="primary">
            Edit Profile
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex flex-col items-center lg:items-start gap-4">
            <Avatar
              src={userProfile.photoURL}
              name={userProfile.fullName || user?.displayName}
              size="xl"
              className="w-24 h-24 text-2xl"
            />
            {isEditing && (
              <div className="w-full">
                <Input
                  label="Photo URL"
                  type="url"
                  name="photoURL"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.photoURL}
                  onChange={handleChange}
                  helper="Paste a URL to your profile picture"
                />
              </div>
            )}
          </div>

          <div className="flex-1">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  icon="user"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={userProfile.email || user?.email}
                  disabled
                  icon="mail"
                  helper="Email cannot be changed"
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  placeholder="+254 700 123 456"
                  value={formData.phone}
                  onChange={handleChange}
                  icon="lock"
                />

                {saveError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
                  >
                    {saveError}
                  </motion.div>
                )}

                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400"
                  >
                    ✅ Profile updated successfully!
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" variant="primary" loading={isSaving}>
                    Save Changes
                  </Button>
                  <Button type="button" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.fullName || user?.displayName || 'User'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="primary" size="sm">
                      {roleDisplayName}
                    </Badge>
                    {getStatusBadge(userProfile.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <InfoItem icon={Mail} label="Email" value={userProfile.email || user?.email} />
                  <InfoItem icon={Phone} label="Phone" value={userProfile.phone || 'Not set'} />
                  <InfoItem icon={Briefcase} label="Position" value={userProfile.position || 'Not set'} />
                  <InfoItem icon={Building2} label="Organization" value={userProfile.organizationId || 'UltraPower'} />
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Member since {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Last login: {userProfile.lastLogin ? new Date(userProfile.lastLogin).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="Role Information" subtitle="Your permissions and access level">
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-300">Role</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {roleDisplayName}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-300">Organization</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {userProfile.organizationId || 'UltraPower'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Status</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {userProfile.status || 'Active'}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          Role and organization can only be changed by administrators.
        </p>
      </Card>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <Icon size={18} className="text-gray-400 dark:text-gray-500 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 dark:text-white truncate">{value || 'Not set'}</p>
      </div>
    </div>
  );
}

export default Profile;