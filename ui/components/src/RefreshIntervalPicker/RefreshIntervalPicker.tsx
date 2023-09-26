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

import { Box, FormControl, MenuItem, Select } from '@mui/material';
import { DurationString } from '@perses-dev/core';
import { useMemo } from 'react';
import { TimeOption } from '../model';

interface RefreshIntervalPickerProps {
  timeOptions: TimeOption[];
  value?: DurationString;
  onChange: (value: DurationString) => void;
  height?: string;
}

export function RefreshIntervalPicker(props: RefreshIntervalPickerProps) {
  const { value, onChange, timeOptions, height } = props;
  const formattedValue = value;

  // If the dashboard refresh interval is not provided in timeOptions, it will create a specific option for the select
  const customInterval = useMemo(() => {
    if (value && !timeOptions.some((option) => option.value.pastDuration === value)) {
      return <MenuItem value={value}>{value}</MenuItem>;
    }
  }, [timeOptions, value]);

  return (
    <FormControl>
      <Box>
        <Select
          id="refreshInterval"
          value={formattedValue}
          onChange={(event) => {
            const duration = event.target.value as DurationString;
            onChange(duration);
          }}
          inputProps={{
            'aria-label': `Select refresh interval. Currently set to ${formattedValue}`,
          }}
          sx={{
            '.MuiSelect-select': height ? { lineHeight: height, paddingY: 0 } : {},
          }}
        >
          {timeOptions.map((item, idx) => (
            <MenuItem key={idx} value={item.value.pastDuration}>
              {item.display}
            </MenuItem>
          ))}
          {customInterval}
        </Select>
      </Box>
    </FormControl>
  );
}
