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
import { TimeOption } from '@perses-dev/core';

interface TimeRangeInputProps {
  inputLabel: string;
  selectedTimeRange: string;
  timeOptions: TimeOption[];
  onSelectChange: (event: SelectChangeEvent<string>) => void;
  onCustomClick: () => void;
}

export function TimeRangeInput(props: TimeRangeInputProps) {
  const { inputLabel, selectedTimeRange, timeOptions, onSelectChange, onCustomClick } = props;

  return (
    <Select value={selectedTimeRange} label={inputLabel} onChange={onSelectChange}>
      {timeOptions.map((item, idx) => (
        <MenuItem key={idx} value={item.from}>
          {item.display}
        </MenuItem>
      ))}

      {selectedTimeRange.startsWith('now-') ? (
        <MenuItem
          onClick={() => {
            onCustomClick();
          }}
        >
          Custom time range
        </MenuItem>
      ) : (
        <MenuItem
          value={selectedTimeRange}
          onClick={() => {
            onCustomClick();
          }}
        >
          {selectedTimeRange}
        </MenuItem>
      )}
    </Select>
  );
}
