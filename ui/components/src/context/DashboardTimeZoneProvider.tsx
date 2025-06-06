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

import React, { createContext, ReactElement, useContext } from 'react';
import { formatWithTimeZone, dateFormatOptionsWithTimeZone } from '../utils';

type DashboardTimeZoneContextType = {
  timeZone: string;
  setTimeZone: (timeZone: string) => void;
};

export const DashboardTimeZoneContext = createContext<DashboardTimeZoneContextType | undefined>(undefined);

export interface DashboardTimeZoneProviderProps {
  timeZone: string;
  setTimeZone: (timeZone: string) => void;
  children: React.ReactNode;
}

export function DashboardTimeZoneProvider(props: DashboardTimeZoneProviderProps): ReactElement {
  const { timeZone, setTimeZone } = props;
  return (
    <DashboardTimeZoneContext.Provider value={{ timeZone, setTimeZone }}>
      {props.children}
    </DashboardTimeZoneContext.Provider>
  );
}

export function useDashboardTimeZone(): {
  timeZone: string;
  setTimeZone: (timeZone: string) => void;
  formatWithUserTimeZone: (date: Date, formatString: string) => string;
  dateFormatOptionsWithUserTimeZone: (dateFormatOptions: Intl.DateTimeFormatOptions) => Intl.DateTimeFormatOptions;
} {
  const timeZoneContext = useContext(DashboardTimeZoneContext);

  return {
    timeZone: timeZoneContext?.timeZone || 'local',
    setTimeZone: (timeZone: string) => timeZoneContext?.setTimeZone(timeZone),
    formatWithUserTimeZone(date: Date, formatString: string): string {
      return formatWithTimeZone(date, formatString, timeZoneContext?.timeZone);
    },
    dateFormatOptionsWithUserTimeZone(dateFormatOptions: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions {
      return dateFormatOptionsWithTimeZone(dateFormatOptions, timeZoneContext?.timeZone);
    },
  };
}
