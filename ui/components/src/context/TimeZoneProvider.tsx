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

import React, { createContext, useContext } from 'react';
import { formatWithTimeZone, dateFormatOptionsWithTimeZone } from '../utils';

export const TimeZoneContext = createContext<string | undefined>(undefined);

export interface TimeZoneProviderProps {
  timeZone?: string;
  children?: React.ReactNode;
}

export function TimeZoneProvider(props: TimeZoneProviderProps) {
  const { children, timeZone } = props;
  return <TimeZoneContext.Provider value={timeZone}>{children}</TimeZoneContext.Provider>;
}

export function useTimeZone() {
  const timeZone = useContext(TimeZoneContext);
  return {
    // fallback to "local" timezone if TimeZoneProvider is not present in the React tree
    timeZone: timeZone ?? 'local',
    formatWithUserTimeZone(date: Date, formatString: string) {
      return formatWithTimeZone(date, formatString, timeZone);
    },
    dateFormatOptionsWithUserTimeZone(dateFormatOptions: Intl.DateTimeFormatOptions) {
      return dateFormatOptionsWithTimeZone(dateFormatOptions, timeZone);
    },
  };
}
