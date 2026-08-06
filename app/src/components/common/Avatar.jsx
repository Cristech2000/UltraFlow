import React from 'react';
import { cn, getInitials } from '../../lib/utils';

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  children,
  ...props
}) {
  const initials = name ? getInitials(name) : '';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={cn(
          'rounded-full object-cover border-2 border-gray-200 dark:border-gray-700',
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white bg-primary-500 border-2 border-gray-200 dark:border-gray-700',
        sizes[size],
        className
      )}
      {...props}
    >
      {children || initials || 'U'}
    </div>
  );
}

export default Avatar;