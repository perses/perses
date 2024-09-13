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

import {
  Button,
  ButtonGroup,
  ButtonGroupProps,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  StackProps,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import { DEFAULT_PROM } from '@perses-dev/prometheus-plugin';
import { useMemo, useState } from 'react';
import * as React from 'react';
import ViewListIcon from 'mdi-material-ui/ViewList';
import GridIcon from 'mdi-material-ui/Grid';
import ArrowLeftIcon from 'mdi-material-ui/ArrowLeft';
import CogIcon from 'mdi-material-ui/Cog';
import { DisplayMode, LabelFilter } from './types';
import { FinderFilters } from './filter/FinderFilters';
import { MetricGrid } from './display/grid/MetricGrid';
import { MetricList } from './display/list/MetricList';
import { MetricOverview } from './overview/MetricOverview';
import { useLabelValues } from './utils';

export interface ToggleDisplayButtonsProps extends Omit<ButtonGroupProps, 'onChange'> {
  value: DisplayMode;
  onChange: (value: DisplayMode) => void;
}

export function ToggleDisplayButtons({ value, onChange, ...props }: ToggleDisplayButtonsProps) {
  return (
    <ButtonGroup variant="contained" aria-label="change current metric finder display" disableElevation {...props}>
      <Button
        variant={value === 'grid' ? 'contained' : 'outlined'}
        startIcon={<GridIcon />}
        onClick={() => onChange('grid')}
      >
        Grid
      </Button>
      <Button
        variant={value === 'list' ? 'contained' : 'outlined'}
        startIcon={<ViewListIcon />}
        onClick={() => onChange('list')}
      >
        List
      </Button>
    </ButtonGroup>
  );
}

export interface SettingsMenuProps {
  value: { isMetadataEnabled: boolean; isPanelEnabled: boolean };
  onChange: (value: { isMetadataEnabled: boolean; isPanelEnabled: boolean }) => void;
}

export function SettingsMenu({ value, onChange }: SettingsMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton aria-label="settings" size="large" onClick={handleClick}>
        <CogIcon />
      </IconButton>
      <Menu id="finder-settings-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => onChange({ ...value, isMetadataEnabled: !value.isMetadataEnabled })}>
          <FormControlLabel control={<Checkbox />} label="Enable Metadata" checked={value.isMetadataEnabled} />
        </MenuItem>
        <MenuItem onClick={() => onChange({ ...value, isPanelEnabled: !value.isPanelEnabled })}>
          <FormControlLabel control={<Checkbox />} label="Enable Panels" checked={value.isPanelEnabled} />
        </MenuItem>
      </Menu>
    </>
  );
}

export interface MetricNameExplorerProps extends StackProps {
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  display: DisplayMode;
  isMetadataEnabled?: boolean;
  isPanelEnabled?: boolean;
  onExplore: (metricName: string) => void;
}

export function MetricNameExplorer({
  datasource,
  filters,
  display,
  isMetadataEnabled,
  isPanelEnabled,
  onExplore,
  ...props
}: MetricNameExplorerProps) {
  const { data, isLoading } = useLabelValues('__name__', filters, datasource);

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (display === 'list') {
    return (
      <MetricList
        metricNames={data?.data ?? []}
        datasource={datasource}
        filters={filters}
        isMetadataEnabled={isMetadataEnabled}
        onExplore={onExplore}
        {...props}
      />
    );
  }

  return (
    <MetricGrid
      metricNames={data?.data ?? []}
      datasource={datasource}
      filters={filters}
      isMetadataEnabled={isMetadataEnabled}
      isPanelEnabled={isPanelEnabled}
      onExplore={onExplore}
      {...props}
    />
  );
}

export interface PrometheusMetricsFinderProps extends Omit<StackProps, 'onChange'> {
  value: {
    display: DisplayMode;
    datasource: DatasourceSelector;
    filters: LabelFilter[];
    exploredMetric: string | undefined;
  };
  onChange: ({
    display,
    datasource,
    filters,
    exploredMetric,
  }: {
    display: DisplayMode;
    datasource: DatasourceSelector;
    filters: LabelFilter[];
    exploredMetric: string | undefined;
  }) => void;
}

