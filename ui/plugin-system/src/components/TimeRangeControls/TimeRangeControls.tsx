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

import RefreshIcon from 'mdi-material-ui/Refresh';
import { Stack } from '@mui/material';
import {
  RefreshIntervalPicker,
  InfoTooltip,
  TimeOption,
  ToolbarIconButton,
  TimeRangeSelector,
  buildRelativeTimeOption,
} from '@perses-dev/components';
import { DurationString } from '@perses-dev/core';
import { ReactElement, useCallback } from 'react';
import { TOOLTIP_TEXT } from '../../constants';
import { useTimeRange, useShowCustomTimeRangeSetting, useTimeRangeOptionsSetting } from '../../runtime';

export const DEFAULT_REFRESH_INTERVAL_OPTIONS: TimeOption[] = [
  { value: { pastDuration: '0s' }, display: 'Off' },
  { value: { pastDuration: '5s' }, display: '5s' },
  { value: { pastDuration: '10s' }, display: '10s' },
  { value: { pastDuration: '15s' }, display: '15s' },
  { value: { pastDuration: '30s' }, display: '30s' },
  { value: { pastDuration: '60s' }, display: '1m' },
];

const DEFAULT_HEIGHT = '34px';

interface TimeRangeControlsProps {
  // The controls look best at heights >= 28 pixels
  heightPx?: number;
  showTimeRangeSelector?: boolean;
  showRefreshButton?: boolean;
  showRefreshInterval?: boolean;
  showCustomTimeRange?: boolean;
  timePresets?: TimeOption[];
}

export function TimeRangeControls({
  heightPx,
  showTimeRangeSelector = true,
  showRefreshButton = true,
  showRefreshInterval = true,
  showCustomTimeRange,
  timePresets,
}: TimeRangeControlsProps): ReactElement {
  const { timeRange, setTimeRange, refresh, refreshInterval, setRefreshInterval } = useTimeRange();

  const showCustomTimeRangeValue = useShowCustomTimeRangeSetting(showCustomTimeRange);
  const timePresetsValue = useTimeRangeOptionsSetting(timePresets);

  // Convert height to a string, then use the string for styling
  const height = heightPx === undefined ? DEFAULT_HEIGHT : `${heightPx}px`;

  // add time preset if one does not match duration given in time range
  if (
    'pastDuration' in timeRange &&
    !timePresetsValue.some((option) => option.value.pastDuration === timeRange['pastDuration'])
  ) {
    timePresetsValue.push(buildRelativeTimeOption(timeRange['pastDuration']));
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
        <TimeRangeSelector
          timeOptions={timePresetsValue}
          value={timeRange}
          onChange={setTimeRange}
          height={height}
          showCustomTimeRange={showCustomTimeRangeValue}
        />
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
