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

replaceFile('server/src/modules/clients/client.model.js', [
  ["status: { type: String, enum: CLIENT_STATUSES, default: 'Active' },", "status: { type: String, enum: CLIENT_STATUSES, default: 'Active' },\n    creditLimitDays: { type: Number, default: 50, min: 0 },"]
]);

replaceFile('server/src/modules/clients/client.validation.js', [
  ["status: z.enum(CLIENT_STATUSES).default('Active'),", "creditLimitDays: z.preprocess(emptyToUndef, z.coerce.number().int().min(0).optional()),\n  status: z.enum(CLIENT_STATUSES).default('Active'),"]
]);

replaceFile('client/src/features/clients/clients.schema.js', [
  ["status: z.string().optional().or(z.literal('')),", "creditLimitDays: z.string().optional().or(z.literal('')),\n  status: z.string().optional().or(z.literal('')),"],
  ["status: 'Active',", "creditLimitDays: '50',\n  status: 'Active',"],
  ["status: client.status,", "creditLimitDays: client.creditLimitDays?.toString() ?? '50',\n    status: client.status,"]
]);

replaceFile('client/src/features/clients/components/ClientForm.jsx', [
  ["<Input label={t('staffClients.form.industry', 'Industry')} placeholder={t('common.optional')} error={errors.industry?.message} {...register('industry')} />", "<Input label={t('staffClients.form.industry', 'Industry')} placeholder={t('common.optional')} error={errors.industry?.message} {...register('industry')} />\n          <Input label=\"Credit Limit Days\" type=\"number\" min=\"0\" error={errors.creditLimitDays?.message} {...register('creditLimitDays')} />"]
]);
