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

import RefreshIcon from 'mdi-material-ui/Refresh';
import { DateTimeRangePicker, InfoTooltip, TimeOption, TooltipPlacement } from '@perses-dev/components';
import { useTimeRange } from '@perses-dev/plugin-system';
import { isDurationString } from '@perses-dev/core';
import { useDefaultTimeRange } from '../../context';
import { TOOLTIP_COPY } from '../../utils';
import { ToolbarIconButton } from '../ToolbarIconButton';

export const TIME_OPTIONS: TimeOption[] = [
  { value: { pastDuration: '5m' }, display: 'Last 5 minutes' },
  { value: { pastDuration: '15m' }, display: 'Last 15 minutes' },
  { value: { pastDuration: '30m' }, display: 'Last 30 minutes' },
  { value: { pastDuration: '1h' }, display: 'Last 1 hour' },
  { value: { pastDuration: '6h' }, display: 'Last 6 hours' },
  { value: { pastDuration: '12h' }, display: 'Last 12 hours' },
  { value: { pastDuration: '24h' }, display: 'Last 1 day' },
  { value: { pastDuration: '7d' }, display: 'Last 7 days' },
  { value: { pastDuration: '14d' }, display: 'Last 14 days' },
];

const DEFAULT_HEIGHT = '34px';

interface TimeRangeControlsProps {
  // Height of the controls in pixels.
  // The controls look best at heights >= 28 pixels.
  // You can use values less than 28, but it won't look great.
  heightPx?: number;
}

export function TimeRangeControls({ heightPx }: TimeRangeControlsProps) {
  const { timeRange, setTimeRange, refresh } = useTimeRange();
  const defaultTimeRange = useDefaultTimeRange();

  // Convert height as a number to height as a string, then use this value for styling
  const height = heightPx === undefined ? DEFAULT_HEIGHT : `${heightPx}px`;

  // add time shortcut if one does not match duration from dashboard JSON
  if (!TIME_OPTIONS.some((option) => option.value.pastDuration === defaultTimeRange.pastDuration)) {
    if (isDurationString(defaultTimeRange.pastDuration)) {
      TIME_OPTIONS.push({
        value: { pastDuration: defaultTimeRange.pastDuration },
        display: `Last ${defaultTimeRange.pastDuration}`,
      });
    }
  }

  return (
    <>
      <DateTimeRangePicker timeOptions={TIME_OPTIONS} value={timeRange} onChange={setTimeRange} height={height} />
      <InfoTooltip description={TOOLTIP_COPY.refreshDashboard} placement={TooltipPlacement.Bottom}>
        <ToolbarIconButton aria-label={TOOLTIP_COPY.refreshDashboard} onClick={refresh} sx={{ height }}>
          <RefreshIcon />
        </ToolbarIconButton>
      </InfoTooltip>
    </>
  );
}
