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
  progress: Record<string, number>;
  currentModuleId: string;
  xp: number;
  streak: number;
  timeline: TimelineEvent[];
};

export type Module = {
  id: string;
  n: number;
  name: string;
  short: string;
  lessons: number;
  premium?: boolean;
};

export type ActivityKind = 'licao' | 'quiz' | 'forca' | 'relogio' | 'tutorial';

export type Activity = {
  moduleId: string;
  lesson: number;
  kind: ActivityKind;
  since: number;
  lastActionAt: number;
  stalled?: boolean;
  idleAlerted?: boolean;
};

export type TimelineKind = 'licao' | 'quizErro' | 'jogo' | 'modulo' | 'conquista' | 'login' | 'retomou';

export type TimelineEvent = {
  id: string;
  at: number;
  kind: TimelineKind;
  text: string;
  xp?: number;
};

export type Session = {
  id: string;
  userId: string;
  kind: 'mobile' | 'desktop';
  title: string;
  system: string;
  osFamily: OsFamily;
  ip: string;
  city: string;
  uf: string;
  startedAt: number;
  endedAt?: number;
  activity?: Activity;
};

export type AlertKind = 'simultaneo' | 'limite' | 'bloqueio' | 'novoDispositivo' | 'parado';

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
  modules: string[];
};

export type PlanLimits = Record<Plan, number>;
