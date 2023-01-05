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
import { Box, Stack, TextField, Typography } from '@mui/material';
import { LocalizationProvider, StaticDateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AbsoluteTimeRange } from '@perses-dev/core';
import { useTimeZone } from '../context/TimeZoneProvider';
import { validateDateRange } from './utils';

const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

interface AbsoluteTimeFormProps {
  initialTimeRange: AbsoluteTimeRange;
  onChange: (timeRange: AbsoluteTimeRange) => void;
}

export const AbsoluteTimePicker = ({ initialTimeRange, onChange }: AbsoluteTimeFormProps) => {
  const [timeRange, setTimeRange] = useState<AbsoluteTimeRange>(initialTimeRange);
  const [showStartCalendar, setShowStartCalendar] = useState<boolean>(true);
  const { formatWithUserTimeZone } = useTimeZone();

  // validate start and end time, propagate changes
  const updateDateRange = (input: string, isStartDate: boolean) => {
    const newDate = new Date(input);
    if (isStartDate === true) {
      const isValidDateRange = validateDateRange(newDate, timeRange.end);
      if (isValidDateRange === true) {
        setTimeRange((current) => {
          const updatedRange = { start: newDate, end: current.end };
          onChange(updatedRange);
          return updatedRange;
        });
      }
    } else {
      const isValidDateRange = validateDateRange(timeRange.start, newDate);
      if (isValidDateRange === true) {
        setTimeRange((current) => {
          const updatedRange = { start: current.start, end: newDate };
          onChange(updatedRange);
          return updatedRange;
        });
      }
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
                setTimeRange((current) => {
                  return { start: newValue, end: current.end };
                });
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
                setTimeRange((current) => {
                  return { start: current.start, end: newValue };
                });
              }}
              onAccept={() => {
                setShowStartCalendar(true);
                onChange(timeRange);
              }}
              renderInput={(params) => <TextField {...params} />}
            />
          </Box>
        )}
        <Stack direction="row" alignItems="center" gap={1} pl={1} pr={1}>
          <TextField
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              // TODO: add helperText, fix validation after we decide on form state solution
              updateDateRange(event.target.value, true);
            }}
            value={formatWithUserTimeZone(timeRange.start, DATE_TIME_FORMAT)}
            label="Start Time"
            placeholder="mm/dd/yyyy hh:mm"
            // tel used to match MUI DateTimePicker, may change in future: https://github.com/mui/material-ui/issues/27590
            type="tel"
          />
          <TextField
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              updateDateRange(event.target.value, false);
            }}
            value={formatWithUserTimeZone(timeRange.end, DATE_TIME_FORMAT)}
            label="End Time"
            placeholder="mm/dd/yyyy hh:mm"
            type="tel"
          />
        </Stack>
      </Stack>
    </LocalizationProvider>
  );
};
