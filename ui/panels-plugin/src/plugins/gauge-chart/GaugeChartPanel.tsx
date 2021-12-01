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

import { AnyGraphQueryDefinition, JsonObject, PanelProps, usePanelState } from '@perses-ui/core';
import { UnitOptions } from '../../model/units';
import { CalculationType } from '../../model/calculations';
import { ThresholdOptions } from './thresholds';
import GaugeChart from './GaugeChart';

export const GaugeChartKind = 'GaugeChart' as const;

export type GaugeChartPanelProps = PanelProps<typeof GaugeChartKind, GaugeChartOptions>;

interface GaugeChartOptions extends JsonObject {
  query: AnyGraphQueryDefinition;
  calculation: CalculationType;
  unit: UnitOptions;
  thresholds?: ThresholdOptions;
}

export function GaugeChartPanel(props: GaugeChartPanelProps) {
  const {
    definition: {
      options: { query, calculation, unit, thresholds },
    },
  } = props;
  const { contentDimensions } = usePanelState();
  return (
    <>
      {contentDimensions !== undefined && (
        <GaugeChart
          width={contentDimensions.width}
          height={contentDimensions.height}
          query={query}
          calculation={calculation}
          unit={unit}
          thresholds={thresholds}
        />
      )}
    </>
  );
}
