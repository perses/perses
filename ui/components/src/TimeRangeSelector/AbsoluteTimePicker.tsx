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

import { useState } from 'react';
import { Box, Stack, TextField, Divider } from '@mui/material';
import { LocalizationProvider, StaticDateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { AbsoluteTimeRange } from '@perses-dev/core';
import { validateDateRange } from './utils';

const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

interface AbsoluteTimeFormProps {
  initialTimeRange: AbsoluteTimeRange;
  onChange: (timeRange: AbsoluteTimeRange) => void;
}

export const AbsoluteTimePicker = ({ initialTimeRange, onChange }: AbsoluteTimeFormProps) => {
  const [timeRange, setTimeRange] = useState<AbsoluteTimeRange>(initialTimeRange);
  const [showStartCalendar, setShowStartCalendar] = useState<boolean>(true);
  const [showEndCalendar, setShowEndCalendar] = useState<boolean>(false);

  const handleOnStartAccept = () => {
    setShowStartCalendar(false);
    setShowEndCalendar(true);
  };

  const handleOnEndAccept = () => {
    setShowEndCalendar(false);
    setShowStartCalendar(true);
    onChange(timeRange);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack spacing={3} sx={{ padding: (theme) => theme.spacing(1, 2, 3) }}>
        {showStartCalendar && (
          <Box
            sx={(theme) => ({
              '.MuiPickerStaticWrapper-content': {
                backgroundColor: theme.palette.background.default,
              },
            })}
          >
            <h3>Select Start Time</h3>
            <StaticDateTimePicker
              displayStaticWrapperAs="desktop"
              openTo="day"
              disableHighlightToday={true}
              ampm={false}
              value={initialTimeRange.start}
              onChange={(newValue) => {
                if (newValue === null) return;
                setTimeRange({ start: newValue, end: timeRange.end });
              }}
              onAccept={() => handleOnStartAccept()}
              renderInput={(params) => <TextField {...params} />}
            />
          </Box>
        )}
        {showEndCalendar && (
          <Box
            sx={(theme) => ({
              '.MuiPickerStaticWrapper-content': {
                backgroundColor: theme.palette.background.default,
              },
            })}
          >
            <h3>Select End Time</h3>
            <StaticDateTimePicker
              displayStaticWrapperAs="desktop"
              openTo="day"
              disableHighlightToday={true}
              ampm={false}
              value={initialTimeRange.end}
              onChange={(newValue) => {
                if (newValue === null) return;
                setTimeRange({ start: timeRange.start, end: newValue });
              }}
              onAccept={() => handleOnEndAccept()}
              renderInput={(params) => <TextField {...params} />}
            />
          </Box>
        )}
        <TextField
          fullWidth
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            // TODO: add helperText, fix validation after we decide on form state solution
            const startDate = new Date(event.target.value);
            const isValidDateRange = validateDateRange(startDate, timeRange.end);
            if (isValidDateRange === true) {
              const updatedRange = { start: startDate, end: timeRange.end };
              setTimeRange(updatedRange);
              onChange(updatedRange);
            }
          }}
          value={format(timeRange.start, DATE_TIME_FORMAT)}
          label="Start Time"
          placeholder="mm/dd/yyyy hh:mm"
          type="tel"
        />
        <Divider
          sx={(theme) => ({
            margin: theme.spacing(2, 0),
            borderColor: theme.palette.grey['500'],
          })}
        />
        <TextField
          fullWidth
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const endDate = new Date(event.target.value);
            const isValidDateRange = validateDateRange(timeRange.start, endDate);
            if (isValidDateRange === true) {
              const updatedRange = { start: timeRange.start, end: endDate };
              setTimeRange(updatedRange);
              onChange(updatedRange);
            }
          }}
          value={format(timeRange.end, DATE_TIME_FORMAT)}
          label="End Time"
          placeholder="mm/dd/yyyy hh:mm"
          type="tel"
        />
      </Stack>
    </LocalizationProvider>
  );
};
