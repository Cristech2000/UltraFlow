import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Eye, EyeOff, Mail, Lock, User, Search } from 'lucide-react';

const iconMap = {
  mail: Mail,
  lock: Lock,
  user: User,
  search: Search,
};

function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  success,
  disabled,
  required,
  className,
  icon,
  iconPosition = 'left',
  helper,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const IconComponent = icon ? iconMap[icon] : null;

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  
  // Check if input has value (for floating label)
  const hasValue = value && value.length > 0;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label 
          htmlFor={props.id || `input-${label}`}
          className={cn(
            'block text-sm font-medium transition-all duration-200',
            isFocused ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300',
            error && 'text-red-500 dark:text-red-400'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {IconComponent && iconPosition === 'left' && (
          <IconComponent className={cn(
            'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200',
            isFocused ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500',
            error && 'text-red-500'
          )} />
        )}
        
        <input
          id={props.id || `input-${label}`}
          type={inputType}
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full rounded-lg border transition-all-200 focus-ring',
            'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            IconComponent && iconPosition === 'left' && 'pl-10',
            (IconComponent && iconPosition === 'right') || isPassword ? 'pr-10' : 'pr-4',
            'py-2.5 px-4',
            error 
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
              : isFocused 
                ? 'border-primary-500 dark:border-primary-400 shadow-sm shadow-primary-500/10' 
                : 'border-gray-300 dark:border-gray-700',
            disabled && 'opacity-60 cursor-not-allowed',
            success && 'border-green-500 dark:border-green-500'
          )}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex="-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        
        {IconComponent && iconPosition === 'right' && !isPassword && (
          <IconComponent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        )}
      </div>
      
      {helper && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export default Input;