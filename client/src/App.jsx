import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LessonPage from './pages/LessonPage';
import QuizSetupPage from './pages/QuizSetupPage';
import QuizPlayerPage from './pages/QuizPlayerPage';
import { ToastContainer } from 'react-toastify';
import WorkspacePage from './pages/WorkspacePage';
import { useEffect } from 'react';
function App() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
      <Routes>
        {/* The Layout route is now the parent for all pages */}
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            index // 'index' makes this the default child route for "/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="workspace/:workspaceId"
            element={
              <ProtectedRoute>
                <WorkspacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="lesson/:lessonId"
            element={
              <ProtectedRoute>
                <LessonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="quiz/setup/:workspaceId"
            element={
              <ProtectedRoute>
                <QuizSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="quiz/play"
            element={
              <ProtectedRoute>
                <QuizPlayerPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}

export default App;