import type { Activity, ActivityKind, Module } from './types';

/** Módulos da plataforma (maragames.app). Os três últimos são exclusivos do Premium. */
export const MODULES: Module[] = [
  { id: 'game-design', n: 1, name: 'Fundamentos de Game Design', short: 'Game Design', lessons: 20 },
  { id: 'engines', n: 2, name: 'Game Engines', short: 'Engines', lessons: 20 },
  { id: 'programacao', n: 3, name: 'Programação para Jogos', short: 'Programação', lessons: 20 },
  { id: 'arte', n: 4, name: 'Arte & Pixel Art', short: 'Pixel Art', lessons: 20 },
  { id: 'audio', n: 5, name: 'Áudio & Música', short: 'Áudio', lessons: 20 },
  { id: 'publicacao', n: 6, name: 'Publicação & Monetização', short: 'Publicação', lessons: 20 },
  { id: 'curiosidades', n: 7, name: 'Curiosidades dos Games', short: 'Curiosidades', lessons: 31 },
  { id: 'nostalgia', n: 8, name: 'Nostalgia dos Games', short: 'Nostalgia', lessons: 20 },
  { id: 'marketing', n: 9, name: 'Marketing para Jogos', short: 'Marketing', lessons: 20 },
  { id: 'interativas', n: 10, name: 'Aulas Interativas', short: 'Interativas', lessons: 20, premium: true },
  { id: 'godot', n: 11, name: 'Tutorial Godot', short: 'Godot', lessons: 20, premium: true },
  { id: 'construct', n: 12, name: 'Tutorial Construct', short: 'Construct', lessons: 20, premium: true },
];

export const MODULE_BY_ID: Record<string, Module> = Object.fromEntries(MODULES.map((m) => [m.id, m]));

/** Peso de popularidade de cada módulo na simulação. */
export const MODULE_WEIGHT: Record<string, number> = {
  'game-design': 14,
  engines: 12,
  programacao: 18,
  arte: 14,
  audio: 6,
  publicacao: 4,
  curiosidades: 10,
  nostalgia: 7,
  marketing: 5,
  interativas: 4,
  godot: 4,
  construct: 2,
};

export const ACTIVITY_SHORT: Record<ActivityKind, string> = {
  licao: 'lição',
  quiz: 'quiz',
  forca: 'forca',
  relogio: 'relógio',
  tutorial: 'tutorial',
};

export const ACTIVITY_LONG: Record<ActivityKind, string> = {
  licao: 'lendo a lição',
  quiz: 'fazendo o quiz',
  forca: 'jogo da forca',
  relogio: 'contra o relógio',
  tutorial: 'seguindo o tutorial',
};

export const MIN_MS = 60_000;
/** Sem interação por este tempo, o aluno é considerado parado. */
export const IDLE_MS = 15 * MIN_MS;

export function levelFor(xp: number) {
  return Math.floor(xp / 300) + 1;
}

export function isIdle(a: Activity | undefined, now: number) {
  return !!a && now - a.lastActionAt >= IDLE_MS;
}

/** "Programação · Lição 7 · quiz" */
export function activityLine(a: Activity) {
  const m = MODULE_BY_ID[a.moduleId];
  return `${m?.short ?? a.moduleId} · Lição ${a.lesson} · ${ACTIVITY_SHORT[a.kind]}`;
}

/** "Programação · L7" */
export function activityCompact(a: Activity) {
  const m = MODULE_BY_ID[a.moduleId];
  return `${m?.short ?? a.moduleId} · L${a.lesson}`;
}
