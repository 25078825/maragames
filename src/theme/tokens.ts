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
  success: string;
  neutralBar: string;
  backdrop: string;
  chartLine: string;
  tints: {
    neutral: Tint;
    red: Tint;
    purple: Tint;
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
  success: '#5BD68A',
  neutralBar: '#4A4356',
  backdrop: 'rgba(5, 3, 9, 0.72)',
  chartLine: '#9B7BFF',
  tints: {
    neutral: { bg: '#221C2C', fg: '#D9D4E2' },
    red: { bg: '#3A1B1D', fg: '#F2726E' },
    purple: { bg: '#2A2140', fg: '#B49CFF' },
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
  success: '#1F9D55',
  neutralBar: '#C9C3D3',
  backdrop: 'rgba(22, 18, 30, 0.45)',
  chartLine: '#6A3DE8',
  tints: {
    neutral: { bg: '#EEECF2', fg: '#3D3747' },
    red: { bg: '#FCE7E6', fg: '#C93C39' },
    purple: { bg: '#EEE8FD', fg: '#5A2FD6' },
  },
};

export const fonts = {
  regular: 'Sora_400Regular',
  medium: 'Sora_500Medium',
  semibold: 'Sora_600SemiBold',
};

export const type = {
  display: { fontFamily: fonts.semibold, fontSize: 44, lineHeight: 52, letterSpacing: -1 },
  title: { fontFamily: fonts.semibold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26 },
  heading: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
};

export const space = {
  gutter: 20,
};
