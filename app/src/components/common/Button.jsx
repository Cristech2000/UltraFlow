import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/25',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200',
  accent: 'bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-accent-500/25',
  outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 dark:border-primary-400 dark:text-primary-400',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  icon,
  iconPosition = 'left',
  ...props
}) {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all-200 focus-ring',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span>{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span>{icon}</span>}
        </>
      )}
    </motion.button>
  );
}

export default Button;