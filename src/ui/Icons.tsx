interface P { size?: number; color?: string }

const base = (size: number, color: string) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color,
  'stroke-width': 2, 'stroke-linecap': 'round' as const, 'stroke-linejoin': 'round' as const, 'aria-hidden': true,
});

export const Check = ({ size = 16, color = '#04111D' }: P) => (
  <svg {...base(size, color)} stroke-width={3}><path d="M5 12l5 5L20 7" /></svg>
);
export const Lock = ({ size = 14, color = '#FFB547' }: P) => (
  <svg {...base(size, color)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const Back = ({ size = 20, color = '#B5C3D6' }: P) => (
  <svg {...base(size, color)}><path d="M15 6l-6 6 6 6" /></svg>
);
export const Swap = ({ size = 20, color = '#B5C3D6' }: P) => (
  <svg {...base(size, color)}><path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /></svg>
);
export const Gear = ({ size = 20, color = '#B5C3D6' }: P) => (
  <svg {...base(size, color)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
export const Plus = ({ size = 18, color = 'currentColor' }: P) => (
  <svg {...base(size, color)} stroke-width={2.2}><path d="M12 5v14M5 12h14" /></svg>
);
export const Close = ({ size = 16, color = '#8A9AB2' }: P) => (
  <svg {...base(size, color)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const Arrow = ({ size = 18, color = '#04111D' }: P) => (
  <svg {...base(size, color)} stroke-width={2.5}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const NoSignal = ({ size = 14, color = '#FFB547' }: P) => (
  <svg {...base(size, color)}><path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2.1-1.5M12 20h.01" /></svg>
);
export const Download = ({ size = 20, color = '#FFB547' }: P) => (
  <svg {...base(size, color)}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
);
export const Trend = ({ size = 20, color = '#38B6FF' }: P) => (
  <svg {...base(size, color)}><path d="M4 17l6-6 4 4 6-8" /><path d="M14 7h6v6" /></svg>
);
export const Calendar = ({ size = 18, color = '#8A9AB2' }: P) => (
  <svg {...base(size, color)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>
);
