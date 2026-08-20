import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';

// 🔥 IMPORT YOUR LOGO HERE
import pineCoreLogo from '../assets/pinecore-logo.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Welcome Back
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Sign in to access the UltraFlow platform
      </p>

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
        
        <div>
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon="lock"
          />
          <div className="text-right mt-1">
            <Link
              to="/forgot-password"
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

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
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </div>

      {/* 🔥 THE LARGER PINE CORE BRANDING FOOTER */}
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

export default Login;