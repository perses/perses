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

import { useState } from 'react';
import { produce } from 'immer';
import {
  Button,
  Box,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectProps,
  Slider,
  SliderProps,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { JSONEditor } from '@perses-dev/components';
import AddIcon from 'mdi-material-ui/Plus';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import ChevronUp from 'mdi-material-ui/ChevronUp';
import { TimeSeriesQueryDefinition } from '@perses-dev/core';
import { UnitSelector, UnitSelectorProps } from '@perses-dev/components';
import { OptionsEditorProps, TimeSeriesQueryEditor, usePlugin, OptionsEditorTabs } from '@perses-dev/plugin-system';
import {
  TimeSeriesChartOptions,
  DEFAULT_LEGEND,
  DEFAULT_LINE_WIDTH,
  LEGEND_POSITIONS,
  LegendPosition,
  DEFAULT_UNIT,
  DEFAULT_POINT_RADIUS,
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

  // State for which queries are collapsed
  // TODO: Would be easier if we had IDs for queries.
  const [queriesCollapsed, setQueriesCollapsed] = useState(queries.map(() => false));

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
    setQueriesCollapsed((queriesCollapsed) => {
      queriesCollapsed.push(false);
      return [...queriesCollapsed];
    });
  };

  const handleQueryDelete = (index: number) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.queries.splice(index, 1);
      })
    );
    setQueriesCollapsed((queriesCollapsed) => {
      queriesCollapsed.splice(index, 1);
      return [...queriesCollapsed];
    });
  };

  const handleQueryCollapseExpand = (index: number) => {
    setQueriesCollapsed((queriesCollapsed) => {
      queriesCollapsed[index] = !queriesCollapsed[index];
      return [...queriesCollapsed];
    });
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

  const handleUnitChange: UnitSelectorProps['onChange'] = (newUnit) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.unit = newUnit;
      })
    );
  };

  // // const handleLineWidthChange: UnitSelectorProps['onChange'] = (newUnit) => {
  // //   onChange(
  // //     produce(value, (draft: TimeSeriesChartOptions) => {
  // //       draft.unit = newUnit;
  // //     })
  // //   );
  // // };
  // // const handleLineWidthChange = (lineWidth: number) => {
  // const handleLineWidthChange = (lineWidth: number) => {
  //   onChange(
  //     produce(value, (draft: TimeSeriesChartOptions) => {
  //       // draft.line_width = lineWidth ? DEFAULT_LINE_WIDTH : undefined;
  //       draft.line_width = lineWidth ?? DEFAULT_LINE_WIDTH;
  //     })
  //   );
  // };

  const handlePointRadiusChange: SliderProps['onChange'] = (e) => {
    const target = e.target as HTMLInputElement;
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.point_radius = Number(target.value) ?? DEFAULT_LINE_WIDTH;
      })
    );
  };

  const handleLineWidthChange: SliderProps['onChange'] = (e) => {
    const target = e.target as HTMLInputElement;
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.line_width = Number(target.value) ?? DEFAULT_LINE_WIDTH;
      })
    );
  };

  return (
    <OptionsEditorTabs
      tabs={{
        query: {
          content: (
            <Stack spacing={2}>
              <Button variant="contained" startIcon={<AddIcon />} sx={{ marginLeft: 'auto' }} onClick={handleQueryAdd}>
                Add Query
              </Button>
              {queries.map((query: TimeSeriesQueryDefinition, i: number) => (
                <Stack key={i} spacing={1}>
                  <Stack direction="row" alignItems="center" borderBottom={1} borderColor="grey.300">
                    <IconButton size="small" onClick={() => handleQueryCollapseExpand(i)}>
                      {queriesCollapsed[i] ? <ChevronUp /> : <ChevronDown />}
                    </IconButton>
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
                  {!queriesCollapsed[i] && (
                    <TimeSeriesQueryEditor value={query} onChange={(next) => handleQueryChange(i, next)} />
                  )}
                </Stack>
              ))}
            </Stack>
          ),
        },
        settings: {
          content: (
            <Grid container spacing={2}>
              <Grid item xs={6}>
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
                <Stack spacing={1} alignItems="flex-start">
                  <Typography variant="overline" component="h4">
                    Visual
                  </Typography>
                  <Typography variant="h5">Point Radius</Typography>
                  <Slider
                    aria-label="Point Radius"
                    defaultValue={DEFAULT_POINT_RADIUS}
                    valueLabelDisplay="auto"
                    step={0.5}
                    marks
                    min={0}
                    max={20}
                    onChange={handlePointRadiusChange}
                  />
                  <Typography variant="h5">Line Width</Typography>
                  <Slider
                    aria-label="Line Width"
                    defaultValue={DEFAULT_LINE_WIDTH}
                    valueLabelDisplay="auto"
                    step={0.5}
                    marks
                    min={0}
                    max={20}
                    onChange={handleLineWidthChange}
                  />
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack spacing={1} alignItems="flex-start">
                  <Typography variant="overline" component="h4">
                    Y Axis
                  </Typography>
                  <UnitSelector value={value.unit ?? DEFAULT_UNIT} onChange={handleUnitChange} />
                </Stack>
              </Grid>
            </Grid>
          ),
        },
        json: {
          content: <JSONEditor {...props} />,
        },
      }}
    />
  );
}
