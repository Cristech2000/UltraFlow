import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import Login from '../pages/Login';
import SignUp from '../pages/SignUp';
import ForgotPassword from '../pages/ForgotPassword';
import Dashboard from '../pages/Dashboard';
import Projects from '../pages/Projects';
import Timeline from '../pages/Timeline';
import Reports from '../pages/Reports';
import Assessments from '../pages/Assessments';
import Issues from '../pages/Issues';
import Drawings from '../pages/Drawings';
import Analytics from '../pages/Analytics';
import People from '../pages/People';
import Settings from '../pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Login /> },
    ],
  },
  {
    path: '/signup',
    element: <AuthLayout />,
    children: [
      { index: true, element: <SignUp /> },
    ],
  },
  {
    path: '/forgot-password',
    element: <AuthLayout />,
    children: [
      { index: true, element: <ForgotPassword /> },
    ],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'projects', element: <Projects /> },
      { path: 'timeline', element: <Timeline /> },
      { path: 'reports', element: <Reports /> },
      { path: 'assessments', element: <Assessments /> },
      { path: 'issues', element: <Issues /> },
      { path: 'drawings', element: <Drawings /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'people', element: <People /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);