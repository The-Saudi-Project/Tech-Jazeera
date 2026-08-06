/**
 * NfcEmployeeFormModal — add or edit a person under an NFC company. `companyId`
 * is required for create; passing `employee` switches to edit. The NFC card
 * number is the headline field (server-enforced unique across everyone).
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNfcEmployee, updateNfcEmployee } from '../nfc.api.js';
import { employeeFormSchema, emptyEmployeeForm } from '../nfc.schema.js';
import { apiMessage } from '../../../lib/utils.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import Button from '../../../components/ui/Button.jsx';

export default function NfcEmployeeFormModal({ open, onClose, companyId, employee, onSaved }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = Boolean(employee);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(employeeFormSchema), defaultValues: emptyEmployeeForm });

  useEffect(() => {
    if (open) reset(employee ? { ...emptyEmployeeForm, ...employee } : emptyEmployeeForm);
  }, [open, employee, reset]);

  const mutation = useMutation({
    mutationFn: (values) =>
      isEdit ? updateNfcEmployee(employee._id, values) : createNfcEmployee({ ...values, company: companyId }),
    onSuccess: () => {
      toast.success(isEdit ? 'Employee updated.' : 'Employee added.');
      queryClient.invalidateQueries({ queryKey: ['nfc-company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['nfc-companies'] }); // employee counts
      onSaved?.();
      onClose();
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit person' : 'Add person'}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        <Input label="Name *" error={errors.name?.message} {...register('name')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="NFC card number" error={errors.nfcCardNumber?.message} {...register('nfcCardNumber')} />
          <Input label="Designation" error={errors.designation?.message} {...register('designation')} />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input label="ID / Iqama number" error={errors.idNumber?.message} {...register('idNumber')} />
        </div>
        <Textarea label="Notes" rows={3} error={errors.notes?.message} {...register('notes')} />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
