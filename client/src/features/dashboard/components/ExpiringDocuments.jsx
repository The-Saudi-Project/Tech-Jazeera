/**
 * ExpiringDocuments — compliance panel: identity documents and uploaded files
 * expiring within 30 days (or already expired), soonest first. Employee items
 * link to the worker's profile.
 */
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import { formatDate } from '../../../lib/utils.js';

function ExpiryTag({ daysLeft }) {
  if (daysLeft < 0) return <Badge variant="danger">Expired</Badge>;
  return <Badge variant="warning">{daysLeft}d left</Badge>;
}

export default function ExpiringDocuments({ items }) {
  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
        Expiring documents
      </h2>
      {items.length === 0 ? (
        <EmptyState title="Nothing expiring" description="No documents expire in the next 30 days." />
      ) : (
        <div className="divide-y divide-border">
          {items.map((item, i) => {
            const label = `${item.label}${item.source === 'Employee' ? '' : ` · ${item.ref}`}`;
            const owner =
              item.source === 'Employee' ? (
                <Link to={`/employees/${item.ownerId}`} className="font-medium hover:text-primary">
                  {item.ownerName}
                </Link>
              ) : (
                <span className="font-medium">{item.ownerName}</span>
              );
            return (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                <div>
                  <p>{owner}</p>
                  <p className="text-xs text-muted">
                    {label} · expires {formatDate(item.expiry)}
                  </p>
                </div>
                <ExpiryTag daysLeft={item.daysLeft} />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
