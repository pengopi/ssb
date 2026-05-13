import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';
import { theme } from '../theme';

interface Props {
  values: { label: string; value: number }[]; // value 1-10
  size?: number;
}

export default function RadarChart({ values, size = 260 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40;
  const n = values.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const point = (i: number, r: number) => ({
    x: cx + Math.cos(angle(i)) * r,
    y: cy + Math.sin(angle(i)) * r,
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = values.map((v, i) => point(i, (v.value / 10) * radius));
  const dataStr = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View testID="radar-chart">
      <Svg width={size} height={size}>
        {gridLevels.map((lvl, idx) => {
          const pts = values
            .map((_, i) => {
              const p = point(i, radius * lvl);
              return `${p.x},${p.y}`;
            })
            .join(' ');
          return (
            <Polygon
              key={idx}
              points={pts}
              fill="none"
              stroke={theme.border}
              strokeWidth={1}
            />
          );
        })}
        {values.map((_, i) => {
          const p = point(i, radius);
          return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={theme.border} strokeWidth={1} />;
        })}
        <Polygon points={dataStr} fill={theme.primary} fillOpacity={0.35} stroke={theme.primary} strokeWidth={2} />
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={theme.primary} />
        ))}
        {values.map((v, i) => {
          const p = point(i, radius + 22);
          return (
            <SvgText
              key={i}
              x={p.x}
              y={p.y}
              fill={theme.text}
              fontSize={11}
              fontWeight="700"
              textAnchor="middle"
            >
              {v.label.toUpperCase()}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
