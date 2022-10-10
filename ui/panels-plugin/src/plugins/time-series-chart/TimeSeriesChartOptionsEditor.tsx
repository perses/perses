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

import produce from 'immer';
import { Stack, Box, Typography, FormControl, InputLabel } from '@mui/material';
import { UnknownSpec } from '@perses-dev/core';
import {
  PluginKindSelect,
  PluginSpecEditor,
  OptionsEditorProps,
  PluginKindSelectProps,
} from '@perses-dev/plugin-system';
import { TimeSeriesChartOptions } from './time-series-chart-model';

export type TimeSeriesChartOptionsEditorProps = OptionsEditorProps<TimeSeriesChartOptions>;

export function TimeSeriesChartOptionsEditor(props: TimeSeriesChartOptionsEditorProps) {
  const { onChange, value } = props;
  const { queries } = value;

  const handleQueryPluginKindChange: PluginKindSelectProps['onChange'] = () => {
    // TODO: Need to make "remember state" stuff reusable?
  };

  const handleQueryPluginSpecChange = (index: number, pluginSpec: UnknownSpec) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        const timeSeriesQuery = draft.queries[index];
        if (timeSeriesQuery) {
          timeSeriesQuery.spec.plugin.spec = pluginSpec;
        }
      })
    );
  };

  return (
    <Stack spacing={1}>
      {/* TODO: Deal with user deleting all queries */}
      {queries.map(({ spec: { plugin } }, i) => (
        <Box key={i}>
          <Typography variant="overline" component="h3">
            Query {i + 1}
          </Typography>
          <FormControl margin="dense" fullWidth={false}>
            <InputLabel id={`query-type-label-${i}`}>Query Type</InputLabel>
            <PluginKindSelect
              labelId={`query-type-label-${i}`}
              label="Query Type"
              pluginType="TimeSeriesQuery"
              value={plugin.kind}
              onChange={handleQueryPluginKindChange}
            />
          </FormControl>
          {plugin && (
            <PluginSpecEditor
              pluginType="TimeSeriesQuery"
              pluginKind={plugin.kind}
              value={plugin.spec}
              onChange={(next: UnknownSpec) => handleQueryPluginSpecChange(i, next)}
            />
          )}
        </Box>
      ))}
    </Stack>
  );
}
