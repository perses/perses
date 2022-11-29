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

import React, { createContext, useContext, useState } from 'react';
import { TimeZoneProvider } from '@perses-dev/components';

interface UtcTimeZoneContext {
  isUtcTimeZone: boolean;
  setUtcTimeZone: (value: boolean) => void;
}

export const UtcTimeZoneContext = createContext<UtcTimeZoneContext | undefined>(undefined);

export function UtcTimeZoneProvider(props: { children: React.ReactNode }) {
  const [isUtcTimeZone, setUtcTimeZone] = useState(false);
  return (
    <TimeZoneProvider timeZone={isUtcTimeZone ? 'utc' : 'local'}>
      <UtcTimeZoneContext.Provider value={{ isUtcTimeZone, setUtcTimeZone }}>
        {props.children}
      </UtcTimeZoneContext.Provider>
    </TimeZoneProvider>
  );
}

export function useUtcTimeZone(): UtcTimeZoneContext {
  const ctx = useContext(UtcTimeZoneContext);
  if (ctx === undefined) {
    throw new Error('No UtcTimeZoneContext found. Did you forget a Provider?');
  }
  return ctx;
}
