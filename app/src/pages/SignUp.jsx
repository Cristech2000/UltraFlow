import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';

// 🔥 IMPORT YOUR LOGO HERE
import pineCoreLogo from '../assets/pinecore-logo.png';

function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with full name
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      navigate('/');
    } catch (err) {
      console.error('Sign up error:', err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Create Account
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Join UltraFlow and start managing your projects
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="Full Name"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          icon="user"
        />
        
        <Input
          type="email"
          label="Email Address"
          placeholder="you@ultrapower.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon="mail"
        />
        
        <Input
          type="password"
          label="Password"
          placeholder="Min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          icon="lock"
          helper="Must be at least 6 characters"
        />
        
        <Input
          type="password"
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          icon="lock"
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
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>

      {/* 🔥 THE NEW PINE CORE BRANDING FOOTER */}
      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-3">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold">
          Powered By
        </span>
        <img 
          src={pineCoreLogo} 
          alt="Pine Core Technologies" 
          className="h-[80px] w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" 
        />
      </div>
    </>
  );
}

export default SignUp;