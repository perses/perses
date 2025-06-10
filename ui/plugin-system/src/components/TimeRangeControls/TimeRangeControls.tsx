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
// eslint-disable-next-line import/no-duplicates
import ZoomIn from 'mdi-material-ui/PlusCircleOutline';
// eslint-disable-next-line import/no-duplicates
import ZoomOut from 'mdi-material-ui/MinusCircleOutline';
import { Stack } from '@mui/material';
import {
  RefreshIntervalPicker,
  InfoTooltip,
  TimeOption,
  ToolbarIconButton,
  TimeRangeSelector,
  buildRelativeTimeOption,
} from '@perses-dev/components';
import { AbsoluteTimeRange, DurationString, parseDurationString, RelativeTimeRange } from '@perses-dev/core';
import { ReactElement, useCallback } from 'react';
import { TOOLTIP_TEXT } from '../../constants';
import {
  useTimeRange,
  useShowCustomTimeRangeSetting,
  useTimeRangeOptionsSetting,
  useShowZoomRangeSetting,
} from '../../runtime';

// LOGZ.IO CHANGE START:: Change refresh time interval options [APPZ-364]
export const DEFAULT_REFRESH_INTERVAL_OPTIONS: TimeOption[] = [
  { value: { pastDuration: '0s' }, display: 'Off' },
  { value: { pastDuration: '30s' }, display: '30s' },
  { value: { pastDuration: '1m' }, display: '1m' },
  { value: { pastDuration: '5m' }, display: '5m' },
  { value: { pastDuration: '15m' }, display: '15m' },
  { value: { pastDuration: '30m' }, display: '30m' },
  { value: { pastDuration: '1h' }, display: '1h' },
  { value: { pastDuration: '2h' }, display: '2h' },
  { value: { pastDuration: '1d' }, display: '1d' },
];
// LOGZ.IO CHANGE END:: Change refresh time interval options [APPZ-364]

const DEFAULT_HEIGHT = '34px';

interface TimeRangeControlsProps {
  // The controls look best at heights >= 28 pixels
  heightPx?: number;
  showTimeRangeSelector?: boolean;
  showRefreshButton?: boolean;
  showRefreshInterval?: boolean;
  showCustomTimeRange?: boolean;
  showZoomButtons?: boolean;
  timePresets?: TimeOption[];
}

export function TimeRangeControls({
  heightPx,
  showTimeRangeSelector = true,
  showRefreshButton = true,
  showRefreshInterval = true,
  showCustomTimeRange,
  showZoomButtons = true,
  timePresets,
}: TimeRangeControlsProps): ReactElement {
  const { timeRange, setTimeRange, refresh, refreshInterval, setRefreshInterval } = useTimeRange();

  const showCustomTimeRangeValue = useShowCustomTimeRangeSetting(showCustomTimeRange);
  const showZoomInOutButtons = useShowZoomRangeSetting(showZoomButtons);
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

  const fromDurationToMillis = (strDuration: string): number => {
    const duration = parseDurationString(strDuration);
    const millis =
      // eslint-disable-next-line prettier/prettier
        ((duration.seconds ?? 0) +
        (duration.minutes ?? 0) * 60 +
        (duration.hours ?? 0) * 3600 +
        (duration.days ?? 0) * 86400 +
        (duration.weeks ?? 0) * 7 * 86400 +
        (duration.months ?? 0) * 30.436875 * 86400 + // avg month duration is ok for zoom purposes
        (duration.years ?? 0) * 365.2425 * 86400) * // avg year duration is ok for zoom purposes
      // eslint-disable-next-line prettier/prettier
        1000; // to milliseconds
    return millis;
  };

  // Function to double current time range, adding 50% before current start and 50% after current end
  const doubleTimeRange = (): AbsoluteTimeRange => {
    let newStart, newEnd, extendEndsBy;
    const now = new Date();
    if (Object.hasOwn(timeRange, 'start')) {
      // current range is absolute
      const absVal = timeRange as AbsoluteTimeRange;
      extendEndsBy = (absVal.end.getTime() - absVal.start.getTime()) / 2; // half it to add 50% before current start and after current end
      newStart = new Date(absVal.start.getTime() - extendEndsBy);
      newEnd = new Date(absVal.end.getTime() + extendEndsBy);
    } else {
      // current range is relative
      const relVal = timeRange as RelativeTimeRange;
      extendEndsBy = fromDurationToMillis(relVal.pastDuration) / 2;
      newEnd = typeof relVal.end === 'undefined' ? now : new Date(relVal.end.getTime() + extendEndsBy);
      newStart = new Date(newEnd.getTime() - extendEndsBy * 4);
    }
    if (newEnd.getTime() > now.getTime()) {
      // if the new computed end is in the future
      newEnd = now;
      newStart.setTime(now.getTime() - extendEndsBy * 4);
    }
    if (newStart.getTime() < 1) {
      newStart.setTime(1);
    }
    return { start: newStart, end: newEnd };
  };

  // Function to half current time range, cutting 25% before current start and 25% after current end
  const halfTimeRange = (): AbsoluteTimeRange => {
    let newStart, newEnd;
    if (Object.hasOwn(timeRange, 'start')) {
      const absVal = timeRange as AbsoluteTimeRange;
      const shrinkEndsBy = (absVal.end.getTime() - absVal.start.getTime()) / 4;
      newStart = new Date(absVal.start.getTime() + shrinkEndsBy);
      newEnd = new Date(absVal.end.getTime() - shrinkEndsBy);
    } else {
      const relVal = timeRange as RelativeTimeRange;
      const shrinkEndsBy = fromDurationToMillis(relVal.pastDuration) / 4; // 25% of it to cut after current start and before current end
      const endIsAbsolute = typeof relVal.end !== 'undefined';
      newEnd = endIsAbsolute ? new Date(relVal.end!.getTime() - shrinkEndsBy) : new Date();
      newStart = new Date(newEnd.getTime() - shrinkEndsBy * 2);
    }
    if (newStart.getTime() >= newEnd.getTime() - 1000) {
      newStart.setTime(newEnd.getTime() - 1000);
    }
    return { start: newStart, end: newEnd };
  };

  const setHalfTimeRange = (): void => setTimeRange(halfTimeRange());
  const setDoubleTimeRange = (): void => setTimeRange(doubleTimeRange());

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
      {showZoomInOutButtons && (
        <InfoTooltip description={TOOLTIP_TEXT.zoomOut}>
          <ToolbarIconButton aria-label={TOOLTIP_TEXT.zoomOut} onClick={setDoubleTimeRange} sx={{ height }}>
            <ZoomOut />
          </ToolbarIconButton>
        </InfoTooltip>
      )}
      {showZoomInOutButtons && (
        <InfoTooltip description={TOOLTIP_TEXT.zoomIn}>
          <ToolbarIconButton aria-label={TOOLTIP_TEXT.zoomIn} onClick={setHalfTimeRange} sx={{ height }}>
            <ZoomIn />
          </ToolbarIconButton>
        </InfoTooltip>
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
