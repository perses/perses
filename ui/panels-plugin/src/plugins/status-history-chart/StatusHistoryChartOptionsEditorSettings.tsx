// Copyright 2024 The Perses Authors
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

import { LegendOptionsEditor, LegendOptionsEditorProps } from '@perses-dev/plugin-system';
import { produce } from 'immer';
import { OptionsEditorGroup, OptionsEditorGrid, OptionsEditorColumn } from '@perses-dev/components';
import { Button } from '@mui/material';
import { ReactElement } from 'react';
import { StatusHistoryChartOptions, StatusHistroyChartEditorProps } from './status-history-model.js';

export function StatusHistoryChartOptionsEditorSettings(props: StatusHistroyChartEditorProps): ReactElement {
  const { onChange, value } = props;

  const handleLegendChange: LegendOptionsEditorProps['onChange'] = (newLegend) => {
    // TODO (sjcobb): fix type, add position, fix glitch
    onChange(
      produce(value, (draft: StatusHistoryChartOptions) => {
        draft.legend = newLegend;
      })
    );
  };

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <LegendOptionsEditor showValuesEditor={false} value={value.legend} onChange={handleLegendChange} />
      </OptionsEditorColumn>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Reset Settings">
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              onChange(
                produce(value, (draft: StatusHistoryChartOptions) => {
                  // reset button removes all optional panel options
                  draft.legend = undefined;
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
