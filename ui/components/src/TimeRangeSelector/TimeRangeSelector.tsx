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

import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { TimeRangeValue, RelativeTimeRange, isRelativeValue } from '@perses-dev/core';
import { formatAbsoluteRange } from './utils';

const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

export interface TimeOption {
  value: RelativeTimeRange;
  display: string;
}

interface TimeRangeSelectorProps {
  inputLabel: string;
  value: TimeRangeValue;
  timeOptions: TimeOption[];
  onSelectChange: (event: SelectChangeEvent<string>) => void;
  onCustomClick: () => void;
}

export function TimeRangeSelector(props: TimeRangeSelectorProps) {
  const { inputLabel, value, timeOptions, onSelectChange, onCustomClick } = props;

  const relativeValue = isRelativeValue(value) ? value : { pastDuration: '6h' };
  const formattedValue = !isRelativeValue(value) ? formatAbsoluteRange(value, DATE_TIME_FORMAT) : value.pastDuration;

  return (
    <Select value={relativeValue.pastDuration} label={inputLabel} onChange={onSelectChange}>
      {timeOptions.map((item, idx) => (
        <MenuItem key={idx} value={item.value.pastDuration}>
          {item.value.pastDuration}
        </MenuItem>
      ))}

      {isRelativeValue(value) ? (
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