export function PrometheusMetricsFinder({
  value: { display = 'list', datasource = DEFAULT_PROM, filters = [], exploredMetric },
  onChange,
  ...props
}: PrometheusMetricsFinderProps) {
  const [settings, setSettings] = useState({ isMetadataEnabled: true, isPanelEnabled: true }); // TODO: get default from config

  const isMobileSize = useMediaQuery(useTheme().breakpoints.down('md'));

  // Remove duplicated filters and filters without label or labelValues
  const filteredFilters: LabelFilter[] = useMemo(() => {
    const usableFilters: Map<string, Set<string>> = new Map();

    for (const filter of filters ?? []) {
      // Ignore filters without a label or labelValues
      if (!filter.label || filter.labelValues.length === 0) {
        continue;
      }

      // Remove duplicated labelValues
      let labelValues = usableFilters.get(filter.label);
      if (!labelValues) {
        labelValues = new Set<string>();
        usableFilters.set(filter.label, labelValues);
      }
      for (const labelValue of filter.labelValues) {
        labelValues.add(labelValue);
      }
    }

    // Format the result
    const result: LabelFilter[] = [];
    for (const [label, labelValues] of usableFilters.entries()) {
      result.push({ label, labelValues: Array.from(labelValues) });
    }

    return result;
  }, [filters]);

  function setDisplay(value: DisplayMode) {
    onChange({ display: value, datasource, filters, exploredMetric });
  }

  function setDatasource(value: DatasourceSelector) {
    onChange({ display, datasource: value, filters, exploredMetric });
  }

  function setFilters(value: LabelFilter[]) {
    onChange({ display, datasource, filters: value, exploredMetric });
  }

  function setExploredMetric(value: string | undefined) {
    onChange({ display, datasource, filters, exploredMetric: value });
  }

  return (
    <Stack {...props} gap={1}>
      <Stack direction={isMobileSize ? 'column' : 'row'} gap={2} justifyContent="space-between">
        <FinderFilters
          datasource={datasource ?? DEFAULT_PROM}
          filters={filters ?? []}
          filteredFilters={filteredFilters}
          onDatasourceChange={setDatasource}
          onFiltersChange={setFilters}
        />
        <Stack direction="row" gap={1} alignItems="center">
          {exploredMetric ? (
            <Button
              variant="contained"
              aria-label="back to metric explorer"
              startIcon={<ArrowLeftIcon />}
              onClick={() => setExploredMetric(undefined)}
            >
              Back
            </Button>
          ) : (
            <Stack
              direction="row"
              sx={{ width: isMobileSize ? '100%' : 'unset' }}
              justifyContent={isMobileSize ? 'center' : 'unset'}
              alignItems="center"
            >
              <ToggleDisplayButtons value={display ?? 'list'} onChange={setDisplay} sx={{ height: 32 }} />
              <SettingsMenu value={settings} onChange={setSettings} />
            </Stack>
          )}
        </Stack>
      </Stack>
      {exploredMetric ? (
        <MetricOverview
          metricName={exploredMetric}
          datasource={datasource ?? DEFAULT_PROM}
          filters={filteredFilters}
          onExplore={setExploredMetric}
          onFiltersChange={setFilters}
        />
      ) : (
        <MetricNameExplorer
          datasource={datasource ?? DEFAULT_PROM}
          filters={filteredFilters}
          display={display ?? 'list'}
          isMetadataEnabled={settings.isMetadataEnabled}
          isPanelEnabled={settings.isMetadataEnabled}
          onExplore={setExploredMetric}
        />
      )}
    </Stack>
  );
}

// TODO: settings button
// TODO: number of panel per row
// TODO: retrieve grid/list from query params
// TODO: theme colors
// TODO: responsive
// TODO: others tab
// TODO: tests
// TODO: put virtualized autocomplete in components
// TODO: improve url query params
