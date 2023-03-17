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

import { useRef, useState, useMemo } from 'react';
import { Box, FormControl, Popover, Stack } from '@mui/material';
import {
  DurationString,
  RelativeTimeRange,
  AbsoluteTimeRange,
  isRelativeTimeRange,
  toAbsoluteTimeRange,
  TimeRangeValue,
} from '@perses-dev/core';
import { AbsoluteTimePicker } from './AbsoluteTimePicker';
import { TimeRangeSelector, TimeOption } from './TimeRangeSelector';

interface DateTimeRangePickerProps {
  value: TimeRangeValue;
  onChange: (value: TimeRangeValue) => void;
  timeOptions: TimeOption[];
  height?: string;
}

export function DateTimeRangePicker(props: DateTimeRangePickerProps) {
  const { value, onChange, timeOptions, height } = props;

  const [showCustomDateSelector, setShowCustomDateSelector] = useState(false);
  const anchorEl = useRef();

  const convertedTimeRange = useMemo(() => {
    return isRelativeTimeRange(value) ? toAbsoluteTimeRange(value) : value;
  }, [value]);

  return (
    <Stack direction="row" spacing={1} height={height}>
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
          initialTimeRange={convertedTimeRange}
          onChange={(value: AbsoluteTimeRange) => {
            onChange(value);
            setShowCustomDateSelector(false);
          }}
          onCancel={() => setShowCustomDateSelector(false)}
        />
      </Popover>
      <FormControl fullWidth>
        <Box ref={anchorEl}>
          <TimeRangeSelector
            timeOptions={timeOptions}
            value={value}
            height={height}
            onSelectChange={(event) => {
              const duration = event.target.value;
              const relativeTimeInput: RelativeTimeRange = {
                pastDuration: duration as DurationString,
                end: new Date(),
              };
              onChange(relativeTimeInput);
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
