// Copyright 2021 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
