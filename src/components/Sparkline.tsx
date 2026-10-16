import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

function smoothPath(points: [number, number][]) {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function Sparkline({ data, height = 84 }: { data: number[]; height?: number }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const padTop = 10;
  const padBottom = 14;
  const padRight = 12;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(1, max - min);
  const points: [number, number][] = data.map((v, i) => [
    (i / Math.max(1, data.length - 1)) * (width - padRight),
    padTop + (1 - (v - min) / span) * (height - padTop - padBottom),
  ]);
  const line = smoothPath(points);
  const last = points[points.length - 1];

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Path d={line} stroke={colors.chartLine} strokeWidth={2} fill="none" strokeLinejoin="round" />
          <Circle cx={last[0]} cy={last[1]} r={4} fill={colors.chartLine} />
        </Svg>
      ) : null}
    </View>
  );
}
