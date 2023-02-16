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

import { useState } from 'react';
import { Box, Stack, TextField, Typography, Button } from '@mui/material';
import { LocalizationProvider, StaticDateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AbsoluteTimeRange } from '@perses-dev/core';
import { useTimeZone } from '../context/TimeZoneProvider';
import { validateDateRange } from './utils';

const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

interface AbsoluteTimeFormProps {
  initialTimeRange: AbsoluteTimeRange;
  onChange: (timeRange: AbsoluteTimeRange) => void;
  onCancel: () => void;
}

type AbsoluteTimeRangeInputValue = {
  [Property in keyof AbsoluteTimeRange]: string;
};

export const AbsoluteTimePicker = ({ initialTimeRange, onChange, onCancel }: AbsoluteTimeFormProps) => {
  const { formatWithUserTimeZone } = useTimeZone();

  // Time range values as dates that can be used as a time range.
  const [timeRange, setTimeRange] = useState<AbsoluteTimeRange>(initialTimeRange);

  // Time range values as strings used to populate the text inputs. May not
  // be valid as dates when the user is typing.
  const [timeRangeInputs, setTimeRangeInputs] = useState<AbsoluteTimeRangeInputValue>({
    start: formatWithUserTimeZone(initialTimeRange.start, DATE_TIME_FORMAT),
    end: formatWithUserTimeZone(initialTimeRange.end, DATE_TIME_FORMAT),
  });

  const [showStartCalendar, setShowStartCalendar] = useState<boolean>(true);

  const changeTimeRange = (newTime: string | Date, segment: keyof AbsoluteTimeRange) => {
    const isInputChange = typeof newTime === 'string';
    const newInputTime = isInputChange ? newTime : formatWithUserTimeZone(newTime, DATE_TIME_FORMAT);

    setTimeRangeInputs((prevTimeRangeInputs) => {
      return {
        ...prevTimeRangeInputs,
        [segment]: newInputTime,
      };
    });

    // When the change is a string from an input, do not try to convert it to
    // a date because there are likely to be interim stages of editing where it
    // is not valid as a date. When the change is a Date from the calendar/clock
    // interface, we can be sure it is a date.
    if (!isInputChange) {
      setTimeRange((prevTimeRange) => {
        return {
          ...prevTimeRange,
          [segment]: newTime,
        };
      });
    }
  };

  const onChangeStartTime = (newStartTime: string | Date) => {
    changeTimeRange(newStartTime, 'start');
  };

  const onChangeEndTime = (newEndTime: string | Date) => {
    changeTimeRange(newEndTime, 'end');
  };

  const updateDateRange = () => {
    const newDates = {
      start: new Date(timeRangeInputs.start),
      end: new Date(timeRangeInputs.end),
    };
    const isValidDateRange = validateDateRange(newDates.start, newDates.end);
    if (isValidDateRange) {
      setTimeRange(newDates);
      return newDates;
    }
  };

  const onApply = () => {
    const newDates = updateDateRange();
    if (newDates) {
      onChange(newDates);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack
        spacing={2}
        sx={(theme) => ({
          padding: theme.spacing(1, 0, 2),
        })}
      >
        {showStartCalendar && (
          <Box
            sx={(theme) => ({
              // TODO: create separate reusable calendar component
              '.MuiPickerStaticWrapper-content': {
                backgroundColor: theme.palette.background.default,
              },
              // reposition AM and PM buttons
              '.MuiIconButton-sizeMedium': {
                top: 80,
                bottom: 'auto',
                margin: theme.spacing(0, 3),
              },
            })}
          >
            <Typography variant="h3" padding={1}>
              Select Start Time
            </Typography>
            <StaticDateTimePicker
              displayStaticWrapperAs="desktop"
              openTo="day"
              disableHighlightToday={true}
              value={initialTimeRange.start}
              onChange={(newValue) => {
                if (newValue === null) return;
                onChangeStartTime(newValue);
              }}
              onAccept={() => {
                setShowStartCalendar(false);
              }}
              renderInput={(params) => <TextField {...params} />}
            />
          </Box>
        )}
        {!showStartCalendar && (
          <Box
            sx={(theme) => ({
              '.MuiPickerStaticWrapper-content': {
                backgroundColor: theme.palette.background.default,
              },
              // reposition AM and PM buttons
              '.MuiIconButton-sizeMedium': {
                top: 80,
                bottom: 'auto',
                margin: theme.spacing(0, 3),
              },
            })}
          >
            <Typography variant="h3" padding={1}>
              Select End Time
            </Typography>
            <StaticDateTimePicker
              displayStaticWrapperAs="desktop"
              openTo="day"
              disableHighlightToday={true}
              value={initialTimeRange.end}
              minDateTime={timeRange.start}
              onChange={(newValue) => {
                if (newValue === null) return;
                onChangeEndTime(newValue);
              }}
              onAccept={(newValue) => {
                if (newValue === null) return;
                setShowStartCalendar(true);
                onChangeEndTime(newValue);
              }}
              renderInput={(params) => <TextField {...params} />}
            />
          </Box>
        )}
        <Stack direction="row" alignItems="center" gap={1} pl={1} pr={1}>
          <TextField
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              // TODO: add helperText, fix validation after we decide on form state solution
              onChangeStartTime(event.target.value);
            }}
            onBlur={() => updateDateRange()}
            value={timeRangeInputs.start}
            label="Start Time"
            placeholder={DATE_TIME_FORMAT}
            // tel used to match MUI DateTimePicker, may change in future: https://github.com/mui/material-ui/issues/27590
            type="tel"
          />
          <TextField
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onChangeEndTime(event.target.value);
            }}
            onBlur={() => updateDateRange()}
            value={timeRangeInputs.end}
            label="End Time"
            placeholder={DATE_TIME_FORMAT}
            type="tel"
          />
        </Stack>
        <Stack direction="row" sx={{ padding: (theme) => theme.spacing(0, 1) }} gap={1}>
          <Button variant="contained" onClick={() => onApply()} fullWidth>
            Apply
          </Button>
          <Button variant="outlined" onClick={() => onCancel()} fullWidth>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </LocalizationProvider>
  );
};
