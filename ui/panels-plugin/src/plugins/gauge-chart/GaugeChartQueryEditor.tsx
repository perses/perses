// Copyright 2023 The Perses Authors
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

import { TimeSeriesQueryDefinition, UnknownSpec } from '@perses-dev/core';
import { TimeSeriesQueryEditor, TimeSeriesQueryEditorProps } from '@perses-dev/plugin-system';
import { produce } from 'immer';
import { GaugeChartQueryEditorProps } from './gauge-chart-model';

/**
 * Component for visually editing a Gauge Chart's spec.
 */
export function GaugeChartQueryEditor(props: GaugeChartQueryEditorProps) {
  const { onChange, value, queries } = props;
  const query: TimeSeriesQueryDefinition<UnknownSpec> = queries[0] ?? {
    kind: 'TimeSeriesQuery',
    spec: {
      plugin: {
        kind: 'PrometheusTimeSeriesQuery',
        spec: {
          query: '',
        },
      },
    },
  };

  const handleQueryChange: TimeSeriesQueryEditorProps['onChange'] = (next) => {
    onChange(
      produce(value, (draft) => {
        draft.query = next;
      })
    );
  };

  return <TimeSeriesQueryEditor value={query} onChange={handleQueryChange} />;
}
