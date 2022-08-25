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
import { AbsoluteTimeRange, TimeOption, convertTimeShortcut, parseDurationString } from '@perses-dev/core';
import { AbsoluteTimePicker } from './AbsoluteTimePicker';
import { TimeRangeInput } from './TimeRangeInput';

const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
const FORM_CONTROL_LABEL = 'Time Range';

// TODO: support both absolute and relative ranges: https://github.com/perses/perses/pull/509#discussion_r954029540
// // type TimeRangeValue = AbsoluteTimeRange | RelativeTimeRange
// interface TimeRangeSelectorProps {
//   timeOptions: TimeOption[];
//   value: AbsoluteTimeRange | RelativeTimeRange;
//   onChange: (value: AbsoluteTimeRange | RelativeTimeRange) => void;
// }

interface TimeRangeSelectorProps {
  timeOptions: TimeOption[];
  onChange: (value: AbsoluteTimeRange) => void;
  defaultTimeOption?: TimeOption;
}

export function TimeRangeSelector(props: TimeRangeSelectorProps) {
  const { timeOptions, onChange } = props;

  // TODO: refactor when adding shareable URLs support
  const defaultTimeOption = props.defaultTimeOption ?? { from: 'now-6h', to: 'now', display: 'Last 6 hours' };
  const defaultDuration = defaultTimeOption.from.split('-')[1] ?? '6h';
  const defaultStart = parseDurationString(defaultDuration);

  const [selectedTimeRange, setSelectedTimeRange] = useState(defaultTimeOption.from);

  const [absoluteTimeRange, setAbsoluteTime] = useState<AbsoluteTimeRange>({
    start: sub(new Date(), { ...defaultStart }),
    end: new Date(),
  });

  const anchorEl = useRef();
  const [showCustomDateSelector, setShowCustomDateSelector] = useState(false);

  const handleSelectChange = (event: string) => {
    const convertedAbsoluteTime = convertTimeShortcut(event);
    onChange(convertedAbsoluteTime);
    setAbsoluteTime(convertedAbsoluteTime);
    setShowCustomDateSelector(false);
  };

  const handleTimePickerChange = (timeRange: AbsoluteTimeRange) => {
    onChange(timeRange);
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
          <TimeRangeInput
            inputLabel="Time Range"
            timeOptions={timeOptions}
            selectedTimeRange={selectedTimeRange}
            onSelectChange={handleSelectChange}
            onCustomClick={() => {
              setShowCustomDateSelector(true);
            }}
          />
        </Box>
      </FormControl>
    </Stack>
  );
}
