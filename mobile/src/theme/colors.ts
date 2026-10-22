export const colors = {
  brand: {
    lime: '#8BDF42',
    limeLight: '#ECF5A6',
    limeMid: '#80E354',
    limeDeep: '#4FA82A',
    onLime: '#0C0C0C',
  },
  bg: {
    app: '#0C0C0C',
    surface1: '#141414',
    surface2: '#1C1C1C',
    surface3: '#262626',
    surface4: '#2C2C2C',
    modal: '#161616',
    overlay: 'rgba(0,0,0,0.60)',
  },
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.10)',
    focus: '#8BDF42',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#8A8A8A',
    tertiary: '#5C5C5C',
    disabled: '#3D3D3D',
    onAccent: '#0C0C0C',
    onAccentMuted: 'rgba(12,12,12,0.65)',
  },
  status: {
    success: '#3DCB7A',
    successBg: 'rgba(61,203,122,0.14)',
    error: '#F04444',
    errorBg: 'rgba(240,68,68,0.14)',
    warning: '#F5B83D',
    warningBg: 'rgba(245,184,61,0.14)',
    info: '#4C8DFF',
    infoBg: 'rgba(76,141,255,0.14)',
    neutral: '#8A8A8A',
    neutralBg: 'rgba(255,255,255,0.06)',
  },
  secondary: '#212121',
  white: '#FFFFFF',
} as const;

export const gradients = {
  brand: { colors: ['#8BDF42', '#ECF5A6'], start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
  insight: { colors: ['#6FD13A', '#8BDF42', '#C9EE8A'], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
  hero: { colors: ['#262626', '#1C1C1C'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  chartBar: { colors: ['#ECF5A6', '#8BDF42', '#5CC72E'], start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
} as const;
