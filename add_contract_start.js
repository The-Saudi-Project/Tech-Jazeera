const fs = require('fs');

function addContractStartDate(file, regex, replacement) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log('Modified ' + file);
  }
}

// 1. Employee Form
addContractStartDate(
  'client/src/features/employees/components/EmployeeForm.jsx',
  /<Input\s*label=\{t\('staffEmployees\.form\.contractEndDate', 'Contract End Date'\)\}/,
  `<Input
          label={t('staffEmployees.form.contractStartDate', 'Contract Start Date')}
          type="date"
          error={errors.contractStartDate?.message}
          {...register('contractStartDate')}
        />
        <Input
          label={t('staffEmployees.form.contractEndDate', 'Contract End Date')}`
);

// 2. Client Zod Schema
addContractStartDate(
  'client/src/features/employees/employees.schema.js',
  /contractEndDate:\s*z\.string\(\)\.nullable\(\)\.optional\(\),/,
  "contractStartDate: z.string().nullable().optional(),\n  contractEndDate: z.string().nullable().optional(),"
);

// 3. Server Model
addContractStartDate(
  'server/src/modules/employees/employee.model.js',
  /contractEndDate:\s*\{\s*type:\s*Date\s*\},/,
  "contractStartDate: { type: Date },\n    contractEndDate: { type: Date },"
);

// 4. Server Validation
addContractStartDate(
  'server/src/modules/employees/employee.validation.js',
  /contractEndDate:\s*z\.string\(\)\.datetime\(\)\.optional\(\),/,
  "contractStartDate: z.string().datetime().optional(),\n  contractEndDate: z.string().datetime().optional(),"
);

// 5. Update Profile View to show it
addContractStartDate(
  'client/src/features/employees/pages/EmployeeProfilePage.jsx',
  /\{employee\.contractEndDate && \(/,
  `{employee.contractStartDate && (
                <div>
                  <dt className="text-xs text-muted">Contract Start Date</dt>
                  <dd className="text-sm font-medium text-text">{formatDate(employee.contractStartDate)}</dd>
                </div>
              )}
              {employee.contractEndDate && (`
);

console.log('Added contractStartDate');
