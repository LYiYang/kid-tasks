export function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, amount: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + amount);
  return toDateString(d);
}

export type DayLabels =
  | '周日'
  | '周一'
  | '周二'
  | '周三'
  | '周四'
  | '周五'
  | '周六';

const DAY_LABELS: DayLabels[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function getDayLabel(dateStr: string): DayLabels {
  return DAY_LABELS[parseDate(dateStr).getDay()];
}

export function getWeekStart(dateStr: string): string {
  const d = parseDate(dateStr);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return toDateString(d);
}

export function getWeekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isWithinTerm(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}

export function formatDisplayDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function scopeEndDate(
  start: string,
  scope: 'day' | 'week' | 'term' | 'range',
  termEnd: string,
  rangeEnd?: string,
): string {
  if (scope === 'day') return start;
  if (scope === 'week') return addDays(getWeekStart(start), 6);
  if (scope === 'range') return rangeEnd ?? start;
  return termEnd;
}

export function taskCoversDate(
  planStart: string,
  planEnd: string | undefined,
  date: string,
): boolean {
  const end = planEnd ?? planStart;
  return planStart <= date && date <= end;
}

export function taskDoneOnDate(
  completedDates: string[] | undefined,
  date: string,
): boolean {
  return completedDates?.includes(date) ?? false;
}

export function taskVisibleOnDate(
  planStart: string,
  planEnd: string | undefined,
  date: string,
  excludedDates?: string[],
  excludedWeekdays?: number[],
  scope?: string,
  weekdays?: number[],
): boolean {
  if (weekdays && weekdays.length > 0) {
    if (!weekdays.includes(parseDate(date).getDay())) return false;
  } else {
    if (scope !== 'term' && !taskCoversDate(planStart, planEnd, date)) return false;
  }
  if (excludedDates?.includes(date)) return false;
  if (excludedWeekdays?.includes(parseDate(date).getDay())) return false;
  return true;
}

export function rangeOverlapDays(
  taskStart: string,
  taskEnd: string | undefined,
  regionStart: string,
  regionEnd: string,
): number {
  const end = taskEnd ?? taskStart;
  const overlapStart = taskStart > regionStart ? taskStart : regionStart;
  const overlapEnd = end < regionEnd ? end : regionEnd;
  if (overlapStart > overlapEnd) return 0;
  const d = parseDate(overlapStart);
  const e = parseDate(overlapEnd);
  return Math.round((e.getTime() - d.getTime()) / 86400000) + 1;
}

export function visibleDaysInRange(
  rangeStart: string,
  rangeEnd: string,
  excludedDates?: string[],
  excludedWeekdays?: number[],
): number {
  const start = parseDate(rangeStart);
  const end = parseDate(rangeEnd);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  let visible = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const ds = toDateString(d);
    if (excludedDates?.includes(ds)) continue;
    if (excludedWeekdays?.includes(d.getDay())) continue;
    visible++;
  }
  return visible;
}
