import { TimeRangeSelector } from '@perses-dev/components';
import { TimeOption } from '@perses-dev/core';
import { useTimeRange } from '@perses-dev/plugin-system';
import { useTimeRangeSetter } from '../context/TimeRangeStateProvider';

// TODO: add time shortcut if one does not match duration
export const TIME_OPTIONS: TimeOption[] = [
  { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
  { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
  { from: 'now-30m', to: 'now', display: 'Last 30 minutes' },
  { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
  { from: 'now-6h', to: 'now', display: 'Last 6 hours' },
  { from: 'now-12h', to: 'now', display: 'Last 12 hours' },
  { from: 'now-1d', to: 'now', display: 'Last 1 day' },
  { from: 'now-7d', to: 'now', display: 'Last 7 days' },
  { from: 'now-14d', to: 'now', display: 'Last 14 days' },
];

export function TimeRangeControls() {
  const { setTimeRange } = useTimeRangeSetter();
  const { defaultDuration } = useTimeRange();
  // TODO: default to URL param if populated
  const defaultTimeOption = TIME_OPTIONS.find((option) => option.from === `now-${defaultDuration}`);
  return <TimeRangeSelector defaultTimeOption={defaultTimeOption} onChange={setTimeRange} timeOptions={TIME_OPTIONS} />;
}
