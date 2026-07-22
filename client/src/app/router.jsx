/**
 * Route table + auth guard. Two worlds:
 *   - AuthLayout wraps guest screens (/login)
 *   - RequireAuth → DashboardLayout wraps everything signed-in
 *
 * RequireAuth is the guard: while the silent session-restore runs it shows a
 * full-screen spinner (NOT a redirect — bouncing a logged-in user to /login
 * for a half second on every reload is the classic mistake), then either
 * renders the app or redirects to /login.
 */
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';
import Spinner from '../components/ui/Spinner.jsx';

function RequireAuth() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }
  if (status === 'guest') return <Navigate to="/login" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          // Feature routes (employees, clients, ...) are added here from M4 on.
        ],
      },
    ],
  },
  // Unknown URL: send home — RequireAuth then sorts out login if needed.
  { path: '*', element: <Navigate to="/" replace /> },
]);
