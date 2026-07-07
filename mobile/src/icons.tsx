import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

/**
 * Untitled UI–style line icons (feather geometry, 24×24, round caps).
 * No icon font, no images — pure react-native-svg so it renders identically
 * on iOS, Android, and the web export. Stroke/линки inherit from the parent Svg.
 */
export type IconName =
  | 'home'
  | 'tasks'
  | 'certs'
  | 'profile'
  | 'calendar'
  | 'pin'
  | 'chevronRight'
  | 'arrowRight'
  | 'checkCircle'
  | 'clock'
  | 'logout'
  | 'training'
  | 'toolbox'
  | 'shieldCheck'
  | 'award'
  | 'briefcase'
  | 'mail'
  | 'user'
  | 'bell';

const PATHS: Record<IconName, ReactNode> = {
  home: (
    <>
      <Path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5Z" />
    </>
  ),
  tasks: (
    <>
      <Path d="M8 4h9a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <Path d="M9 3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V5H9V3.5Z" />
      <Polyline points="9 13 11 15 15 11" />
    </>
  ),
  certs: (
    <>
      <Path d="M12 3 5 5.5v5c0 4.6 3 7.9 7 9.2 4-1.3 7-4.6 7-9.2v-5L12 3Z" />
      <Polyline points="9 11.5 11 13.5 15 9.5" />
    </>
  ),
  profile: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  calendar: (
    <>
      <Rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <Line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
      <Line x1="8" y1="2.5" x2="8" y2="6" />
      <Line x1="16" y1="2.5" x2="16" y2="6" />
    </>
  ),
  pin: (
    <>
      <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <Circle cx="12" cy="10" r="2.6" />
    </>
  ),
  chevronRight: <Polyline points="9 5 16 12 9 19" />,
  arrowRight: (
    <>
      <Line x1="4" y1="12" x2="19" y2="12" />
      <Polyline points="13 6 19 12 13 18" />
    </>
  ),
  checkCircle: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Polyline points="8.5 12 11 14.5 15.5 9.5" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Polyline points="12 7 12 12 15.5 14" />
    </>
  ),
  logout: (
    <>
      <Path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <Polyline points="9 8 5 12 9 16" />
      <Line x1="5" y1="12" x2="15" y2="12" />
    </>
  ),
  training: (
    <>
      <Path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4Z" />
      <Path d="M6 10.5V16c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-5.5" />
    </>
  ),
  toolbox: (
    <>
      <Path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V16a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V6.5Z" />
      <Line x1="8" y1="10" x2="16" y2="10" />
      <Line x1="8" y1="13" x2="13" y2="13" />
    </>
  ),
  shieldCheck: (
    <>
      <Path d="M12 3 5 5.5v5c0 4.6 3 7.9 7 9.2 4-1.3 7-4.6 7-9.2v-5L12 3Z" />
      <Polyline points="9 11.5 11 13.5 15 9.5" />
    </>
  ),
  award: (
    <>
      <Circle cx="12" cy="8.5" r="5.5" />
      <Path d="M8.5 13 7 21l5-2.8L17 21l-1.5-8" />
    </>
  ),
  briefcase: (
    <>
      <Rect x="3" y="7.5" width="18" height="12.5" rx="2.5" />
      <Path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
    </>
  ),
  mail: (
    <>
      <Rect x="3" y="5" width="18" height="14" rx="2.5" />
      <Path d="m4 7 8 6 8-6" />
    </>
  ),
  user: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  bell: (
    <>
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
};

export function Icon({
  name,
  size = 24,
  color = '#667085',
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </Svg>
  );
}

/** Untitled UI "featured icon" — a tinted rounded tile wrapping a line icon. */
export function FeaturedIcon({
  name,
  color,
  bg,
  size = 40,
  radius = 10,
}: {
  name: IconName;
  color: string;
  bg: string;
  size?: number;
  radius?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} size={size * 0.5} color={color} strokeWidth={2} />
    </View>
  );
}

/** Brand logo mark: an accent-filled rounded tile with a white shield-check. */
export function LogoMark({ size = 56, color = '#DD1D21' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect x="0" y="0" width="48" height="48" rx="14" fill={color} />
      <Path
        d="M24 11 15 14.5v6.2c0 5.5 3.8 9.4 9 10.8 5.2-1.4 9-5.3 9-10.8v-6.2L24 11Z"
        fill="none"
        stroke="#fff"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Polyline
        points="20 21.5 22.8 24.3 28 18.8"
        fill="none"
        stroke="#fff"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
