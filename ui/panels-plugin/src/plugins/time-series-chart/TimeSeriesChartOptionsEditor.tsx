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
  SelectProps,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import AddIcon from 'mdi-material-ui/Plus';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { TimeSeriesQueryDefinition } from '@perses-dev/core';
import { OptionsEditorProps, TimeSeriesQueryEditor, usePlugin } from '@perses-dev/plugin-system';
import { TimeSeriesChartOptions, DEFAULT_LEGEND, LEGEND_POSITIONS, LegendPosition } from './time-series-chart-model';

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

  // Query handlers
  const handleQueryChange = (index: number, queryDef: TimeSeriesQueryDefinition) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.queries[index] = queryDef;
      })
    );
  };

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

  // Legend options handlers
  const handleLegendShowChange = (show: boolean) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.legend = show ? DEFAULT_LEGEND : undefined;
      })
    );
  };

  const handleLegendPositionChange: SelectProps<LegendPosition>['onChange'] = (e) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        // TODO: type cast should not be necessary
        if (draft.legend) {
          draft.legend.position = e.target.value as LegendPosition;
        }
      })
    );
  };

  return (
    <Stack spacing={2}>
      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginLeft: 'auto' }} onClick={handleQueryAdd}>
        Add Query
      </Button>
      {queries.map((query: TimeSeriesQueryDefinition, i: number) => (
        <Stack key={i} spacing={1}>
          <Stack direction="row" alignItems="center" borderBottom={1} borderColor="grey.300">
            <Typography variant="overline" component="h4">
              Query {i + 1}
            </Typography>
            <IconButton
              size="small"
              // Use `visibility` to ensure that the row has the same height when delete button is visible or not visible
              sx={{ marginLeft: 'auto', visibility: `${hasMoreThanOneQuery ? 'visible' : 'hidden'}` }}
              onClick={() => handleQueryDelete(i)}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
          <TimeSeriesQueryEditor value={query} onChange={(next) => handleQueryChange(i, next)} />
        </Stack>
      ))}
      <Stack spacing={1}>
        <Typography variant="overline" component="h4">
          Legend
        </Typography>
        <FormControlLabel
          label="Show"
          control={
            <Switch
              checked={value.legend !== undefined}
              onChange={(e) => {
                handleLegendShowChange(e.target.checked);
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
            value={value.legend && value.legend.position ? value.legend.position : DEFAULT_LEGEND.position}
            onChange={handleLegendPositionChange}
          >
            {LEGEND_POSITIONS.map((position) => (
              <MenuItem key={position} value={position}>
                {position}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  );
}
