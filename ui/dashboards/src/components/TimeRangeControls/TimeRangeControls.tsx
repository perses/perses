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

import RefreshIcon from 'mdi-material-ui/Refresh';
import { Stack } from '@mui/material';
import { DateTimeRangePicker, RefreshIntervalPicker, InfoTooltip, TimeOption } from '@perses-dev/components';
import { useTimeRange } from '@perses-dev/plugin-system';
import { DurationString } from '@perses-dev/core';
import { useCallback } from 'react';
import { ToolbarIconButton } from '../ToolbarIconButton';

export const DEFAULT_TIME_RANGE_OPTIONS: TimeOption[] = [
  { value: { pastDuration: '5m' }, display: 'Last 5 minutes' },
  { value: { pastDuration: '15m' }, display: 'Last 15 minutes' },
  { value: { pastDuration: '30m' }, display: 'Last 30 minutes' },
  { value: { pastDuration: '1h' }, display: 'Last 1 hour' },
  { value: { pastDuration: '6h' }, display: 'Last 6 hours' },
  { value: { pastDuration: '12h' }, display: 'Last 12 hours' },
  { value: { pastDuration: '24h' }, display: 'Last 1 day' },
  { value: { pastDuration: '7d' }, display: 'Last 7 days' },
  { value: { pastDuration: '14d' }, display: 'Last 14 days' },
];

export const DEFAULT_REFRESH_INTERVAL_OPTIONS: TimeOption[] = [
  { value: { pastDuration: '0s' }, display: 'Off' },
  { value: { pastDuration: '5s' }, display: '5s' },
  { value: { pastDuration: '10s' }, display: '10s' },
  { value: { pastDuration: '15s' }, display: '15s' },
  { value: { pastDuration: '30s' }, display: '30s' },
  { value: { pastDuration: '60s' }, display: '1m' },
];

export const TOOLTIP_TEXT = {
  refresh: 'Refresh',
  refreshInterval: 'Auto refresh interval',
};

const DEFAULT_HEIGHT = '34px';

interface TimeRangeControlsProps {
  // The controls look best at heights >= 28 pixels
  heightPx?: number;
  showTimeRangeSelector?: boolean;
  showRefreshButton?: boolean;
  showRefreshInterval?: boolean;
  timePresets?: TimeOption[];
}

export function TimeRangeControls({
  heightPx,
  showTimeRangeSelector = true,
  showRefreshButton = true,
  showRefreshInterval = true,
  timePresets = DEFAULT_TIME_RANGE_OPTIONS,
}: TimeRangeControlsProps) {
  const { timeRange, setTimeRange, refresh, refreshInterval, setRefreshInterval } = useTimeRange();

  // Convert height to a string, then use the string for styling
  const height = heightPx === undefined ? DEFAULT_HEIGHT : `${heightPx}px`;

  // add time preset if one does not match duration given in time range
  if (
    'pastDuration' in timeRange &&
    !timePresets.some((option) => option.value.pastDuration === timeRange['pastDuration'])
  ) {
    timePresets.push({
      value: { pastDuration: timeRange['pastDuration'] },
      display: `Last ${timeRange['pastDuration']}`,
    });
  }

  // set the new refresh interval both in the dashboard context & as query param
  const handleRefreshIntervalChange = useCallback(
    (duration: DurationString) => {
      setRefreshInterval(duration);
    },
    [setRefreshInterval]
  );

  return (
    <Stack direction="row" spacing={1}>
      {showTimeRangeSelector && (
        <DateTimeRangePicker timeOptions={timePresets} value={timeRange} onChange={setTimeRange} height={height} />
      )}
      {showRefreshButton && (
        <InfoTooltip description={TOOLTIP_TEXT.refresh}>
          <ToolbarIconButton aria-label={TOOLTIP_TEXT.refresh} onClick={refresh} sx={{ height }}>
            <RefreshIcon />
          </ToolbarIconButton>
        </InfoTooltip>
      )}
      {showRefreshInterval && (
        <InfoTooltip description={TOOLTIP_TEXT.refreshInterval}>
          <RefreshIntervalPicker
            timeOptions={DEFAULT_REFRESH_INTERVAL_OPTIONS}
            value={refreshInterval}
            onChange={handleRefreshIntervalChange}
            height={height}
          />
        </InfoTooltip>
      )}
    </Stack>
  );
}
