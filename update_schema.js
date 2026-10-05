const fs = require('fs');

function replaceFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  let newContent = content;
  for (const [from, to] of replacements) {
    newContent = newContent.replaceAll(from, to);
  }
  if (content !== newContent) {
    fs.writeFileSync(path, newContent);
    console.log('Updated ' + path);
  }
}

replaceFile('server/src/modules/employees/employee.model.js', [
  ['employmentEndDate: { type: Date, default: null },', 'contractStartDate: { type: Date, default: null },\n    contractEndDate: { type: Date, default: null },']
]);

replaceFile('server/src/modules/employees/employee.validation.js', [
  ['employmentEndDate', 'contractEndDate'],
  ['joiningDate: z.preprocess(emptyToUndef, z.coerce.date().optional()),', 'joiningDate: z.preprocess(emptyToUndef, z.coerce.date().optional()),\n    contractStartDate: z.preprocess(emptyToUndef, z.coerce.date().optional()),']
]);

replaceFile('client/src/features/employees/pages/EmployeeProfilePage.jsx', [
  ['employmentEndDate', 'contractEndDate'],
  ['Employment End Date', 'Contract End Date'],
  ['{formatDate(employee.joiningDate)}</ProfileField>', '{formatDate(employee.joiningDate)}</ProfileField>\n            {employee.contractStartDate && (\n              <ProfileField label="Contract Start Date">{formatDate(employee.contractStartDate)}</ProfileField>\n            )}']
]);

replaceFile('client/src/features/employees/employees.schema.js', [
  ['employmentEndDate', 'contractEndDate'],
  ['contractEndDate: z.string().optional().or(z.literal(\'\')),', 'contractStartDate: z.string().optional().or(z.literal(\'\')),\n    contractEndDate: z.string().optional().or(z.literal(\'\')),'],
  ['contractEndDate: \'\',', 'contractStartDate: \'\',\n  contractEndDate: \'\','],
  ['contractEndDate: toDateInput(employee.contractEndDate),', 'contractStartDate: toDateInput(employee.contractStartDate),\n    contractEndDate: toDateInput(employee.contractEndDate),']
]);

replaceFile('client/src/features/employees/components/EmployeeForm.jsx', [
  ['employmentEndDate', 'contractEndDate'],
  ['Employment End Date', 'Contract End Date'],
  ['{...register(\'joiningDate\')}\n        />', '{...register(\'joiningDate\')}\n        />\n        <Input\n          label={t(\'staffEmployees.form.contractStartDate\', \'Contract Start Date\')}\n          type="date"\n          error={errors.contractStartDate?.message}\n          {...register(\'contractStartDate\')}\n        />']
]);
