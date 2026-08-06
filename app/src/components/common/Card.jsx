import React from 'react';
import { cn } from '../../lib/utils';

function Card({
  children,
  className,
  title,
  subtitle,
  actions,
  hover = false,
  ...props
}) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all-200',
        hover && 'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600',
        className
      )}
      {...props}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

export default Card;