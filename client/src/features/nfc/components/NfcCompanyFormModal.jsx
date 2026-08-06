/**
 * NfcCompanyFormModal — add or edit an NFC company. Passing `company` puts it in
 * edit mode; omit it to create. Emits `onSaved` so the caller can refetch.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNfcCompany, updateNfcCompany } from '../nfc.api.js';
import { companyFormSchema, emptyCompanyForm } from '../nfc.schema.js';
import { apiMessage } from '../../../lib/utils.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import Button from '../../../components/ui/Button.jsx';

export default function NfcCompanyFormModal({ open, onClose, company, onSaved }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = Boolean(company);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(companyFormSchema), defaultValues: emptyCompanyForm });

  // Load the record (or blank) each time the modal opens.
  useEffect(() => {
    if (open) reset(company ? { ...emptyCompanyForm, ...company } : emptyCompanyForm);
  }, [open, company, reset]);

  const mutation = useMutation({
    mutationFn: (values) =>
      isEdit ? updateNfcCompany(company._id, values) : createNfcCompany(values),
    onSuccess: (saved) => {
      toast.success(isEdit ? 'Company updated.' : 'Company created.');
      queryClient.invalidateQueries({ queryKey: ['nfc-companies'] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['nfc-company', company._id] });
      onSaved?.(saved);
      onClose();
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit company' : 'Add company'}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        <Input label="Company name *" error={errors.companyName?.message} {...register('companyName')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Contact person" error={errors.contactPerson?.message} {...register('contactPerson')} />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="City" error={errors.city?.message} {...register('city')} />
        </div>
        <Textarea label="Notes" rows={3} error={errors.notes?.message} {...register('notes')} />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
