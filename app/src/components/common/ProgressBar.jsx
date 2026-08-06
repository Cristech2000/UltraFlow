import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const variants = {
  low: 'bg-primary-500',
  medium: 'bg-accent-500',
  high: 'bg-green-500',
};

function ProgressBar({
  value = 0,
  max = 100,
  label,
  showLabel = true,
  variant,
  className,
  ...props
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const getVariant = () => {
    if (variant) return variants[variant];
    if (percentage < 30) return variants.low;
    if (percentage < 70) return variants.medium;
    return variants.high;
  };

  return (
    <div className={cn('w-full', className)} {...props}>
      {showLabel && label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-300">{label}</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn('h-full rounded-full', getVariant())}
        />
      </div>
    </div>
  );
}

export default ProgressBar;