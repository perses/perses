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

import React, { createContext, useContext, useMemo, useState } from 'react';
import { PersesChartsTheme } from '../model';
import { CursorCoordinates } from '../TimeSeriesTooltip';

export interface ChartsProviderProps {
  chartsTheme: PersesChartsTheme;
  enablePinning?: boolean;
  children?: React.ReactNode;
}

export interface SharedChartsState {
  chartsTheme: PersesChartsTheme;
  enablePinning: boolean;
  isAnyTooltipPinned: boolean;
  setIsAnyTooltipPinned: (isTooltipPinned: boolean) => void;
  lastTooltipPinnedCoords: CursorCoordinates | null;
  setLastTooltipPinnedCoords: (lastTooltipPinnedCoords: CursorCoordinates | null) => void;
}

export function ChartsProvider(props: ChartsProviderProps) {
  const { children, chartsTheme, enablePinning = false } = props;

  const [isAnyTooltipPinned, setIsAnyTooltipPinned] = useState(false);
  const [lastTooltipPinnedCoords, setLastTooltipPinnedCoords] = useState<CursorCoordinates | null>(null);

  const ctx = useMemo(() => {
    return {
      chartsTheme,
      enablePinning,
      isAnyTooltipPinned,
      setIsAnyTooltipPinned,
      lastTooltipPinnedCoords,
      setLastTooltipPinnedCoords,
    };
  }, [
    chartsTheme,
    enablePinning,
    isAnyTooltipPinned,
    setIsAnyTooltipPinned,
    lastTooltipPinnedCoords,
    setLastTooltipPinnedCoords,
  ]);

  return <ChartsThemeContext.Provider value={ctx}>{children}</ChartsThemeContext.Provider>;
}

export const ChartsThemeContext = createContext<SharedChartsState | undefined>(undefined);

export function useChartsThemeContext() {
  const ctx = useContext(ChartsThemeContext);
  if (ctx === undefined) {
    throw new Error('No ChartsThemeContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function useChartsTheme(): SharedChartsState {
  const ctx = useChartsThemeContext();
  return ctx;
}
