/**
 * Badge — small status pill. Tinted background + colored text, one variant
 * per semantic meaning; screens never invent their own pill styling.
 */
import { cn } from '../../lib/utils.js';

const variants = {
  default: 'bg-border/50 text-muted',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

export default function Badge({ variant = 'default', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
