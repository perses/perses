import { useRef, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Popover, Select, SelectProps, Stack } from '@mui/material';
import { format, sub } from 'date-fns';
import { AbsoluteTimeRange, TimeOption, convertTimeShortcut, parseDurationString } from '@perses-dev/core';
import { AbsoluteTimePicker } from './AbsoluteTimePicker';

const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
const FORM_CONTROL_LABEL = 'Time Range';

interface TimeRangeSelectorProps {
  timeOptions: TimeOption[];
  onChange: (value: AbsoluteTimeRange) => void;
  defaultTimeOption?: TimeOption;
}

export function TimeRangeSelector(props: TimeRangeSelectorProps) {
  const { timeOptions, onChange } = props;

  // TODO: refactor when adding shareable URLs support...
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
      </FormControl>
    </Stack>
  );
}
