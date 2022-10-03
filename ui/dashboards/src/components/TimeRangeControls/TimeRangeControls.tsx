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

import { useRef, useState, useEffect } from 'react';
import { Box, FormControl, Popover, Stack } from '@mui/material';
import { AbsoluteTimePicker, TimeRangeSelector, TimeOption } from '@perses-dev/components';
import {
  DurationString,
  RelativeTimeRange,
  AbsoluteTimeRange,
  TimeRangeValue,
  isRelativeTimeRange,
  toAbsoluteTimeRange,
  // getDefaultTimeRange,
} from '@perses-dev/core';
import { useTimeRange } from '@perses-dev/plugin-system';
import { useDashboard, useSyncTimeRangeParams, useInitialTimeRange } from '../../context';

// TODO: add time shortcut if one does not match duration
export const TIME_OPTIONS: TimeOption[] = [
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

export function TimeRangeControls() {
  const { timeRange, setTimeRange } = useTimeRange();
  const { dashboard } = useDashboard();
  const { defaultTimeRange } = useInitialTimeRange(dashboard.duration);

  // selected form value can be relative or absolute, timeRange from plugin-system is only absolute
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeValue>(defaultTimeRange);

  useSyncTimeRangeParams(selectedTimeRange);

  const [showCustomDateSelector, setShowCustomDateSelector] = useState(false);
  const anchorEl = useRef();

  // updates selectedTimeRange when zoom event has fired
  useEffect(() => {
    const convertedTimeRange = isRelativeTimeRange(selectedTimeRange)
      ? toAbsoluteTimeRange(selectedTimeRange)
      : selectedTimeRange;
    if (timeRange.start > convertedTimeRange.start) {
      setSelectedTimeRange(timeRange);
    }
  }, [timeRange, selectedTimeRange]);

  return (
    <Stack direction="row" spacing={1}>
      <Popover
        anchorEl={anchorEl.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={showCustomDateSelector}
        onClose={() => setShowCustomDateSelector(false)}
        sx={(theme) => ({
          padding: theme.spacing(2),
        })}
      >
        <AbsoluteTimePicker
          initialTimeRange={timeRange}
          onChange={(timeRange: AbsoluteTimeRange) => {
            setTimeRange(timeRange);
            setSelectedTimeRange(timeRange);
            setShowCustomDateSelector(false);
          }}
        />
      </Popover>
      <FormControl fullWidth>
        <Box ref={anchorEl}>
          <TimeRangeSelector
            timeOptions={TIME_OPTIONS}
            value={selectedTimeRange}
            onSelectChange={(event) => {
              const duration = event.target.value;
              const relativeTimeInput: RelativeTimeRange = {
                pastDuration: duration as DurationString,
                end: new Date(),
              };
              setTimeRange(relativeTimeInput);
              setSelectedTimeRange(relativeTimeInput);
              setShowCustomDateSelector(false);
            }}
            onCustomClick={() => {
              setShowCustomDateSelector(true);
            }}
          />
        </Box>
      </FormControl>
    </Stack>
  );
}
