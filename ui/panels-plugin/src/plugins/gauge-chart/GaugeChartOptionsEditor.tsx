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

import { OptionsEditorProps, TimeSeriesQueryEditor, TimeSeriesQueryEditorProps } from '@perses-dev/plugin-system';
import { produce } from 'immer';
import { GaugeChartOptions } from './gauge-chart-model';

export type GaugeChartOptionsEditorProps = OptionsEditorProps<GaugeChartOptions>;

/**
 * Component for visually editing a Gauge Chart's spec.
 */
export function GaugeChartOptionsEditor(props: GaugeChartOptionsEditorProps) {
  const { onChange, value } = props;
  const { query } = value;

  const handleQueryChange: TimeSeriesQueryEditorProps['onChange'] = (next) => {
    onChange(
      produce(value, (draft) => {
        draft.query = next;
      })
    );
  };

  return <TimeSeriesQueryEditor value={query} onChange={handleQueryChange} />;
}
