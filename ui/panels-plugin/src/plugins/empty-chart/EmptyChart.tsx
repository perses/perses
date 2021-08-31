import { JsonObject, PanelProps } from '@perses-ui/core';

export const EmptyChartKind = 'EmptyChart' as const;

type EmptyChartKind = typeof EmptyChartKind;

export type EmptyChartProps = PanelProps<EmptyChartKind, EmptyChartOptions>;

type EmptyChartOptions = JsonObject;

export function EmptyChart(props: EmptyChartProps) {
  return <div>{JSON.stringify(props)}</div>;
}
