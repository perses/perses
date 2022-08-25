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
import { MenuItem, Select, SelectProps } from '@mui/material';
import { sub } from 'date-fns';
import { AbsoluteTimeRange, TimeOption, convertTimeShortcut, parseDurationString } from '@perses-dev/core';

// const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
const FORM_CONTROL_LABEL = 'Time Range';

// TODO: support both absolute and relative ranges: https://github.com/perses/perses/pull/509#discussion_r954029540
// // type TimeRangeValue = AbsoluteTimeRange | RelativeTimeRange
// interface TimeRangeSelectorProps {
//   timeOptions: TimeOption[];
//   value: AbsoluteTimeRange | RelativeTimeRange;
//   onChange: (value: AbsoluteTimeRange | RelativeTimeRange) => void;
// }

interface TimeRangeInputProps {
  timeOptions: TimeOption[];
  onChange: (value: AbsoluteTimeRange) => void;
  defaultTimeOption?: TimeOption;
}

export function TimeRangeInput(props: TimeRangeInputProps) {
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

  const handleSelectChange: SelectProps['onChange'] = (event) => {
    const timeShortcut = event.target.value as string;
    setSelectedTimeRange(timeShortcut);
    const convertedAbsoluteTime = convertTimeShortcut(timeShortcut);
    onChange(convertedAbsoluteTime);
    setAbsoluteTime(convertedAbsoluteTime);
    setShowCustomDateSelector(false);
  };

  return (
    <Select value={selectedTimeRange} label={FORM_CONTROL_LABEL} onChange={handleSelectChange} ref={anchorEl}>
      {timeOptions.map((item, idx) => (
        <MenuItem key={idx} value={item.from}>
          {item.display}
        </MenuItem>
      ))}

      {selectedTimeRange.startsWith('now-') ? (
        <MenuItem
          onClick={() => {
            setShowCustomDateSelector(true);
          }}
        >
          Custom time range
        </MenuItem>
      ) : (
        <MenuItem
          value={selectedTimeRange}
          onClick={() => {
            setShowCustomDateSelector(true);
          }}
        >
          {selectedTimeRange}
        </MenuItem>
      )}
    </Select>
  );
}
