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

import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { Stack, Box } from '@mui/material';
import { TimeSeriesChartOptions } from './time-series-chart-model';
export type TimeSeriesChartOptionsEditorProps = OptionsEditorProps<TimeSeriesChartOptions>;

export function TimeSeriesChartOptionsEditor(props: TimeSeriesChartOptionsEditorProps) {
  const { value } = props;

  return (
    <Stack spacing={1}>
      <Box>{JSON.stringify(value)}</Box>
      {/* TODO: add form controls to edit panel options */}
    </Stack>
  );
}
