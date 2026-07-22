/**
 * AuthLayout — centered-card chrome for unauthenticated screens (login now;
 * e.g. a future "reset password" screen would drop in with zero layout work).
 */
import { Outlet } from 'react-router-dom';
import Card from '../../components/ui/Card.jsx';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg p-4">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-bold text-white">
          AJ
        </div>
        <span className="text-lg font-semibold tracking-tight">Al Jazeera ERP</span>
      </div>
      <Card className="w-full max-w-sm">
        <Outlet />
      </Card>
      <p className="text-xs text-muted">Internal system — authorized staff only</p>
    </div>
  );
}
