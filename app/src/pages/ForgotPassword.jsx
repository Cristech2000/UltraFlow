import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Password reset error:', err);
      
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Reset Password
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Enter your email and we'll send you a link to reset your password
      </p>

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <p className="text-green-700 dark:text-green-400 text-sm font-medium">
            ✅ Password reset email sent!
          </p>
          <p className="text-green-600 dark:text-green-300 text-sm mt-1">
            Check your inbox for the password reset link.
          </p>
          <Link
            to="/login"
            className="inline-block mt-3 text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
          >
            Return to Sign In
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email Address"
            placeholder="you@ultrapower.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon="mail"
          />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            Send Reset Link
          </Button>
        </form>
      )}

      <div className="mt-6 text-center space-y-2">
        <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
          ← Back to Sign In
        </Link>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Powered by <span className="font-semibold">UltraFlow</span> — Construction Intelligence Platform
        </p>
      </div>
    </>
  );
}

export default ForgotPassword;