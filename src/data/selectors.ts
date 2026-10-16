import { DAY, HOUR, MIN, UF_NAMES } from './mock';
import type { AlertItem, Filters, PlanLimits, Session, User } from './types';

export const DEFAULT_FILTERS: Filters = {
  query: '',
  status: 'ativos',
  devices: [],
  period: 'hoje',
  locations: [],
  plans: [],
  modules: [],
};

export function isActive(s: Session) {
  return s.endedAt === undefined;
}

export function activeByUser(sessions: Session[]) {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    if (!isActive(s)) continue;
    const list = map.get(s.userId);
    if (list) list.push(s);
    else map.set(s.userId, [s]);
  }
  for (const list of map.values()) list.sort((a, b) => a.startedAt - b.startedAt);
  return map;
}

export function suspectUserIds(
  byUser: Map<string, Session[]>,
  users: Record<string, User>,
  limits: PlanLimits,
  alerts: AlertItem[],
) {
  const ids = new Set<string>();
  for (const [userId, list] of byUser) {
    const user = users[userId];
    if (user && list.length > limits[user.plan]) ids.add(userId);
  }
  for (const a of alerts) {
    if (!a.resolvedAt && a.kind === 'simultaneo') ids.add(a.userId);
  }
  return ids;
}

export function matchesLocation(s: Session, label: string) {
  const l = label.toLowerCase();
  return s.city.toLowerCase() === l || s.uf.toLowerCase() === l || (UF_NAMES[s.uf] ?? '').toLowerCase() === l;
}

export function startOfDay(ts: number) {
  return new Date(ts).setHours(0, 0, 0, 0);
}

export function applyFilters(
  sessions: Session[],
  users: Record<string, User>,
  filters: Filters,
  suspects: Set<string>,
  now: number,
) {
  const q = filters.query.trim().toLowerCase();
  const today = startOfDay(now);
  return sessions.filter((s) => {
    const active = isActive(s);
    switch (filters.status) {
      case 'ativos':
        if (!active) return false;
        break;
      case 'encerrados':
        if (active) return false;
        break;
      case 'suspeitos':
        if (!active || !suspects.has(s.userId)) return false;
        break;
    }
    switch (filters.period) {
      case 'agora':
        if (!active) return false;
        break;
      case 'hoje':
        if (!active && s.startedAt < today) return false;
        break;
      case '7d':
        if (s.startedAt < now - 7 * DAY) return false;
        break;
    }
    if (filters.devices.length && !filters.devices.includes(s.osFamily)) return false;
    if (filters.locations.length && !filters.locations.some((l) => matchesLocation(s, l))) return false;
    const user = users[s.userId];
    if (filters.plans.length && (!user || !filters.plans.includes(user.plan))) return false;
    if (filters.modules.length && (!s.activity || !filters.modules.includes(s.activity.moduleId))) return false;
    if (q) {
      const hay = `${user?.handle ?? ''} ${user?.email ?? ''} ${s.ip}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function activeFilterCount(f: Filters) {
  let n = 0;
  if (f.query.trim()) n++;
  if (f.status !== DEFAULT_FILTERS.status) n++;
  if (f.devices.length) n++;
  if (f.period !== DEFAULT_FILTERS.period) n++;
  if (f.locations.length) n++;
  if (f.plans.length) n++;
  if (f.modules.length) n++;
  return n;
}

export function initials(user: User) {
  const parts = user.handle.split('.');
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function formatClock(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDuration(ms: number) {
  const m = Math.max(0, Math.floor(ms / MIN));
  if (m < 1) return 'agora';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

export function formatAgo(ms: number) {
  const m = Math.max(0, Math.floor(ms / MIN));
  if (m < 1) return 'agora';
  if (m < 60) return `${m} min`;
  const h = Math.floor(ms / HOUR);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function formatDayLabel(dayStart: number, now: number) {
  const today = startOfDay(now);
  if (dayStart === today) return 'Hoje';
  if (dayStart === today - DAY) return 'Ontem';
  const d = new Date(dayStart);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

export function formatDateTime(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function joinPt(list: string[]) {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} e ${list[list.length - 1]}`;
}

export function uniqueCities(list: Session[]) {
  return [...new Set(list.map((s) => s.city))];
}
