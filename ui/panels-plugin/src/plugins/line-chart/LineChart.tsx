import {
  AnyChartQueryDefinition,
  JsonObject,
  PanelProps,
} from '@perses-ui/core';

export const LineChartKind = 'LineChart' as const;

type LineChartKind = typeof LineChartKind;

export type LineChartProps = PanelProps<LineChartKind, LineChartOptions>;

interface LineChartOptions extends JsonObject {
  query: AnyChartQueryDefinition;
  show_legend?: boolean;
}

export function LineChart(props: LineChartProps) {
  return <div>{JSON.stringify(props)}</div>;
}
