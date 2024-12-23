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

import { Button } from '@mui/material';
import { produce } from 'immer';
import {
  OptionsEditorGroup,
  OptionsEditorGrid,
  OptionsEditorColumn,
  ThresholdsEditor,
  ThresholdsEditorProps,
} from '@perses-dev/components';
import { LegendOptionsEditor, LegendOptionsEditorProps } from '@perses-dev/plugin-system';
import { ReactElement } from 'react';
import {
  TimeSeriesChartOptions,
  DEFAULT_VISUAL,
  DEFAULT_Y_AXIS,
  TimeSeriesChartOptionsEditorProps,
} from './time-series-chart-model';
import { VisualOptionsEditor, VisualOptionsEditorProps } from './VisualOptionsEditor';
import { YAxisOptionsEditor, YAxisOptionsEditorProps } from './YAxisOptionsEditor';
import { QuerySettingsEditor, QuerySettingsEditorProps } from './QuerySettingsEditor';

export function TimeSeriesChartOptionsEditorSettings(props: TimeSeriesChartOptionsEditorProps): ReactElement {
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
        draft.yAxis = newYAxis;
      })
    );
  };

  const handleQuerySettingsChange: QuerySettingsEditorProps['onChange'] = (newQuerySettings) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.querySettings = newQuerySettings;
      })
    );
  };

  const handleThresholdsChange: ThresholdsEditorProps['onChange'] = (thresholds) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.thresholds = thresholds;
      })
    );
  };

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <LegendOptionsEditor value={value.legend} onChange={handleLegendChange} />
        <VisualOptionsEditor value={value.visual ?? DEFAULT_VISUAL} onChange={handleVisualChange} />
      </OptionsEditorColumn>
      <OptionsEditorColumn>
        <YAxisOptionsEditor value={value.yAxis ?? DEFAULT_Y_AXIS} onChange={handleYAxisChange} />
      </OptionsEditorColumn>
      <OptionsEditorColumn>
        <ThresholdsEditor hideDefault thresholds={value.thresholds} onChange={handleThresholdsChange} />
        <QuerySettingsEditor querySettingsList={value.querySettings} onChange={handleQuerySettingsChange} />
        <OptionsEditorGroup title="Reset Settings">
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              onChange(
                produce(value, (draft: TimeSeriesChartOptions) => {
                  // reset button removes all optional panel options
                  draft.yAxis = undefined;
                  draft.legend = undefined;
                  draft.visual = undefined;
                  draft.thresholds = undefined;
                  draft.querySettings = undefined;
                })
              );
            }}
          >
            Reset To Defaults
          </Button>
        </OptionsEditorGroup>
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
