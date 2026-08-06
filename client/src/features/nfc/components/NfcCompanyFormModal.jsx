/**
 * NfcCompanyFormModal — add or edit an NFC company (brand colour + links drive
 * how its tap pages look). Passing `company` puts it in edit mode.
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
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(companyFormSchema), defaultValues: emptyCompanyForm });

  useEffect(() => {
    if (open) reset(company ? { ...emptyCompanyForm, ...company } : emptyCompanyForm);
  }, [open, company, reset]);

  const brand = watch('brandColour');
  const brandValid = /^#[0-9a-fA-F]{6}$/.test(brand || '');

  const mutation = useMutation({
    mutationFn: (values) => (isEdit ? updateNfcCompany(company._id, values) : createNfcCompany(values)),
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit company' : 'Add company'} size="lg">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        <Input label="Company name *" error={errors.companyName?.message} {...register('companyName')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Contact person" error={errors.contactPerson?.message} {...register('contactPerson')} />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Website" placeholder="company.com" error={errors.website?.message} {...register('website')} />
        </div>
        <Input label="Address" error={errors.address?.message} {...register('address')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Maps link (optional)" placeholder="https://maps.app.goo.gl/…" error={errors.mapLink?.message} {...register('mapLink')} />
          <Input label="City" error={errors.city?.message} {...register('city')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text">Brand colour</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label="Brand colour picker"
              value={brandValid ? brand : '#4F46E5'}
              onChange={(e) => setValue('brandColour', e.target.value, { shouldValidate: true })}
              className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-border bg-surface p-1"
            />
            <Input className="flex-1" placeholder="#4F46E5" error={errors.brandColour?.message} {...register('brandColour')} />
          </div>
          <p className="text-xs text-muted">The accent colour on this company's tap pages.</p>
        </div>
        <Textarea label="Notes (internal)" rows={2} error={errors.notes?.message} {...register('notes')} />
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
