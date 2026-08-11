import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createProject } from '../../services/projectService';
import Button from '../common/Button';
import Input from '../common/Input';
import { STATUS_OPTIONS } from '../../constants/status';

function CreateProjectModal({ onClose, onSuccess }) {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    location: '',
    client: '',
    status: 'active',
    startDate: '',
    expectedCompletionDate: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim()) {
      setError('Project name is required');
      setLoading(false);
      return;
    }
    if (!formData.code.trim()) {
      setError('Project code is required');
      setLoading(false);
      return;
    }

    try {
      const organizationId = userProfile?.organizationId || 'ultrapower';
      await createProject(formData, organizationId, user?.uid);
      onSuccess();
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Project</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enter the project details below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Project Name"
              name="name"
              placeholder="e.g., Qwetu Qejani"
              value={formData.name}
              onChange={handleChange}
              required
              icon="user"
            />
            <Input
              label="Project Code"
              name="code"
              placeholder="e.g., QQ-2024"
              value={formData.code}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Description"
            name="description"
            placeholder="Brief description of the project"
            value={formData.description}
            onChange={handleChange}
            type="text"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Client"
              name="client"
              placeholder="Client name"
              value={formData.client}
              onChange={handleChange}
            />
            <Input
              label="Location"
              name="location"
              placeholder="Project location"
              value={formData.location}
              onChange={handleChange}
              icon="lock"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
            />
            <Input
              label="Expected Completion"
              name="expectedCompletionDate"
              type="date"
              value={formData.expectedCompletionDate}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Create Project
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default CreateProjectModal;