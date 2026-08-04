/**
 * Timesheet processor — the deterministic attendance rules. Pure functions, no
 * I/O, so the logic is trivial to reason about, test, and extend later (shift
 * timings, holiday calendars, custom rules all slot in here).
 *
 * Business rules (confirmed with the administrator — "literal" policy):
 *  - For each date: sort punches, FIRST = Login, LAST = Logout, ignore the rest.
 *  - Worked = Logout − Login. Exactly one punch → Single Punch, worked 00:00.
 *  - EVERY day of the month accrues the required hours. Deficiency and overtime
 *    are computed on every day, so a No-Attendance or Single-Punch day shows a
 *    full-day deficiency. (Weekends/holidays are out of scope until a holiday
 *    calendar is added — a documented, deliberate limitation.)
 */
import { STATUS } from './timesheet.constants.js';
import { minutesToHHMM, daysInMonth, weekdayShort } from './timesheet.time.js';

/** Decide the per-day status from the punch count and worked-vs-required split. */
function dayStatus(punchCount, workedMinutes, requiredMinutes) {
  if (punchCount === 0) return STATUS.NO_ATTENDANCE;
  if (punchCount === 1) return STATUS.SINGLE_PUNCH;
  if (workedMinutes > requiredMinutes) return STATUS.OVERTIME;
  if (workedMinutes < requiredMinutes) return STATUS.DEFICIENT;
  return STATUS.PRESENT;
}

/**
 * Build the month's rows and summary.
 * @param {{day:number, minutes:number}[]} punches  parsed punches (this month)
 * @param {{year:number, month:number, requiredMinutes:number}} opts
 */
export function buildTimesheet(punches, { year, month, requiredMinutes }) {
  // Group minute-of-day values by day-of-month.
  const byDay = new Map();
  for (const { day, minutes } of punches) {
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(minutes);
  }

  const totalDays = daysInMonth(year, month);
  const rows = [];
  const summary = {
    workingDays: totalDays, // literal policy: every calendar day is a working day
    presentDays: 0, // days with a complete login + logout pair
    singlePunchDays: 0,
    noAttendanceDays: 0,
    totalWorkedMinutes: 0,
    totalRequiredMinutes: 0,
    totalDeficiencyMinutes: 0,
    totalOvertimeMinutes: 0,
  };

  for (let day = 1; day <= totalDays; day++) {
    const dayPunches = (byDay.get(day) ?? []).slice().sort((a, b) => a - b);
    const count = dayPunches.length;

    let login = null;
    let logout = null;
    let workedMinutes = 0;
    if (count >= 2) {
      login = dayPunches[0];
      logout = dayPunches[count - 1];
      workedMinutes = logout - login;
      summary.presentDays += 1;
    } else if (count === 1) {
      login = dayPunches[0]; // single punch is treated as a login; logout blank
      summary.singlePunchDays += 1;
    } else {
      summary.noAttendanceDays += 1;
    }

    const deficiencyMinutes = Math.max(0, requiredMinutes - workedMinutes);
    const overtimeMinutes = Math.max(0, workedMinutes - requiredMinutes);
    const status = dayStatus(count, workedMinutes, requiredMinutes);

    summary.totalWorkedMinutes += workedMinutes;
    summary.totalRequiredMinutes += requiredMinutes;
    summary.totalDeficiencyMinutes += deficiencyMinutes;
    summary.totalOvertimeMinutes += overtimeMinutes;

    rows.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day: weekdayShort(year, month, day),
      login: login == null ? null : minutesToHHMM(login),
      logout: logout == null ? null : minutesToHHMM(logout),
      workedMinutes,
      requiredMinutes,
      deficiencyMinutes,
      overtimeMinutes,
      status,
    });
  }

  return { rows, summary };
}
