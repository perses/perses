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

import { JsonObject } from '@perses-dev/core';
import { GraphQueryDefinition, PanelProps } from '@perses-dev/plugin-system';
import { useSuggestedStepMs } from '../../model/time';
import GraphQueryRunner from './GraphQueryRunner';
import { LineChartContainer } from './LineChartContainer';

export const LineChartKind = 'LineChart' as const;

export type LineChartProps = PanelProps<LineChartOptions>;

interface LineChartOptions extends JsonObject {
  queries: GraphQueryDefinition[];
  show_legend?: boolean;
}

export function LineChartPanel(props: LineChartProps) {
  const {
    definition: {
      options: { queries, show_legend },
    },
    contentDimensions,
  } = props;

  const suggestedStepMs = useSuggestedStepMs(contentDimensions?.width);

  return (
    <GraphQueryRunner queries={queries} suggestedStepMs={suggestedStepMs}>
      {contentDimensions !== undefined && (
        <LineChartContainer
          width={contentDimensions.width}
          height={contentDimensions.height}
          show_legend={show_legend}
        />
      )}
    </GraphQueryRunner>
  );
}
