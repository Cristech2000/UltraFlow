import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { getSpace } from '../../services/spaceService';
import { getProject } from '../../services/projectService';

function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const [spaceName, setSpaceName] = useState(null);
  const [projectName, setProjectName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNames = async () => {
      setLoading(true);
      try {
        // Check if we're on a space detail page
        const spaceIndex = pathnames.indexOf('spaces');
        if (spaceIndex !== -1 && pathnames[spaceIndex + 1]) {
          const spaceId = pathnames[spaceIndex + 1];
          const space = await getSpace(spaceId);
          if (space) {
            setSpaceName(space.name);
            // Also fetch project name if available
            if (space.projectId) {
              const project = await getProject(space.projectId);
              if (project) {
                setProjectName(project.name);
              }
            }
          }
        } else {
          // Check if we're on a project detail page
          const projectIndex = pathnames.indexOf('projects');
          if (projectIndex !== -1 && pathnames[projectIndex + 1]) {
            const projectId = pathnames[projectIndex + 1];
            // Skip if it's a word like 'spaces', 'buildings', etc.
            if (!['spaces', 'buildings', 'floors', 'wings'].includes(projectId)) {
              const project = await getProject(projectId);
              if (project) {
                setProjectName(project.name);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching names:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNames();
  }, [location.pathname]);

  // Build breadcrumb items
  const buildBreadcrumbs = () => {
    const items = [];
    let skipNext = false;

    // Always start with Dashboard
    items.push({
      name: 'Dashboard',
      path: '/',
      isLink: true,
    });

    for (let i = 0; i < pathnames.length; i++) {
      const segment = pathnames[i];
      
      // Skip if we flagged to skip
      if (skipNext) {
        skipNext = false;
        continue;
      }

      // Skip "spaces" segment (we handle it differently)
      if (segment === 'spaces') {
        // If there's a space ID after "spaces", use it
        if (pathnames[i + 1]) {
          const spaceId = pathnames[i + 1];
          const displayName = spaceName || 'Loading...';
          items.push({
            name: displayName,
            path: `/spaces/${spaceId}`,
            isLink: false,
          });
          skipNext = true; // Skip the next segment (the space ID)
        }
        continue;
      }

      // Skip "projects" segment if it's followed by a project ID
      if (segment === 'projects' && pathnames[i + 1]) {
        const nextSegment = pathnames[i + 1];
        // Check if next segment is a project ID (not a word)
        if (!['spaces', 'buildings', 'floors', 'wings'].includes(nextSegment)) {
          const displayName = projectName || nextSegment;
          items.push({
            name: displayName,
            path: `/projects/${nextSegment}`,
            isLink: false,
          });
          skipNext = true; // Skip the next segment (the project ID)
          continue;
        } else {
          // If it's a word like 'spaces', show 'Projects' as a link
          items.push({
            name: 'Projects',
            path: '/projects',
            isLink: true,
          });
          continue;
        }
      }

      // Skip Firebase IDs (look like IDs with special chars)
      if (segment.length > 20 && !['projects', 'spaces'].includes(pathnames[i - 1])) {
        continue;
      }

      // Format display name
      let displayName = segment
        .replace(/-/g, ' ')
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

      // Don't link the last item
      const isLast = i === pathnames.length - 1;
      const path = `/${pathnames.slice(0, i + 1).join('/')}`;

      items.push({
        name: displayName,
        path: path,
        isLink: !isLast,
      });
    }

    return items;
  };

  const breadcrumbs = buildBreadcrumbs();

  // If loading, show a simple version
  if (loading && pathnames.length > 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Home size={16} className="text-gray-400" />
        <span className="font-medium">Loading...</span>
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