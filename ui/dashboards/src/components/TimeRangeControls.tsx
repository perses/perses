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

import { useRef, useState } from 'react';
import { Box, FormControl, InputLabel, Popover, Stack } from '@mui/material';
import { format, sub } from 'date-fns';
import { AbsoluteTimePicker, TimeRangeSelector } from '@perses-dev/components';
import { AbsoluteTimeRange, TimeOption, convertTimeShortcut, parseDurationString } from '@perses-dev/core';
import { useTimeRange } from '@perses-dev/plugin-system';
import { useTimeRangeSetter } from '../context/TimeRangeStateProvider';

// TODO: add time shortcut if one does not match duration
export const TIME_OPTIONS: TimeOption[] = [
  { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
  { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
  { from: 'now-30m', to: 'now', display: 'Last 30 minutes' },
  { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
  { from: 'now-6h', to: 'now', display: 'Last 6 hours' },
  { from: 'now-12h', to: 'now', display: 'Last 12 hours' },
  { from: 'now-1d', to: 'now', display: 'Last 1 day' },
  { from: 'now-7d', to: 'now', display: 'Last 7 days' },
  { from: 'now-14d', to: 'now', display: 'Last 14 days' },
];

const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
const FORM_CONTROL_LABEL = 'Time Range';

export function TimeRangeControls() {
  const { setTimeRange } = useTimeRangeSetter();
  const { defaultDuration } = useTimeRange();
  // TODO: default to URL param if populated

  // TODO: use existing RelativeTimeRange from core instead of defining new TimeOption interface
  const defaultTimeOption = TIME_OPTIONS.find((option) => option.from === `now-${defaultDuration}`) ?? {
    from: 'now-6h',
    to: 'now',
    display: 'Last 6 hours',
  };
  const parsedDuration = defaultTimeOption.from.split('-')[1] ?? '6h';
  const defaultStart = parseDurationString(parsedDuration);

  const [selectedTimeRange, setSelectedTimeRange] = useState(defaultTimeOption.from);

  const [absoluteTimeRange, setAbsoluteTime] = useState<AbsoluteTimeRange>({
    start: sub(new Date(), { ...defaultStart }),
    end: new Date(),
  });

  const anchorEl = useRef();
  const [showCustomDateSelector, setShowCustomDateSelector] = useState(false);

  const handleTimePickerChange = (timeRange: AbsoluteTimeRange) => {
    setTimeRange(timeRange);
    setAbsoluteTime({ start: timeRange.start, end: timeRange.end });
    const formattedStart = format(timeRange.start, DATE_TIME_FORMAT);
    const formattedEnd = format(timeRange.end, DATE_TIME_FORMAT);
    const formattedRange = `${formattedStart} - ${formattedEnd}`;
    setSelectedTimeRange(formattedRange);
    setShowCustomDateSelector(false);
  };

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
        <AbsoluteTimePicker initialTimeRange={absoluteTimeRange} onChange={handleTimePickerChange} />
      </Popover>
      <FormControl fullWidth>
        <InputLabel>{FORM_CONTROL_LABEL}</InputLabel>
        <Box ref={anchorEl}>
          <TimeRangeSelector
            inputLabel={FORM_CONTROL_LABEL}
            timeOptions={TIME_OPTIONS}
            selectedTimeRange={selectedTimeRange}
            onSelectChange={(event) => {
              const timeShortcut = event.target.value;
              const convertedAbsoluteTime = convertTimeShortcut(timeShortcut);
              setTimeRange(convertedAbsoluteTime);
              setAbsoluteTime(convertedAbsoluteTime);
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
