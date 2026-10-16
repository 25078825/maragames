import type { AlertItem, OsFamily, Plan, PlanLimits, Session, TintName, User } from './types';

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const DEFAULT_PLAN_LIMITS: PlanLimits = { Free: 1, Premium: 2, Empresarial: 5 };

export const UF_NAMES: Record<string, string> = {
  MA: 'Maranhão',
  PI: 'Piauí',
  CE: 'Ceará',
  PA: 'Pará',
};

type City = { city: string; uf: string; weight: number };

export const CITIES: City[] = [
  { city: 'São Luís', uf: 'MA', weight: 30 },
  { city: 'Imperatriz', uf: 'MA', weight: 8 },
  { city: 'Caxias', uf: 'MA', weight: 6 },
  { city: 'São José de Ribamar', uf: 'MA', weight: 5 },
  { city: 'Paço do Lumiar', uf: 'MA', weight: 4 },
  { city: 'Timon', uf: 'MA', weight: 4 },
  { city: 'Bacabal', uf: 'MA', weight: 4 },
  { city: 'Codó', uf: 'MA', weight: 3 },
  { city: 'Balsas', uf: 'MA', weight: 3 },
  { city: 'Santa Inês', uf: 'MA', weight: 3 },
  { city: 'Teresina', uf: 'PI', weight: 6 },
  { city: 'Parnaíba', uf: 'PI', weight: 1 },
  { city: 'Fortaleza', uf: 'CE', weight: 1 },
  { city: 'Belém', uf: 'PA', weight: 1 },
];

type Device = Pick<Session, 'kind' | 'title' | 'system' | 'osFamily'> & { weight: number };

export const DEVICES: Device[] = [
  { kind: 'mobile', title: 'Galaxy A54 · Android 14', system: 'Android 14', osFamily: 'Android', weight: 10 },
  { kind: 'mobile', title: 'Galaxy A15 · Android 14', system: 'Android 14', osFamily: 'Android', weight: 8 },
  { kind: 'mobile', title: 'Moto G84 · Android 14', system: 'Android 14', osFamily: 'Android', weight: 7 },
  { kind: 'mobile', title: 'Redmi Note 13 · Android 14', system: 'Android 14', osFamily: 'Android', weight: 7 },
  { kind: 'mobile', title: 'Galaxy S23 · Android 15', system: 'Android 15', osFamily: 'Android', weight: 3 },
  { kind: 'mobile', title: 'iPhone 13 · iOS 18', system: 'iOS 18', osFamily: 'iOS', weight: 9 },
  { kind: 'mobile', title: 'iPhone 15 · iOS 18', system: 'iOS 18', osFamily: 'iOS', weight: 6 },
  { kind: 'mobile', title: 'iPhone 11 · iOS 17', system: 'iOS 17', osFamily: 'iOS', weight: 4 },
  { kind: 'desktop', title: 'Windows 11 · Chrome', system: 'Windows 11', osFamily: 'Windows', weight: 17 },
  { kind: 'desktop', title: 'Windows 10 · Edge', system: 'Windows 10', osFamily: 'Windows', weight: 7 },
  { kind: 'desktop', title: 'Windows 11 · Firefox', system: 'Windows 11', osFamily: 'Windows', weight: 4 },
  { kind: 'desktop', title: 'macOS 15 · Safari', system: 'macOS 15', osFamily: 'macOS', weight: 5 },
  { kind: 'desktop', title: 'macOS 14 · Chrome', system: 'macOS 14', osFamily: 'macOS', weight: 3 },
  { kind: 'desktop', title: 'Ubuntu 24.04 · Firefox', system: 'Linux', osFamily: 'Linux', weight: 3 },
];

const FIRST_NAMES = [
  'ana', 'bruno', 'carla', 'daniel', 'eduarda', 'felipe', 'gabriela', 'heitor', 'isabela', 'joao',
  'julia', 'kaio', 'larissa', 'lucas', 'mariana', 'mateus', 'natalia', 'otavio', 'paula', 'rafael',
  'renata', 'samuel', 'tais', 'thiago', 'vitoria', 'yuri', 'alice', 'arthur', 'beatriz', 'caio',
  'davi', 'enzo', 'fernanda', 'guilherme', 'helena', 'igor', 'leticia', 'miguel', 'nicolas', 'sofia',
];

const LAST_NAMES = [
  'silva', 'santos', 'oliveira', 'souza', 'lima', 'pereira', 'costa', 'rodrigues', 'almeida', 'nascimento',
  'araujo', 'ribeiro', 'carvalho', 'gomes', 'martins', 'rocha', 'barros', 'freitas', 'moraes', 'castro',
  'mendes', 'cardoso', 'teixeira', 'vieira', 'campos',
];

