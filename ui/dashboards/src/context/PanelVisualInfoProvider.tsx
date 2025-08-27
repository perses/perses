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

import { createContext, ReactElement, useContext, useMemo } from 'react';

export interface PanelVisualInfo {
  width: number;
}

export interface PanelVisualInfoProviderProps {
  width: number;
  children: React.ReactNode;
}

export const PanelVisualInfoProviderContext = createContext<PanelVisualInfo | undefined>(undefined);

export const usePanelVisualInfoContext = (): PanelVisualInfo => {
  const ctx = useContext(PanelVisualInfoProviderContext);
  if (!ctx) throw new Error('No PanelVisualInfoProviderContext found. Did you forget a Provider?');

  return ctx;
};

export const PanelVisualInfoProvider = ({ children, width }: PanelVisualInfoProviderProps): ReactElement => {
  const ctx = useMemo(() => ({ width }), [width]);
  return <PanelVisualInfoProviderContext.Provider value={ctx}>{children}</PanelVisualInfoProviderContext.Provider>;
};
