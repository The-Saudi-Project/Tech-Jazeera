/**
 * Dashboard landing page — M3 scope: a real welcome view proving the whole
 * stack (auth context, TanStack Query, axios, API) works end to end. M10
 * replaces this with the full analytics dashboard.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import Card from '../../../components/ui/Card.jsx';

/** GET /health → { uptime, environment, database } */
async function fetchHealth() {
  const { data } = await api.get('/health');
  return data.data;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: health, isLoading } = useQuery({ queryKey: ['health'], queryFn: fetchHealth });

  const online = health?.database === 'connected';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {user.email} · {user.role}
        </p>
      </div>

      <Card className="flex items-center gap-3">
        <span
          className={
            isLoading
              ? 'h-2.5 w-2.5 animate-pulse rounded-full bg-muted'
              : online
                ? 'h-2.5 w-2.5 rounded-full bg-success'
                : 'h-2.5 w-2.5 rounded-full bg-danger'
          }
        />
        <div>
          <p className="text-sm font-medium">
            {isLoading ? 'Checking system status…' : online ? 'All systems operational' : 'Database unreachable'}
          </p>
          {health && (
            <p className="text-xs text-muted">
              API up {health.uptime} · {health.environment} environment
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
