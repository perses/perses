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

import { createContext, ReactElement, ReactNode, useContext, useMemo } from 'react';
import { buildRelativeTimeOption, TimeOption } from '@perses-dev/components';
import { DurationString } from '@perses-dev/core';

const DEFAULT_OPTIONS: DurationString[] = ['5m', '15m', '30m', '1h', '6h', '12h', '24h', '7d', '14d'];
const defaultTimeRangeSettings: TimeRangeSettings = {
  showCustom: true,
  options: DEFAULT_OPTIONS.map((duration) => buildRelativeTimeOption(duration)),
};

export interface TimeRangeSettingsProviderProps {
  showCustom?: boolean;
  options?: TimeOption[];
  children: ReactNode;
}

export interface TimeRangeSettings {
  showCustom: boolean;
  options: TimeOption[];
}

export const TimeRangeSettingsContext = createContext<TimeRangeSettings>(defaultTimeRangeSettings);

export function useTimeRangeSettingsContext(): TimeRangeSettings {
  const ctx = useContext(TimeRangeSettingsContext);
  if (ctx === undefined) {
    throw new Error('No TimeRangeContext found. Did you forget a Provider?');
  }
  return ctx;
}

/**
 * Get and set the current resolved time range at runtime.
 */
export function useTimeRangeSettings(): TimeRangeSettings {
  return useTimeRangeSettingsContext();
}

/**
 * Get the current value of the showCustom setting.
 * @param override If set, the value of the provider will be overridden by this value.
 */
export function useShowCustomTimeRangeSetting(override?: boolean): boolean {
  const showCustomTimeRange = useTimeRangeSettings().showCustom;
  if (override !== undefined) {
    return override;
  }
  return showCustomTimeRange;
}

/**
 * Get the current value of the options setting.
 * @param override If set, the value of the provider will be overridden by this value.
 */
export function useTimeRangeOptionsSetting(override?: TimeOption[]): TimeOption[] {
  const showCustomTimeRange = useTimeRangeSettings().options;
  if (override !== undefined) {
    return override;
  }
  return showCustomTimeRange;
}

/**
 * Provider implementation that supplies the time range state at runtime.
 */
export function TimeRangeSettingsProvider(props: TimeRangeSettingsProviderProps): ReactElement {
  const ctx = useMemo(() => {
    return {
      showCustom: props.showCustom === undefined ? defaultTimeRangeSettings.showCustom : props.showCustom,
      options: props.options === undefined ? defaultTimeRangeSettings.options : props.options,
    };
  }, [props.showCustom, props.options]);

  return <TimeRangeSettingsContext.Provider value={ctx}>{props.children}</TimeRangeSettingsContext.Provider>;
}
