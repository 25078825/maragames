import type { Colors } from '@/theme/tokens';

export type Plan = 'Free' | 'Premium' | 'Empresarial';
export type OsFamily = 'Android' | 'iOS' | 'Windows' | 'macOS' | 'Linux';
export type TintName = keyof Colors['tints'];

export type User = {
  id: string;
  handle: string;
  name: string;
  email: string;
  plan: Plan;
  blocked: boolean;
  tint: TintName;
};

export type Session = {
  id: string;
  userId: string;
  kind: 'mobile' | 'desktop';
  /** "Galaxy A54 · Android 14" / "Windows 11 · Chrome" */
  title: string;
  /** "Android 14" / "Windows 11" */
  system: string;
  osFamily: OsFamily;
  ip: string;
  city: string;
  uf: string;
  startedAt: number;
  endedAt?: number;
};

export type AlertKind = 'simultaneo' | 'limite' | 'bloqueio' | 'novoDispositivo';

export type AlertItem = {
  id: string;
  kind: AlertKind;
  userId: string;
  title: string;
  detail: string;
  createdAt: number;
  resolvedAt?: number;
};

export type StatusFilter = 'todos' | 'ativos' | 'suspeitos' | 'encerrados';
export type PeriodFilter = 'agora' | 'hoje' | '7d' | 'outro';

export type Filters = {
  query: string;
  status: StatusFilter;
  devices: OsFamily[];
  period: PeriodFilter;
  locations: string[];
  plans: Plan[];
};

export type PlanLimits = Record<Plan, number>;