const TINTS: TintName[] = ['blue', 'olive', 'green', 'purple', 'teal', 'blue', 'green'];

export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: Rng, list: T[]): T {
  return list[Math.floor(rng() * list.length)];
}

export function pickWeighted<T extends { weight: number }>(rng: Rng, list: T[]): T {
  const total = list.reduce((sum, item) => sum + item.weight, 0);
  let r = rng() * total;
  for (const item of list) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return list[list.length - 1];
}

function randomIp(rng: Rng) {
  const prefixes = ['177.38', '189.90', '200.142', '187.19', '179.108', '201.48', '186.215', '191.33'];
  return `${pick(rng, prefixes)}.${Math.floor(rng() * 254) + 1}.${Math.floor(rng() * 254) + 1}`;
}

let sessionSeq = 0;
export function nextSessionId() {
  sessionSeq += 1;
  return `s${sessionSeq}`;
}

let alertSeq = 0;
export function nextAlertId() {
  alertSeq += 1;
  return `a${alertSeq}`;
}

export function randomSession(
  rng: Rng,
  userId: string,
  startedAt: number,
  overrides: Partial<Session> = {},
): Session {
  const device = pickWeighted(rng, DEVICES);
  const place = pickWeighted(rng, CITIES);
  return {
    id: nextSessionId(),
    userId,
    kind: device.kind,
    title: device.title,
    system: device.system,
    osFamily: device.osFamily,
    ip: randomIp(rng),
    city: place.city,
    uf: place.uf,
    startedAt,
    ...overrides,
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function makeUser(id: string, first: string, last: string, plan: Plan, tint: TintName, extraName?: string): User {
  const handle = `${first}.${last}`;
  return {
    id,
    handle,
    name: extraName ?? `${capitalize(first)} ${capitalize(last)}`,
    email: `${handle}@email.com`,
    plan,
    blocked: false,
    tint,
  };
}

export type Seed = {
  users: Record<string, User>;
  sessions: Session[];
  alerts: AlertItem[];
  series: number[];
  peak: { value: number; hour: number };
  hourBase: number;
};

const ACTIVE_TARGET = 312;

export function createSeed(now: number): Seed {
  const rng = createRng(20260911);
  const users: Record<string, User> = {};
  const sessions: Session[] = [];
  const alerts: AlertItem[] = [];

  const add = (u: User) => {
    users[u.id] = u;
    return u;
  };

  // Contas do mockup
  const lucas = add(makeUser('u-lucas', 'lucas', 'silva', 'Free', 'purple'));
  const ana = add(makeUser('u-ana', 'ana', 'beatriz', 'Premium', 'blue', 'Ana Beatriz Costa'));
  const joao = add(makeUser('u-joao', 'joao', 'pedro', 'Free', 'olive', 'João Pedro Lima'));
  const maria = add(makeUser('u-maria', 'maria', 'clara', 'Premium', 'green', 'Maria Clara Souza'));
  joao.blocked = true;

  const s = (userId: string, minutesAgo: number, device: number, ip: string, city: string, uf: string) => {
    const d = DEVICES[device];
    sessions.push({
      id: nextSessionId(),
      userId,
      kind: d.kind,
      title: d.title,
      system: d.system,
      osFamily: d.osFamily,
      ip,
      city,
      uf,
      startedAt: now - minutesAgo * MIN,
    });
  };

  s(lucas.id, 50, 0, '177.38.212.4', 'São Luís', 'MA');
  s(lucas.id, 41.5, 8, '189.90.14.77', 'Imperatriz', 'MA');
  s(lucas.id, 41.5, 5, '200.142.8.31', 'Teresina', 'PI');
  s(ana.id, 12, 5, '177.38.40.112', 'São Luís', 'MA');
  s(ana.id, 63, 6, '177.38.40.98', 'São Luís', 'MA');
  s(ana.id, 95, 12, '177.38.40.98', 'São Luís', 'MA');
  s(joao.id, 27, 8, '187.19.77.203', 'Caxias', 'MA');
  s(maria.id, 41, 0, '186.215.3.60', 'Bacabal', 'MA');
  s(maria.id, 60, 13, '186.215.3.61', 'Bacabal', 'MA');

  // Demais alunos
  const genericIds: string[] = [];
  let n = 0;
  for (const last of LAST_NAMES) {
    for (const first of FIRST_NAMES) {
      const handle = `${first}.${last}`;
      if (['lucas.silva'].includes(handle)) continue;
      n += 1;
      const r = rng();
      const plan: Plan = r < 0.6 ? 'Free' : r < 0.92 ? 'Premium' : 'Empresarial';
      const u = add(makeUser(`u${n}`, first, last, plan, TINTS[n % TINTS.length]));
      genericIds.push(u.id);
    }
  }

  // Sessões ativas: um aluno por sessão, todas dentro do limite
  const shuffled = [...genericIds].sort(() => rng() - 0.5);
  const activeNeeded = ACTIVE_TARGET - sessions.length;
  for (let i = 0; i < activeNeeded; i++) {
    const minutesAgo = 43 + Math.floor(rng() * 6 * 60);
    sessions.push(randomSession(rng, shuffled[i], now - minutesAgo * MIN));
  }

  // Histórico: sessões encerradas nos últimos 30 dias
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  for (let d = 0; d < 30; d++) {
    const dayStart = startOfToday - d * DAY;
    const dayEnd = d === 0 ? now - 15 * MIN : dayStart + DAY;
    const count = d === 0 ? 70 : 35 + Math.floor(rng() * 30);
    for (let i = 0; i < count; i++) {
      const start = dayStart + rng() * (dayEnd - dayStart);
      const duration = (8 + rng() * 170) * MIN;
      const end = Math.min(start + duration, now - 2 * MIN);
      if (end <= start) continue;
      sessions.push(randomSession(rng, pick(rng, genericIds), start, { endedAt: end }));
    }
  }

  // Alertas abertos (mockup)
  alerts.push(
    {
      id: nextAlertId(),
      kind: 'simultaneo',
      userId: lucas.id,
      title: 'lucas.silva em 3 cidades',
      detail: 'São Luís, Imperatriz e Teresina em 9 minutos.',
      createdAt: now - 2 * MIN,
    },
    {
      id: nextAlertId(),
      kind: 'limite',
      userId: ana.id,
      title: 'ana.beatriz com 3 de 2 sessões',
      detail: 'Plano Premium · mesma cidade',
      createdAt: now - 14 * MIN,
    },
    {
      id: nextAlertId(),
      kind: 'bloqueio',
      userId: joao.id,
      title: 'joao.pedro foi bloqueado',
      detail: 'Excedeu o limite 3 vezes hoje.',
      createdAt: now - 38 * MIN,
    },
    {
      id: nextAlertId(),
      kind: 'novoDispositivo',
      userId: maria.id,
      title: 'maria.clara entrou por um Linux',
      detail: 'Primeiro acesso por este sistema.',
      createdAt: now - 60 * MIN,
    },
  );

  // Alertas resolvidos hoje
  const resolvedKinds: AlertItem['kind'][] = ['simultaneo', 'limite', 'novoDispositivo', 'limite', 'simultaneo'];
  for (let i = 0; i < 11; i++) {
    const u = users[pick(rng, genericIds)];
    const kind = resolvedKinds[i % resolvedKinds.length];
    const createdAt = Math.max(startOfToday + 5 * MIN, now - (90 + i * 47) * MIN);
    const city = pickWeighted(rng, CITIES).city;
    const titles: Record<AlertItem['kind'], [string, string]> = {
      simultaneo: [`${u.handle} em 2 cidades`, `São Luís e ${city === 'São Luís' ? 'Timon' : city} em 6 minutos.`],
      limite: [`${u.handle} com 2 de 1 sessões`, `Plano ${u.plan} · mesma cidade`],
      novoDispositivo: [`${u.handle} entrou por um macOS`, 'Primeiro acesso por este sistema.'],
      bloqueio: [`${u.handle} foi bloqueado`, 'Excedeu o limite 3 vezes hoje.'],
    };
    alerts.push({
      id: nextAlertId(),
      kind,
      userId: u.id,
      title: titles[kind][0],
      detail: titles[kind][1],
      createdAt,
      resolvedAt: createdAt + (4 + Math.floor(rng() * 20)) * MIN,
    });
  }

  // Série do gráfico: subida suave até o valor atual
  const series: number[] = [];
  const points = 32;
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const base = 236 + (ACTIVE_TARGET - 236) * t;
    const noise = Math.sin(i * 1.7) * 6 + (rng() - 0.5) * 8;
    series.push(Math.round(i === points - 1 ? ACTIVE_TARGET : base + noise));
  }

  return {
    users,
    sessions,
    alerts,
    series,
    peak: { value: 418, hour: 14 },
    hourBase: ACTIVE_TARGET - 18,
  };
}

export function randomGenericUserId(rng: Rng, users: Record<string, User>, exclude: Set<string>) {
  const ids = Object.keys(users).filter((id) => !id.startsWith('u-') && !exclude.has(id) && !users[id].blocked);
  return ids.length ? pick(rng, ids) : undefined;
}

export function osFamilies(): OsFamily[] {
  return ['Android', 'iOS', 'Windows', 'macOS', 'Linux'];
}
