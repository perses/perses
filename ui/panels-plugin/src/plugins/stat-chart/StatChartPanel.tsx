import {
  JsonObject,
  AnyChartQueryDefinition,
  PanelProps,
  Series,
  useChartQuery,
} from '@perses-ui/core';
import { useMemo } from 'react';
import { CalculationsMap, CalculationType } from './calculations';
import { formatValue, UnitOptions } from './units';

export const StatChartKind = 'StatChart' as const;

type StatChartKind = typeof StatChartKind;

export type StatChartPanelProps = PanelProps<StatChartKind, StatChartOptions>;

interface StatChartOptions extends JsonObject {
  query: AnyChartQueryDefinition;
  calculation: CalculationType;
  unit?: UnitOptions;
}

export function StatChartPanel(props: StatChartPanelProps) {
  const {
    definition: {
      options: { query, calculation, unit },
    },
  } = props;
  const { data, loading, error } = useChartQuery(query);

  const displayValue = useMemo(() => {
    // TODO: Some better way to configure what is the "value" column?
    const valueColumn = data?.[0]?.columns.find(isNumberColumn);
    if (valueColumn === undefined) return 'No data';

    const calculate = CalculationsMap[calculation];
    const value = calculate(valueColumn.values);
    if (value === undefined) return 'No data';

    return formatValue(value, unit);
  }, [data, calculation, unit]);

  if (error) throw error;
  if (loading) return <div>Loading...</div>;

  return <div>{displayValue}</div>;
}

function isNumberColumn(column: Series): column is Series<'Number'> {
  return column.seriesType === 'Number';
}
