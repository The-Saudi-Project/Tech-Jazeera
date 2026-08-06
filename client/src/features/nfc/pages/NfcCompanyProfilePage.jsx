/**
 * NfcCompanyProfilePage — one NFC company: its details (editable) and the people
 * under it, each with their NFC card. Full CRUD on both, Admin-only.
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { getNfcCompany, deleteNfcCompany, deleteNfcEmployee } from '../nfc.api.js';
import { apiMessage } from '../../../lib/utils.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import PageHeader from '../../../components/shared/PageHeader.jsx';
import ConfirmDialog from '../../../components/shared/ConfirmDialog.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Table from '../../../components/ui/Table.jsx';
import Skeleton from '../../../components/ui/Skeleton.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import NfcCompanyFormModal from '../components/NfcCompanyFormModal.jsx';
import NfcEmployeeFormModal from '../components/NfcEmployeeFormModal.jsx';

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm">{children || '—'}</dd>
    </div>
  );
}

export default function NfcCompanyProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user.role === 'Admin';

  const [editingCompany, setEditingCompany] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(false);
  const [addingPerson, setAddingPerson] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [deletingPerson, setDeletingPerson] = useState(null);

  const { data: company, isPending, isError } = useQuery({
    queryKey: ['nfc-company', id],
    queryFn: () => getNfcCompany(id),
    enabled: isAdmin,
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: () => deleteNfcCompany(id),
    onSuccess: () => {
      toast.success('Company deleted.');
      queryClient.invalidateQueries({ queryKey: ['nfc-companies'] });
      navigate('/nfc', { replace: true });
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  const deletePersonMutation = useMutation({
    mutationFn: (personId) => deleteNfcEmployee(personId),
    onSuccess: () => {
      toast.success('Person removed.');
      queryClient.invalidateQueries({ queryKey: ['nfc-company', id] });
      queryClient.invalidateQueries({ queryKey: ['nfc-companies'] });
      setDeletingPerson(null);
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  if (!isAdmin) return <Navigate to="/" replace />;

  if (isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState
        title="Company not found"
        description="It may have been deleted."
        action={
          <Link to="/nfc">
            <Button variant="secondary">Back to NFC Customers</Button>
          </Link>
        }
      />
    );
  }

  const columns = [
    { key: 'name', header: 'Name', render: (p) => <span className="font-medium">{p.name}</span> },
    {
      key: 'nfcCardNumber',
      header: 'NFC card',
      render: (p) =>
        p.nfcCardNumber ? (
          <span className="font-mono text-sm">{p.nfcCardNumber}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    { key: 'designation', header: 'Designation', render: (p) => p.designation || '—', hideOnMobile: true },
    { key: 'phone', header: 'Phone', render: (p) => p.phone || '—', hideOnMobile: true },
    { key: 'idNumber', header: 'ID / Iqama', render: (p) => p.idNumber || '—', hideOnMobile: true },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEditingPerson(p)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeletingPerson(p)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={company.companyName}
        description={company.city || 'NFC customer'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditingCompany(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setDeletingCompany(true)}>
              Delete
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Company</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Contact person">{company.contactPerson}</Field>
            <Field label="Phone">{company.phone}</Field>
            <Field label="Email">{company.email}</Field>
            <Field label="City">{company.city}</Field>
          </dl>
          {company.notes && (
            <div className="mt-4">
              <dt className="text-xs uppercase tracking-wide text-muted">Notes</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm">{company.notes}</dd>
            </div>
          )}
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              People ({company.employees.length})
            </h2>
            <Button size="sm" onClick={() => setAddingPerson(true)}>
              Add person
            </Button>
          </div>
          <Table
            columns={columns}
            rows={company.employees}
            rowKey={(p) => p._id}
            emptyState={
              <EmptyState
                title="No people yet"
                description="Add the first person and their NFC card for this company."
                action={<Button onClick={() => setAddingPerson(true)}>Add person</Button>}
              />
            }
          />
        </div>
      </div>

      <NfcCompanyFormModal
        open={editingCompany}
        onClose={() => setEditingCompany(false)}
        company={company}
      />
      <NfcEmployeeFormModal
        open={addingPerson}
        onClose={() => setAddingPerson(false)}
        companyId={id}
      />
      <NfcEmployeeFormModal
        open={Boolean(editingPerson)}
        onClose={() => setEditingPerson(null)}
        companyId={id}
        employee={editingPerson}
      />

      <ConfirmDialog
        open={deletingCompany}
        title="Delete company?"
        message={`${company.companyName} and its ${company.employees.length} ${
          company.employees.length === 1 ? 'person' : 'people'
        } will be permanently removed.`}
        loading={deleteCompanyMutation.isPending}
        onConfirm={() => deleteCompanyMutation.mutate()}
        onCancel={() => setDeletingCompany(false)}
      />
      <ConfirmDialog
        open={Boolean(deletingPerson)}
        title="Remove person?"
        message={`${deletingPerson?.name} will be permanently removed from ${company.companyName}.`}
        confirmLabel="Remove"
        loading={deletePersonMutation.isPending}
        onConfirm={() => deletePersonMutation.mutate(deletingPerson._id)}
        onCancel={() => setDeletingPerson(null)}
      />
    </div>
  );
}
