// Copyright 2022 The Perses Authors
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

import { PanelProps, useTimeSeriesQueries } from '@perses-dev/plugin-system';
import { useSuggestedStepMs } from '../../model/time';
import { TimeSeriesChartOptions } from './time-series-chart-model';
import { TimeSeriesChartContainer } from './TimeSeriesChartContainer';

export type TimeSeriesChartProps = PanelProps<TimeSeriesChartOptions>;

export function TimeSeriesChartPanel(props: TimeSeriesChartProps) {
  const {
    spec: { queries, show_legend, thresholds, unit },
    contentDimensions,
  } = props;

  const suggestedStepMs = useSuggestedStepMs(contentDimensions?.width);
  const queryResults = useTimeSeriesQueries(queries, { suggestedStepMs });

  if (contentDimensions === undefined) {
    return null;
  }

  // TODO: Do we need this container component any more now that we can run multiple queries here?
  return (
    <TimeSeriesChartContainer
      width={contentDimensions.width}
      height={contentDimensions.height}
      unit={unit}
      show_legend={show_legend}
      thresholds={thresholds}
      queryResults={queryResults}
    />
  );
}
