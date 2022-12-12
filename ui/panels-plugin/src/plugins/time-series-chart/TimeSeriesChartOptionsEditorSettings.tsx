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

import { Button } from '@mui/material';
import { produce } from 'immer';
import {
  LegendOptionsEditor,
  LegendOptionsEditorProps,
  OptionsEditorGroup,
  OptionsEditorGrid,
  OptionsEditorColumn,
} from '@perses-dev/components';
import { TimeSeriesChartOptionsEditorProps } from './TimeSeriesChartOptionsEditor';
import { TimeSeriesChartOptions, DEFAULT_VISUAL, DEFAULT_Y_AXIS } from './time-series-chart-model';
import { VisualOptionsEditor, VisualOptionsEditorProps } from './VisualOptionsEditor';
import { YAxisOptionsEditor, YAxisOptionsEditorProps } from './YAxisOptionsEditor';

export function TimeSeriesChartOptionsEditorSettings(props: TimeSeriesChartOptionsEditorProps) {
  const { onChange, value } = props;

  const handleLegendChange: LegendOptionsEditorProps['onChange'] = (newLegend) => {
    // TODO (sjcobb): fix type, add position, fix glitch
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.legend = newLegend;
      })
    );
  };

  const handleVisualChange: VisualOptionsEditorProps['onChange'] = (newVisual) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.visual = newVisual;
      })
    );
  };

  const handleYAxisChange: YAxisOptionsEditorProps['onChange'] = (newYAxis) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.y_axis = newYAxis;
      })
    );
  };

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Legend">
          <LegendOptionsEditor value={value.legend} onChange={handleLegendChange} />
        </OptionsEditorGroup>
        <VisualOptionsEditor value={value.visual ?? DEFAULT_VISUAL} onChange={handleVisualChange} />
      </OptionsEditorColumn>
      <OptionsEditorColumn>
        <YAxisOptionsEditor value={value.y_axis ?? DEFAULT_Y_AXIS} onChange={handleYAxisChange} />
      </OptionsEditorColumn>
      <OptionsEditorColumn>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => {
            onChange(
              produce(value, (draft: TimeSeriesChartOptions) => {
                // reset button removes all optional panel options
                draft.y_axis = undefined;
                draft.legend = undefined;
                draft.visual = undefined;
              })
            );
          }}
        >
          Reset to Default
        </Button>
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
