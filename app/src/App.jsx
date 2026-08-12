import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleGuard from './components/common/RoleGuard';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import BuildingDetail from './pages/BuildingDetail';
import LevelDetail from './pages/LevelDetail';
import WingDetail from './pages/WingDetail';
import SpaceDetail from './pages/SpaceDetail';
import Timeline from './pages/Timeline';
import Reports from './pages/Reports';
import Assessments from './pages/Assessments';
import Issues from './pages/Issues';
import Drawings from './pages/Drawings';
import Analytics from './pages/Analytics';
import People from './pages/People';
import Settings from './pages/Settings';
import TaskAllocation from './pages/TaskAllocation';
import MyTasks from './pages/MyTasks';
import PendingApprovals from './pages/PendingApprovals';
import TaskDetail from './pages/TaskDetail';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes - Authentication */}
            <Route path="/login" element={<AuthLayout />}>
              <Route index element={<Login />} />
            </Route>
            <Route path="/signup" element={<AuthLayout />}>
              <Route index element={<SignUp />} />
            </Route>
            <Route path="/forgot-password" element={<AuthLayout />}>
              <Route index element={<ForgotPassword />} />
            </Route>

            {/* Protected Routes - Require Authentication */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="projects/:projectId/buildings/:buildingId" element={<BuildingDetail />} />
              <Route path="projects/:projectId/buildings/:buildingId/floors/:floorId" element={<LevelDetail />} />
              <Route path="projects/:projectId/buildings/:buildingId/floors/:floorId/wings/:wingId" element={<WingDetail />} />
              <Route path="spaces/:spaceId" element={<SpaceDetail />} />
              <Route path="tasks/:taskId" element={<TaskDetail />} />
              <Route path="timeline" element={<Timeline />} />
              <Route path="reports" element={<Reports />} />
              <Route path="assessments" element={<Assessments />} />
              <Route path="issues" element={<Issues />} />
              <Route path="drawings" element={<Drawings />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="people" element={<People />} />
              <Route path="settings" element={<Settings />} />
              <Route path="tasks" element={<TaskAllocation />} />
              <Route path="my-tasks" element={<MyTasks />} />
              <Route path="pending-approvals" element={<PendingApprovals />} />
              
              
              {/* Admin Routes - HR and Director only */}
              <Route
                path="admin/users"
                element={
                  <RoleGuard roles={['hr', 'director']}>
                    <UserManagement />
                  </RoleGuard>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;