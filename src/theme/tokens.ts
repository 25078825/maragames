export type Tint = { bg: string; fg: string };

export type Colors = {
  bg: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primarySoft: string;
  primaryText: string;
  onPrimary: string;
  danger: string;
  onDanger: string;
  dangerText: string;
  dangerBg: string;
  dangerBorder: string;
  warning: string;
  success: string;
  neutralBar: string;
  backdrop: string;
  chartLine: string;
  chartFillTop: string;
  cardGlow: string;
  tints: {
    blue: Tint;
    olive: Tint;
    green: Tint;
    red: Tint;
    purple: Tint;
    teal: Tint;
  };
};

export type ColorScheme = 'dark' | 'light';

export const darkColors: Colors = {
  bg: '#0E0B14',
  surface: '#16121E',
  surfaceRaised: '#1B1625',
  border: '#2A2336',
  borderStrong: '#3A3247',
  text: '#F3F0F8',
  textMuted: '#9790A3',
  textFaint: '#6A6376',
  primary: '#7C4DFF',
  primarySoft: '#271F3D',
  primaryText: '#A68BFF',
  onPrimary: '#FFFFFF',
  danger: '#EF625E',
  onDanger: '#1C0F12',
  dangerText: '#F2726E',
  dangerBg: '#22141A',
  dangerBorder: '#57282B',
  warning: '#E3A548',
  success: '#5BD68A',
  neutralBar: '#4A4356',
  backdrop: 'rgba(5, 3, 9, 0.72)',
  chartLine: '#9B7BFF',
  chartFillTop: '#7C4DFF',
  cardGlow: '#1E1730',
  tints: {
    blue: { bg: '#1D2740', fg: '#8DAEF2' },
    olive: { bg: '#2C2915', fg: '#D8C46B' },
    green: { bg: '#14301F', fg: '#6FD69A' },
    red: { bg: '#3A1B1D', fg: '#F2726E' },
    purple: { bg: '#2A2140', fg: '#B49CFF' },
    teal: { bg: '#132D2E', fg: '#6CCFCB' },
  },
};

export const lightColors: Colors = {
  bg: '#F5F4F8',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  border: '#E4E0EB',
  borderStrong: '#D2CCDC',
  text: '#16121E',
  textMuted: '#6B6577',
  textFaint: '#9C96A7',
  primary: '#6A3DE8',
  primarySoft: '#EEE8FD',
  primaryText: '#5A2FD6',
  onPrimary: '#FFFFFF',
  danger: '#E0524F',
  onDanger: '#FFFFFF',
  dangerText: '#C93C39',
  dangerBg: '#FDF2F1',
  dangerBorder: '#F2CAC8',
  warning: '#B7791F',
  success: '#1F9D55',
  neutralBar: '#C9C3D3',
  backdrop: 'rgba(22, 18, 30, 0.45)',
  chartLine: '#6A3DE8',
  chartFillTop: '#6A3DE8',
  cardGlow: '#F3EFFE',
  tints: {
    blue: { bg: '#E6EEFC', fg: '#2F5BB7' },
    olive: { bg: '#F6F0D6', fg: '#866F12' },
    green: { bg: '#E2F5EA', fg: '#1D7F48' },
    red: { bg: '#FCE7E6', fg: '#C93C39' },
    purple: { bg: '#EEE8FD', fg: '#5A2FD6' },
    teal: { bg: '#E0F3F2', fg: '#1F7A76' },
  },
};

export const fonts = {
  sans: 'Sora_400Regular',
  sansMedium: 'Sora_500Medium',
  sansSemiBold: 'Sora_600SemiBold',
  sansBold: 'Sora_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
};

export const space = {
  gutter: 20,
};
