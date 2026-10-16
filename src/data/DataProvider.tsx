import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  CITIES,
  createRng,
  createSeed,
  DEFAULT_PLAN_LIMITS,
  MIN,
  makeActivity,
  nextAlertId,
  pick,
  pickModule,
  pickWeighted,
  pushEvent,
  randomSession,
  type Rng,
  type Seed,
} from './mock';
import { ACTIVITY_SHORT, isIdle, MODULE_BY_ID } from './modules';
import { activeByUser, DEFAULT_FILTERS, isActive, joinPt, suspectUserIds, uniqueCities } from './selectors';
import type { Activity, AlertItem, Filters, Plan, PlanLimits, Session, User } from './types';

const TICK_MS = 3000;
const simRng = createRng(Date.now() & 0xffff);
const SERIES_LENGTH = 32;

type State = Seed & {
  lastUpdate: number;
  planLimits: PlanLimits;
};

type DataValue = State & {
  active: Session[];
  byUser: Map<string, Session[]>;
  suspects: Set<string>;
  openAlerts: AlertItem[];
  resolvedAlerts: AlertItem[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  notificationsOn: boolean;
  setNotificationsOn: (v: boolean) => void;
  autoBlock: boolean;
  setAutoBlock: (v: boolean) => void;
  setPlanLimit: (plan: Plan, value: number) => void;
  endSession: (sessionId: string) => void;
  endAllSessions: (userId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  resolveAlert: (alertId: string) => void;
};

const DataContext = createContext<DataValue | null>(null);

/** Resolve alertas de excesso quando o usuário volta para dentro do limite, e de aluno parado quando ele volta a interagir. */
function settleAlerts(alerts: AlertItem[], sessions: Session[], users: Record<string, User>, limits: PlanLimits, now: number) {
  const byUser = activeByUser(sessions);
  return alerts.map((a) => {
    if (a.resolvedAt) return a;
    if (a.kind === 'parado') {
      const stillIdle = (byUser.get(a.userId) ?? []).some((s) => isIdle(s.activity, now));
      return stillIdle ? a : { ...a, resolvedAt: now };
    }
    if (a.kind !== 'simultaneo' && a.kind !== 'limite') return a;
    const user = users[a.userId];
    const count = byUser.get(a.userId)?.length ?? 0;
    return user && count <= limits[user.plan] ? { ...a, resolvedAt: now } : a;
  });
}

const STEP_CHANCE = 0.035;
const STALL_CHANCE = 0.0015;
const RESUME_CHANCE = 0.004;
const MAX_OPEN_IDLE = 3;

/** Avança a atividade de uma sessão: lição, quiz, minijogos e troca de módulo. */
function stepActivity(
  rng: Rng,
  a: Activity,
  user: User,
  now: number,
): { activity: Activity; user: User } {
  const module = MODULE_BY_ID[a.moduleId];
  const base = { ...a, lastActionAt: now };
  switch (a.kind) {
    case 'licao':
      if (rng() < 0.15) return { activity: { ...base, kind: rng() < 0.5 ? 'forca' : 'relogio', since: now }, user };
      return { activity: { ...base, kind: 'quiz', since: now }, user };
    case 'forca':
    case 'relogio': {
      const won = rng() < 0.7;
      const label = a.kind === 'forca' ? 'o jogo da forca' : 'o contra o relógio';
      const next = pushEvent(
        { ...user, xp: user.xp + (won ? 15 : 0) },
        won
          ? { at: now, kind: 'jogo', text: `Venceu ${label}`, xp: 15 }
          : { at: now, kind: 'quizErro', text: `Perdeu ${label}` },
      );
      return { activity: { ...base, kind: 'licao', since: now }, user: next };
    }
    case 'quiz':
      if (rng() >= 0.75) {
        return {
          activity: base,
          user: pushEvent(user, { at: now, kind: 'quizErro', text: `Errou o quiz da Lição ${a.lesson}` }),
        };
      }
      break;
    case 'tutorial':
      if (rng() < 0.5) return { activity: base, user };
      break;
  }

  // Lição concluída
  let next: User = {
    ...user,
    xp: user.xp + 30,
    progress: { ...user.progress, [a.moduleId]: Math.max(user.progress[a.moduleId] ?? 0, a.lesson) },
  };
  next = pushEvent(next, { at: now, kind: 'licao', text: `Concluiu a Lição ${a.lesson} de ${module.short}`, xp: 30 });
  if (a.lesson < module.lessons) {
    const kind = a.moduleId === 'godot' || a.moduleId === 'construct' ? 'tutorial' : 'licao';
    return { activity: { ...base, lesson: a.lesson + 1, kind, since: now }, user: next };
  }
  const finished = Object.keys(next.progress).filter((id) => next.progress[id] >= MODULE_BY_ID[id].lessons);
  const moduleId = pickModule(rng, next.plan, finished);
  next = pushEvent(
    { ...next, xp: next.xp + 100 },
    { at: now, kind: 'modulo', text: `Concluiu o módulo ${module.name}`, xp: 100 },
  );
  next = pushEvent(
    { ...next, currentModuleId: moduleId },
    { at: now, kind: 'modulo', text: `Começou o módulo ${MODULE_BY_ID[moduleId].name}` },
  );
  const lesson = Math.min(MODULE_BY_ID[moduleId].lessons, (next.progress[moduleId] ?? 0) + 1);
  return { activity: { ...base, moduleId, lesson, kind: 'licao', since: now }, user: next };
}

function tick(state: State, rng: Rng, now: number): State {
  let sessions = state.sessions;
  let alerts = state.alerts;
  let users = state.users;
  const touchUser = (id: string, fn: (u: User) => User) => {
    if (users === state.users) users = { ...users };
    users[id] = fn(users[id]);
  };
  const activeList = sessions.filter(isActive);
  const activeUsers = new Set(activeList.map((s) => s.userId));
  let activeCount = activeList.length;

  const events = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < events; i++) {
    const pLogin = activeCount < 300 ? 0.75 : activeCount > 330 ? 0.3 : 0.55;
    if (rng() < pLogin) {
      const candidates = Object.keys(state.users).filter(
        (id) => !id.startsWith('u-') && !activeUsers.has(id) && !state.users[id].blocked,
      );
      if (!candidates.length) continue;
      const userId = pick(rng, candidates);
      activeUsers.add(userId);
      const session = randomSession(rng, userId, now - Math.floor(rng() * 20_000));
      session.activity = makeActivity(rng, users[userId], now, session.startedAt);
      session.activity.since = session.startedAt;
      session.activity.lastActionAt = session.startedAt;
      touchUser(userId, (u) =>
        pushEvent(u, {
          at: session.startedAt,
          kind: 'login',
          text: `Entrou pelo ${session.title.split(' · ')[0]} · ${session.city}`,
        }),
      );
      sessions = [...sessions, session];
      activeCount++;
    } else {
      const removable = sessions.filter((s) => isActive(s) && !s.userId.startsWith('u-'));
      if (!removable.length) continue;
      const target = pick(rng, removable);
      sessions = sessions.map((s) => (s.id === target.id ? { ...s, endedAt: now } : s));
      activeUsers.delete(target.userId);
      activeCount--;
    }
  }

  // De vez em quando, um acesso simultâneo novo
  const openSimultaneous = alerts.filter((a) => !a.resolvedAt && a.kind === 'simultaneo').length;
  if (openSimultaneous < 3 && rng() < 0.03) {
    const byUser = activeByUser(sessions);
    const candidates = [...byUser.entries()].filter(
      ([id, list]) => !id.startsWith('u-') && list.length === 1 && state.users[id]?.plan === 'Free',
    );
    if (candidates.length) {
      const [userId, [first]] = pick(rng, candidates);
      let place = pickWeighted(rng, CITIES);
      while (place.city === first.city) place = pickWeighted(rng, CITIES);
      const user = users[userId];
      // a outra pessoa usando a conta costuma estar em outro módulo
      const otherModule = pickModule(rng, user.plan, [first.activity?.moduleId ?? '']);
      const second = randomSession(rng, userId, now, { city: place.city, uf: place.uf });
      second.activity = {
        moduleId: otherModule,
        lesson: Math.min(MODULE_BY_ID[otherModule].lessons, (user.progress[otherModule] ?? 0) + 1),
        kind: 'licao',
        since: now,
        lastActionAt: now,
      };
      sessions = [...sessions, second];
      activeCount++;
      const minutes = Math.max(1, Math.round((now - first.startedAt) / MIN));
      alerts = [
        {
          id: nextAlertId(),
          kind: 'simultaneo',
          userId,
          title: `${user.handle} em 2 cidades`,
          detail: `${joinPt(uniqueCities([first, second]))} em ${minutes} minutos.`,
          createdAt: now,
        },
        ...alerts,
      ];
    }
  }

  // Atividade dos alunos
  let openIdle = alerts.filter((a) => !a.resolvedAt && a.kind === 'parado').length;
  const newAlerts: AlertItem[] = [];
  sessions = sessions.map((s) => {
    const a = s.activity;
    if (!a || !isActive(s) || users[s.userId]?.blocked) return s;
    if (a.stalled) {
      if (rng() < RESUME_CHANCE) {
        touchUser(s.userId, (u) =>
          pushEvent(u, { at: now, kind: 'retomou', text: `Voltou para a Lição ${a.lesson}` }),
        );
        return { ...s, activity: { ...a, stalled: false, idleAlerted: false, lastActionAt: now } };
      }
      if (isIdle(a, now) && !a.idleAlerted && openIdle < MAX_OPEN_IDLE) {
        openIdle++;
        const u = users[s.userId];
        const minutes = Math.round((now - a.lastActionAt) / MIN);
        newAlerts.push({
          id: nextAlertId(),
          kind: 'parado',
          userId: s.userId,
          title: `${u.handle} parado há ${minutes} min`,
          detail: `Lição ${a.lesson} de ${MODULE_BY_ID[a.moduleId].short} · ${ACTIVITY_SHORT[a.kind]}`,
          createdAt: now,
        });
        return { ...s, activity: { ...a, idleAlerted: true } };
      }
      return s;
    }
    if (rng() < STALL_CHANCE) return { ...s, activity: { ...a, stalled: true } };
    if (rng() >= STEP_CHANCE) return s;
    const result = stepActivity(rng, a, users[s.userId], now);
    touchUser(s.userId, () => result.user);
    return { ...s, activity: result.activity };
  });
  if (newAlerts.length) alerts = [...newAlerts, ...alerts];
  alerts = settleAlerts(alerts, sessions, users, state.planLimits, now);

  const series = [...state.series, activeCount].slice(-SERIES_LENGTH);
  const hour = new Date(now).getHours();
  const peak = activeCount > state.peak.value ? { value: activeCount, hour } : state.peak;

  return { ...state, users, sessions, alerts, series, peak, lastUpdate: now };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => {
    const now = Date.now();
    return { ...createSeed(now), lastUpdate: now, planLimits: DEFAULT_PLAN_LIMITS };
  });
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [autoBlock, setAutoBlock] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => tick(prev, simRng, Date.now()));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const endSessions = useCallback((predicate: (s: Session) => boolean) => {
    setState((prev) => {
      const now = Date.now();
      const sessions = prev.sessions.map((s) => (isActive(s) && predicate(s) ? { ...s, endedAt: now } : s));
      const alerts = settleAlerts(prev.alerts, sessions, prev.users, prev.planLimits, now);
      return { ...prev, sessions, alerts, lastUpdate: now };
    });
  }, []);

  const endSession = useCallback((sessionId: string) => endSessions((s) => s.id === sessionId), [endSessions]);
  const endAllSessions = useCallback((userId: string) => endSessions((s) => s.userId === userId), [endSessions]);

  const blockUser = useCallback((userId: string) => {
    setState((prev) => {
      const now = Date.now();
      const users = { ...prev.users, [userId]: { ...prev.users[userId], blocked: true } };
      const sessions = prev.sessions.map((s) => (isActive(s) && s.userId === userId ? { ...s, endedAt: now } : s));
      const alerts = settleAlerts(prev.alerts, sessions, users, prev.planLimits, now);
      return { ...prev, users, sessions, alerts, lastUpdate: now };
    });
  }, []);

  const unblockUser = useCallback((userId: string) => {
    setState((prev) => {
      const now = Date.now();
      const users = { ...prev.users, [userId]: { ...prev.users[userId], blocked: false } };
      const alerts = prev.alerts.map((a) =>
        !a.resolvedAt && a.kind === 'bloqueio' && a.userId === userId ? { ...a, resolvedAt: now } : a,
      );
      return { ...prev, users, alerts };
    });
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === alertId && !a.resolvedAt ? { ...a, resolvedAt: Date.now() } : a)),
    }));
  }, []);

  const setPlanLimit = useCallback((plan: Plan, value: number) => {
    setState((prev) => ({ ...prev, planLimits: { ...prev.planLimits, [plan]: Math.max(1, Math.min(10, value)) } }));
  }, []);

  const value = useMemo<DataValue>(() => {
    const active = state.sessions.filter(isActive);
    const byUser = activeByUser(state.sessions);
    const openAlerts = state.alerts.filter((a) => !a.resolvedAt).sort((a, b) => b.createdAt - a.createdAt);
    const resolvedAlerts = state.alerts
      .filter((a) => a.resolvedAt)
      .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));
    return {
      ...state,
      active,
      byUser,
      suspects: suspectUserIds(byUser, state.users, state.planLimits, state.alerts),
      openAlerts,
      resolvedAlerts,
      filters,
      setFilters,
      notificationsOn,
      setNotificationsOn,
      autoBlock,
      setAutoBlock,
      setPlanLimit,
      endSession,
      endAllSessions,
      blockUser,
      unblockUser,
      resolveAlert,
    };
  }, [
    state,
    filters,
    notificationsOn,
    autoBlock,
    setPlanLimit,
    endSession,
    endAllSessions,
    blockUser,
    unblockUser,
    resolveAlert,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
