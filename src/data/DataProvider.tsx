import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  CITIES,
  createRng,
  createSeed,
  DEFAULT_PLAN_LIMITS,
  MIN,
  nextAlertId,
  pick,
  pickWeighted,
  randomSession,
  type Seed,
} from './mock';
import { activeByUser, DEFAULT_FILTERS, isActive, joinPt, suspectUserIds, uniqueCities } from './selectors';
import type { AlertItem, Filters, Plan, PlanLimits, Session, User } from './types';

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

/** Resolve alertas de excesso quando o usuário volta para dentro do limite. */
function settleAlerts(alerts: AlertItem[], sessions: Session[], users: Record<string, User>, limits: PlanLimits, now: number) {
  const byUser = activeByUser(sessions);
  return alerts.map((a) => {
    if (a.resolvedAt || (a.kind !== 'simultaneo' && a.kind !== 'limite')) return a;
    const user = users[a.userId];
    const count = byUser.get(a.userId)?.length ?? 0;
    return user && count <= limits[user.plan] ? { ...a, resolvedAt: now } : a;
  });
}

function tick(state: State, rng: () => number, now: number): State {
  let sessions = state.sessions;
  let alerts = state.alerts;
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
      sessions = [...sessions, randomSession(rng, userId, now - Math.floor(rng() * 20_000))];
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
      const second = randomSession(rng, userId, now, { city: place.city, uf: place.uf });
      sessions = [...sessions, second];
      activeCount++;
      const user = state.users[userId];
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

  const series = [...state.series, activeCount].slice(-SERIES_LENGTH);
  const hour = new Date(now).getHours();
  const peak = activeCount > state.peak.value ? { value: activeCount, hour } : state.peak;

  return { ...state, sessions, alerts, series, peak, lastUpdate: now };
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
