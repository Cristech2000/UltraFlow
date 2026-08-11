import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { getSpace } from '../../services/spaceService';
import { getProject } from '../../services/projectService';
import { getBuilding, getFloor, getWing } from '../../services/spaceService';

function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNames = async () => {
      setLoading(true);
      const newNames = {};
      
      try {
        // Check each segment for IDs
        for (let i = 0; i < pathnames.length; i++) {
          const segment = pathnames[i];
          
          // Skip if it's a route segment (projects, buildings, floors, wings, spaces)
          if (['projects', 'buildings', 'floors', 'wings', 'spaces'].includes(segment)) {
            continue;
          }
          
          // Check if this is a project ID
          if (i > 0 && pathnames[i-1] === 'projects' && segment.length > 10) {
            try {
              const project = await getProject(segment);
              if (project) {
                newNames[segment] = project.name;
              }
            } catch (e) {}
          }
          
          // Check if this is a building ID
          if (i > 0 && pathnames[i-1] === 'buildings' && segment.length > 10) {
            try {
              const building = await getBuilding(segment);
              if (building) {
                newNames[segment] = building.name;
              }
            } catch (e) {}
          }
          
          // Check if this is a floor ID
          if (i > 0 && pathnames[i-1] === 'floors' && segment.length > 10) {
            try {
              const floor = await getFloor(segment);
              if (floor) {
                newNames[segment] = floor.name;
              }
            } catch (e) {}
          }
          
          // Check if this is a wing ID
          if (i > 0 && pathnames[i-1] === 'wings' && segment.length > 10) {
            try {
              const wing = await getWing(segment);
              if (wing) {
                newNames[segment] = wing.name;
              }
            } catch (e) {}
          }
          
          // Check if this is a space ID
          if (i > 0 && pathnames[i-1] === 'spaces' && segment.length > 10) {
            try {
              const space = await getSpace(segment);
              if (space) {
                newNames[segment] = space.name;
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Error fetching names:', err);
      } finally {
        setNames(newNames);
        setLoading(false);
      }
    };

    fetchNames();
  }, [location.pathname]);

  // Build breadcrumb items
  const buildBreadcrumbs = () => {
    const items = [];
    let currentPath = '';

    // Always start with Dashboard
    items.push({
      name: 'Dashboard',
      path: '/',
      isLink: true,
    });

    for (let i = 0; i < pathnames.length; i++) {
      const segment = pathnames[i];
      currentPath += `/${segment}`;
      
      // Skip route segments (projects, buildings, floors, wings, spaces)
      if (['projects', 'buildings', 'floors', 'wings', 'spaces'].includes(segment)) {
        continue;
      }
      
      // Skip IDs that are too short (shouldn't be IDs)
      if (segment.length < 10) {
        // But add them if they're meaningful (like "new" or "edit")
        if (['new', 'edit', 'create'].includes(segment)) {
          items.push({
            name: segment.charAt(0).toUpperCase() + segment.slice(1),
            path: currentPath,
            isLink: false,
          });
        }
        continue;
      }
      
      // Use fetched name or fallback
      const displayName = names[segment] || segment.substring(0, 8) + '...';
      const isLast = i === pathnames.length - 1;
      
      items.push({
        name: displayName,
        path: currentPath,
        isLink: !isLast,
      });
    }

    return items;
  };

  const breadcrumbs = buildBreadcrumbs();

  // If loading and we have pathnames, show loading
  if (loading && pathnames.length > 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Home size={16} className="text-gray-400" />
        <span className="font-medium text-gray-500 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.path + index}>
          {index > 0 && (
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
          )}
          {item.isLink ? (
            <Link
              to={item.path}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors truncate max-w-[150px]"
            >
              {item.name}
            </Link>
          ) : (
            <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
              {item.name}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default Breadcrumb;