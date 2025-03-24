// Copyright 2024 The Perses Authors
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

import { Box, MenuItem, Popover, Select } from '@mui/material';
import Calendar from 'mdi-material-ui/Calendar';
import {
  TimeRangeValue,
  isRelativeTimeRange,
  AbsoluteTimeRange,
  toAbsoluteTimeRange,
  RelativeTimeRange,
  parseDurationString,
} from '@perses-dev/core';
import { ReactElement, useMemo, useRef, useState } from 'react';
import { useTimeZone } from '../context';
import { TimeOption } from '../model';
import { DateTimeRangePicker } from './DateTimeRangePicker';
import { buildCustomTimeOption, formatTimeRange } from './utils';

interface TimeRangeSelectorProps {
  /**
   * The current value of the time range.
   */
  value: TimeRangeValue;
  /**
   * The list of time options to display in the dropdown.
   * The component will automatically add the last two options as a zoom out x2 and a custom absolute time range.
   */
  timeOptions: TimeOption[];
  /**
   * The callback to call when the time range changes.
   */
  onChange: (value: TimeRangeValue) => void;
  /**
   * Custom line height for the select component.
   */
  height?: string;
  /**
   * Whether to show the zoom out time range option.
   * Defaults to true.
   */
  showZoomoutTimeRange?: boolean;
  /**
   * Whether to show the custom time range option.
   * Defaults to true.
   */
  showCustomTimeRange?: boolean;
}

/**
 * Date & time selection component to customize what data renders on dashboard.
 * This includes relative shortcuts and the ability to pick absolute start and end times.
 * @param props
 * @constructor
 */
export function TimeRangeSelector({
  value,
  timeOptions,
  onChange,
  height,
  showCustomTimeRange = true,
  showZoomoutTimeRange = true,
}: TimeRangeSelectorProps): ReactElement {
  const { timeZone } = useTimeZone();

  const anchorEl = useRef(); // Used to position the absolute time range picker

  // Control the open state of the absolute time range picker
  const [showCustomDateSelector, setShowCustomDateSelector] = useState(false);

  // Build the initial value of the absolute time range picker
  const convertedTimeRange = useMemo(() => {
    return isRelativeTimeRange(value) ? toAbsoluteTimeRange(value) : value;
  }, [value]);

  // Last option is the absolute time range option (custom)
  // If the value is an absolute time range, we display this time range
  // If the value is a relative time range, we make a default CustomTimeOption built from undefined value
  const lastOption = useMemo(
    () => buildCustomTimeOption(isRelativeTimeRange(value) ? undefined : value, timeZone),
    [value, timeZone]
  );

  // Control the open state of the select component to prevent the menu from closing when the custom date picker is
  // opened.
  //
  // Note that the value state of the select is here for display only. The real value (the one from props) is managed
  // by click events on each menu item.
  // This is a trick to get around the limitation of select with menu item that doesn't support objects as value...
  const [open, setOpen] = useState(false);

  // Function to double current time range, adding 50% before current start and 50% after current end
  const doubleTimeRange = (): AbsoluteTimeRange => {
    if (Object.hasOwn(value, 'start')) {
      // current range is absolute
      const absVal = value as AbsoluteTimeRange;
      const rangeExtension = (absVal.end.getTime() - absVal.start.getTime()) / 2;
      const newStart = new Date(absVal.start.getTime() - rangeExtension);
      const newEnd = new Date(absVal.end.getTime() + rangeExtension);
      return { start: newStart, end: newEnd };
    } else {
      // current range is relative
      const relVal = value as RelativeTimeRange;
      const duration = parseDurationString(relVal.pastDuration);
      const rangeExtension =
        // eslint-disable-next-line prettier/prettier
          ((duration.seconds ?? 0) +
          (duration.minutes ?? 0) * 60 +
          (duration.hours ?? 0) * 3600 +
          (duration.days ?? 0) * 86400 +
          (duration.weeks ?? 0) * 7 * 86400 +
          (duration.months ?? 0) * 30.436875 * 86400 + // avg month duration is ok for zoom out
          (duration.years ?? 0) * 365.2425 * 86400) * // avg year duration is ok for zoom out
          // eslint-disable-next-line prettier/prettier
          1000 / 2; // to milliseconds, then half it to be added before current start and after current end

      const extendAfterEnd = typeof relVal.end !== 'undefined';
      const newEnd = extendAfterEnd ? new Date(relVal.end!.getTime() + rangeExtension) : new Date();
      const newStart = new Date(newEnd.getTime() - rangeExtension * 4);
      return { start: newStart, end: newEnd };
    }
  };

  return (
    <>
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
        <DateTimeRangePicker
          initialTimeRange={convertedTimeRange}
          onChange={(value: AbsoluteTimeRange) => {
            onChange(value);
            setShowCustomDateSelector(false);
            setOpen(false);
          }}
          onCancel={() => setShowCustomDateSelector(false)}
        />
      </Popover>
      <Box ref={anchorEl}>
        <Select
          open={open}
          value={formatTimeRange(value, timeZone)}
          onClick={() => setOpen(!open)}
          IconComponent={Calendar}
          inputProps={{
            'aria-label': `Select time range. Currently set to ${value}`,
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
            <MenuItem
              key={idx}
              value={formatTimeRange(item.value, timeZone)}
              onClick={() => {
                onChange(item.value);
              }}
            >
              {item.display}
            </MenuItem>
          ))}
          {showZoomoutTimeRange && (
            <MenuItem
              value="Zoom out x2"
              onClick={() => {
                onChange(doubleTimeRange());
              }}
            >
              Zoom out x2
            </MenuItem>
          )}
          {showCustomTimeRange && (
            <MenuItem
              value={formatTimeRange(lastOption.value, timeZone)}
              onClick={() => setShowCustomDateSelector(true)}
            >
              {lastOption.display}
            </MenuItem>
          )}
        </Select>
      </Box>
    </>
  );
}
