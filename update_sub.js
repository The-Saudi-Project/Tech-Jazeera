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
  } else {
    console.log('No changes needed for ' + path);
  }
}

replaceFile('server/src/modules/subcontractors/subcontractor.model.js', [
  ["status: { type: String, enum: SUBCONTRACTOR_STATUSES, default: 'Active' },", "status: { type: String, enum: SUBCONTRACTOR_STATUSES, default: 'Active' },\n    creditLimitDays: { type: Number, default: 30, min: 0 },"]
]);

replaceFile('server/src/modules/subcontractors/subcontractor.validation.js', [
  ["status: z.enum(SUBCONTRACTOR_STATUSES).default('Active'),", "creditLimitDays: z.preprocess(emptyToUndef, z.coerce.number().int().min(0).optional()),\n  status: z.enum(SUBCONTRACTOR_STATUSES).default('Active'),"]
]);

replaceFile('client/src/features/subcontractors/subcontractors.schema.js', [
  ["status: z.string().optional().or(z.literal('')),", "creditLimitDays: z.string().optional().or(z.literal('')),\n  status: z.string().optional().or(z.literal('')),"],
  ["status: 'Active',", "creditLimitDays: '30',\n  status: 'Active',"],
  ["status: sub.status,", "creditLimitDays: sub.creditLimitDays?.toString() ?? '30',\n    status: sub.status,"]
]);

replaceFile('client/src/features/subcontractors/components/SubcontractorForm.jsx', [
  ["<Input label={t('staffSubcontractors.form.companyName')} error={errors.companyName?.message} {...register('companyName')} />", "<Input label={t('staffSubcontractors.form.companyName')} error={errors.companyName?.message} {...register('companyName')} />\n          <Input label=\"Credit Limit Days\" type=\"number\" min=\"0\" error={errors.creditLimitDays?.message} {...register('creditLimitDays')} />"]
]);
