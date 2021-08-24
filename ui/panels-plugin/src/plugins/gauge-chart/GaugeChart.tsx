import {
  JsonObject,
  PanelProps,
  AnyChartQueryDefinition,
} from '@perses-ui/core';

export const GaugeChartKind = 'GaugeChart' as const;

type GaugeChartKind = typeof GaugeChartKind;

export type GaugeChartProps = PanelProps<GaugeChartKind, GaugeChartOptions>;

interface GaugeChartOptions extends JsonObject {
  query: AnyChartQueryDefinition;
}

export function GaugeChart(props: GaugeChartProps) {
  return <div>{JSON.stringify(props)}</div>;
}
