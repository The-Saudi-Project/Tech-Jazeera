import re
import os

base_dir = r'c:\Users\JARVIS\Desktop\Al Jazeera CRM\server\src\modules\deployments'

# 1. Update deployment.validation.js
val_path = os.path.join(base_dir, 'deployment.validation.js')
with open(val_path, 'r', encoding='utf-8') as f:
    val = f.read()

val = re.sub(r'// match the field this app already had\)\. `daysWorked` is new — a second\n// headline number a real client timesheet always carries alongside total\n// hours; purely informational/cross-check, not part of the OT formula\.\n// Bounded loosely \(a month has at most 31 real days\) — the tighter, real\n// bound \(can\'t exceed the deployment\'s actual placement days that month\)\n// needs the deployment/month context this file doesn\'t have, so it\'s\n// checked in deployment\.service\.js instead, same reasoning the old\n// day-count check already used for exactly this file/service split\.\n', '', val)

val = re.sub(r'\s*daysWorked: z\.coerce\.number\(\{ error: \'Enter the number of days worked\.\' \}\)\.int\(\'Whole days only\.\'\)\.min\(0\)\.max\(31\),', '', val)

with open(val_path, 'w', encoding='utf-8') as f:
    f.write(val)
print('validation done')


# 2. Update deployment.service.js
srv_path = os.path.join(base_dir, 'deployment.service.js')
with open(srv_path, 'r', encoding='utf-8') as f:
    srv = f.read()

# Remove assertDaysWorkedWithinPlacement definition
srv = re.sub(r'/\*\* `daysWorked` can never exceed how many real days the deployment actually[\s\S]*?}\n\n', '', srv)

# Remove calls to assertDaysWorkedWithinPlacement
srv = re.sub(r'\s*assertDaysWorkedWithinPlacement\(deployment, [^,]+, data\.daysWorked\);', '', srv)

# Remove daysWorked from object creation
srv = re.sub(r'\s*daysWorked: (data|entry)\.daysWorked,', '', srv)
srv = re.sub(r'\s*entry\.daysWorked = data\.daysWorked;', '', srv)

# Remove daysWorked from audit meta
srv = re.sub(r'daysWorked: (data|entry)\.daysWorked, ', '', srv)

with open(srv_path, 'w', encoding='utf-8') as f:
    f.write(srv)
print('service done')

# 3. Update deployment.model.js
mod_path = os.path.join(base_dir, 'deployment.model.js')
with open(mod_path, 'r', encoding='utf-8') as f:
    mod = f.read()

mod = re.sub(r'\s*// How many real days the client\'s timesheet shows as worked that month\n\s*// — added 2026-09-16, a second headline number a real timesheet always\n\s*// carries alongside total hours\. Informational/cross-check only, not\n\s*// part of the otHours formula below\. `0` on a pre-2026-09-16 record\n\s*// that predates this field \(never invented after the fact\)\.\n\s*daysWorked: { type: Number, default: 0, min: 0, max: 31 },', '', mod)

with open(mod_path, 'w', encoding='utf-8') as f:
    f.write(mod)
print('model done')
