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
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  StackProps,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import { DEFAULT_PROM } from '@perses-dev/prometheus-plugin';
import React, { MouseEvent, useMemo, useState } from 'react';
import ArrowLeftIcon from 'mdi-material-ui/ArrowLeft';
import CogIcon from 'mdi-material-ui/Cog';
import { Link as RouterLink } from 'react-router-dom';
import { Fuzzy, FuzzyMatchingInterval } from '@nexucis/fuzzy';
import Magnify from 'mdi-material-ui/Magnify';
import { useExplorerQueryParams } from '../ExploreManager/query-params';
import { LabelFilter, Settings } from './types';
import { FinderFilters } from './filter/FinderFilters';
import { MetricList } from './display/list/MetricList';
import { MetricOverview } from './overview/MetricOverview';
import { useLabelValues } from './utils';

const PERSES_METRICS_FINDER_SETTINGS = 'PERSES_METRICS_FINDER_SETTINGS';

export interface SettingsMenuProps {
  value: Settings;
  onChange: (value: Settings) => void;
}

export function SettingsMenu({ value, onChange }: SettingsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
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
        <MenuItem onClick={(e) => e.preventDefault()}>
          <FormControlLabel
            control={<Checkbox />}
            label="Enable Metadata"
            checked={value.isMetadataEnabled}
            onClick={() => onChange({ ...value, isMetadataEnabled: !value.isMetadataEnabled })}
          />
        </MenuItem>
        <MenuItem onClick={(e) => e.preventDefault()}>
          <FormControlLabel
            control={<Checkbox />}
            label="Enable Time Series Chart"
            checked={value.isPanelEnabled}
            onClick={() => onChange({ ...value, isPanelEnabled: !value.isPanelEnabled })}
          />
        </MenuItem>
      </Menu>
    </>
  );
}

export interface MetricNameExplorerProps extends StackProps {
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  isMetadataEnabled?: boolean;
  onExplore?: (metricName: string) => void;
}

export function MetricNameExplorer({
  datasource,
  filters,
  isMetadataEnabled,
  onExplore,
  ...props
}: MetricNameExplorerProps) {
  const { data, isLoading } = useLabelValues('__name__', filters, datasource);
  const [search, setSearch] = useState('');
  const fuzzy = useMemo(() => new Fuzzy({ includeMatches: true, excludedChars: [' '] }), []);

  const filteredResults: Array<{ original: string; intervals?: FuzzyMatchingInterval[] }> | undefined = useMemo(() => {
    if (search && data?.data) {
      return fuzzy.filter(search, data.data).sort((a, b) => b.score - a.score);
    }
    return undefined;
  }, [data, fuzzy, search]);

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack {...props}>
      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search metric name..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Magnify />
            </InputAdornment>
          ),
        }}
      />
      <MetricList
        metricNames={data?.data ?? []}
        filteredResults={filteredResults}
        datasource={datasource}
        filters={filters}
        isMetadataEnabled={isMetadataEnabled}
        onExplore={onExplore}
      />
    </Stack>
  );
}

export interface PrometheusMetricsFinderProps extends Omit<StackProps, 'onChange'> {
  value: {
    datasource: DatasourceSelector;
    filters: LabelFilter[];
    exploredMetric?: string;
  };
  onChange: ({
    datasource,
    filters,
    exploredMetric,
  }: {
    datasource: DatasourceSelector;
    filters: LabelFilter[];
    exploredMetric?: string;
  }) => void;
  onExplore?: (metricName: string) => void;
}

export function PrometheusMetricsFinder({
  value: { datasource = DEFAULT_PROM, filters = [], exploredMetric },
  onChange,
  onExplore,
  ...props
}: PrometheusMetricsFinderProps) {
  const settingsStored = localStorage.getItem(PERSES_METRICS_FINDER_SETTINGS);
  const [settings, setSettings] = useState<Settings>(
    settingsStored ? JSON.parse(settingsStored) : { isMetadataEnabled: true }
  );

  function handleSettingsUpdate(value: Settings) {
    setSettings(value);
    localStorage.setItem(PERSES_METRICS_FINDER_SETTINGS, JSON.stringify(value));
  }

  const isMobileSize = useMediaQuery(useTheme().breakpoints.down('md'));

  // Remove duplicated filters and filters without label or labelValues
  const filteredFilters: LabelFilter[] = useMemo(() => {
    return filters.filter((filter) => filter.label && filter.labelValues.length > 0);
  }, [filters]);

  const searchParams = useExplorerQueryParams({
    data: { tab: 'finder', datasource, filters, exploredMetric: undefined },
  });

  function setDatasource(value: DatasourceSelector) {
    onChange({ datasource: value, filters, exploredMetric });
  }

  function setFilters(value: LabelFilter[]) {
    onChange({ datasource, filters: value, exploredMetric });
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
          {exploredMetric && (
            <Button
              variant="contained"
              aria-label="back to metric explorer"
              startIcon={<ArrowLeftIcon />}
              component={RouterLink}
              to={`?${searchParams}`}
            >
              Back
            </Button>
          )}
          <Stack
            direction="row"
            sx={{ width: isMobileSize ? '100%' : 'unset' }}
            justifyContent={isMobileSize ? 'end' : 'unset'}
            alignItems="center"
          >
            <SettingsMenu value={settings} onChange={handleSettingsUpdate} />
          </Stack>
        </Stack>
      </Stack>
      {exploredMetric ? (
        <MetricOverview
          metricName={exploredMetric}
          datasource={datasource ?? DEFAULT_PROM}
          filters={filteredFilters}
          isMetadataEnabled={settings.isMetadataEnabled}
          isPanelEnabled={settings.isPanelEnabled}
          onFiltersChange={setFilters}
          onExplore={onExplore}
        />
      ) : (
        <MetricNameExplorer
          datasource={datasource ?? DEFAULT_PROM}
          filters={filteredFilters}
          isMetadataEnabled={settings.isMetadataEnabled}
          onExplore={onExplore}
        />
      )}
    </Stack>
  );
}
