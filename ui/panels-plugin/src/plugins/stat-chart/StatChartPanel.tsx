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
  AnyGraphQueryDefinition,
  PanelProps,
  useGraphQuery,
} from '@perses-ui/core';
import { useMemo } from 'react';
import { CalculationsMap, CalculationType } from '../../model/calculations';
import { formatValue, UnitOptions } from '../../model/units';

export const StatChartKind = 'StatChart' as const;

type StatChartKind = typeof StatChartKind;

export type StatChartPanelProps = PanelProps<StatChartKind, StatChartOptions>;

interface StatChartOptions extends JsonObject {
  query: AnyGraphQueryDefinition;
  calculation: CalculationType;
  unit?: UnitOptions;
}

export function StatChartPanel(props: StatChartPanelProps) {
  const {
    definition: {
      options: { query, calculation, unit },
    },
  } = props;
  const { data, loading, error } = useGraphQuery(query);

  const displayValue = useMemo(() => {
    if (data === undefined) return 'No data';

    // TODO: something smarter with iterable?
    const series = Array.from(data.series)[0];
    if (series === undefined) return 'No data';

    const calculate = CalculationsMap[calculation];
    const value = calculate(Array.from(series.values));
    if (value === undefined) return 'No data';

    return formatValue(value, unit);
  }, [data, calculation, unit]);

  if (error) throw error;
  if (loading) return <div>Loading...</div>;

  return <div>{displayValue}</div>;
}
