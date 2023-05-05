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

import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import Calendar from 'mdi-material-ui/Calendar';
import { TimeRangeValue, RelativeTimeRange, isRelativeTimeRange } from '@perses-dev/core';
import { useTimeZone } from '../context/TimeZoneProvider';
import { formatAbsoluteRange } from './utils';

const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

export interface TimeOption {
  value: RelativeTimeRange;
  display: string;
}

interface TimeRangeSelectorProps {
  value: TimeRangeValue;
  timeOptions: TimeOption[];
  onSelectChange: (event: SelectChangeEvent<string>) => void;
  onCustomClick: () => void;
  height?: string;
}

export function TimeRangeSelector(props: TimeRangeSelectorProps) {
  const { value, timeOptions, onSelectChange, onCustomClick, height } = props;
  const { timeZone } = useTimeZone();
  const formattedValue = !isRelativeTimeRange(value)
    ? formatAbsoluteRange(value, DATE_TIME_FORMAT, timeZone)
    : value.pastDuration;
  return (
    <Select
      value={formattedValue}
      onChange={onSelectChange}
      IconComponent={Calendar}
      inputProps={{
        'aria-label': `Select time range. Currently set to ${formattedValue}`,
      }}
      sx={{
        // `transform: none` prevents calendar icon from flipping over when menu is open
        '.MuiSelect-icon': {
          marginTop: '1px',
          transform: 'none',
        },
        // paddingRight creates more space for the calendar icon (it's a bigger icon)
        '.MuiSelect-select.MuiSelect-outlined.MuiInputBase-input': {
          paddingRight: '36px',
        },
        '.MuiSelect-select': height ? { lineHeight: height, paddingY: 0 } : {},
      }}
    >
      {timeOptions.map((item, idx) => (
        <MenuItem key={idx} value={item.value.pastDuration}>
          {item.display}
        </MenuItem>
      ))}

      {isRelativeTimeRange(value) ? (
        <MenuItem
          onClick={() => {
            onCustomClick();
          }}
        >
          Custom time range
        </MenuItem>
      ) : (
        <MenuItem
          value={formattedValue}
          onClick={() => {
            onCustomClick();
          }}
        >
          {formattedValue}
        </MenuItem>
      )}
    </Select>
  );
}
