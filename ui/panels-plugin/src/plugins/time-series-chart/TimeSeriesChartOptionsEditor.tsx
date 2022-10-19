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

import { produce } from 'immer';
import {
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import AddIcon from 'mdi-material-ui/Plus';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { TimeSeriesQueryDefinition } from '@perses-dev/core';
import { OptionsEditorProps, TimeSeriesQueryEditor, usePlugin } from '@perses-dev/plugin-system';
import {
  TimeSeriesChartOptions,
  DEFAULT_LEGEND,
  LEGEND_POSITIONS,
  LegendPositionOptions,
} from './time-series-chart-model';

const DEFAULT_QUERY_PLUGIN_TYPE = 'TimeSeriesQuery';
const DEFAULT_QUERY_PLUGIN_KIND = 'PrometheusTimeSeriesQuery';

export type TimeSeriesChartOptionsEditorProps = OptionsEditorProps<TimeSeriesChartOptions>;

export function TimeSeriesChartOptionsEditor(props: TimeSeriesChartOptionsEditorProps) {
  const { onChange, value } = props;
  const { queries } = value;
  const hasMoreThanOneQuery = queries.length > 1;

  const { data: defaultQueryPlugin } = usePlugin(DEFAULT_QUERY_PLUGIN_TYPE, DEFAULT_QUERY_PLUGIN_KIND, {
    useErrorBoundary: true,
    enabled: true,
  });

  const handleQueryChange = (index: number, queryDef: TimeSeriesQueryDefinition) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.queries[index] = queryDef;
      })
    );
  };

  function updateLegendShow(show: boolean) {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.legend.show = show;
      })
    );
  }

  function updateLegendPosition(position: LegendPositionOptions['position']) {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.legend.position = position;
      })
    );
  }
  const handleQueryAdd = () => {
    if (!defaultQueryPlugin) return;
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.queries.push({
          kind: DEFAULT_QUERY_PLUGIN_TYPE,
          spec: {
            plugin: { kind: DEFAULT_QUERY_PLUGIN_KIND, spec: defaultQueryPlugin.createInitialOptions() },
          },
        });
      })
    );
  };

  const handleQueryDelete = (index: number) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.queries.splice(index, 1);
      })
    );
  };

  return (
    <Stack spacing={2}>
      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginLeft: 'auto' }} onClick={handleQueryAdd}>
        Add Query
      </Button>
      {queries.map((query, i) => (
        <Stack key={i}>
          <Stack direction="row">
            <Typography variant="overline" component="h3">
              Query {i + 1}
            </Typography>
            {hasMoreThanOneQuery && (
              <IconButton sx={{ marginLeft: 'auto' }} onClick={() => handleQueryDelete(i)}>
                <DeleteIcon />
              </IconButton>
            )}
          </Stack>
          <TimeSeriesQueryEditor value={query} onChange={(next) => handleQueryChange(i, next)} />
        </Stack>
      ))}
      <Stack spacing={1}>
        <Typography variant="overline" component="h3">
          Legend
        </Typography>
        <FormControlLabel
          label="Show"
          control={
            <Switch
              checked={value.legend.show ?? DEFAULT_LEGEND.show}
              onChange={(e) => {
                updateLegendShow(e.target.checked);
              }}
            />
          }
        />
        <FormControl>
          <InputLabel id="legend-position-select-label">Position</InputLabel>
          <Select
            sx={{ maxWidth: 100 }}
            labelId="legend-position-select-label"
            id="legend-position-select"
            label="Position"
            value={value.legend.position ?? DEFAULT_LEGEND.position}
            onChange={(e) => {
              updateLegendPosition(e.target.value as LegendPositionOptions['position']);
            }}
          >
            {LEGEND_POSITIONS.map((v) => (
              <MenuItem key={v} value={v}>
                {v}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  );
}
