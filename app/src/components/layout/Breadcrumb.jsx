import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Home size={16} className="text-gray-400" />
        <span className="font-medium">Dashboard</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      <Link
        to="/"
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <Home size={16} />
      </Link>
      <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        // Format display name
        const displayName = name
          .replace(/-/g, ' ')
          .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

        return (
          <React.Fragment key={routeTo}>
            {isLast ? (
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {displayName}
              </span>
            ) : (
              <>
                <Link
                  to={routeTo}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {displayName}
                </Link>
                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
              </>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;