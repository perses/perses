// Copyright 2021 The Perses Authors
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

import { useMemo } from 'react';
import { createContext, useContext } from 'react';
import useResizeObserver from 'use-resize-observer';

export interface PanelContextType {
  contentDimensions?: {
    width: number;
    height: number;
  };
}

export const PanelContext = createContext<PanelContextType | undefined>(
  undefined
);

export interface PanelContextProviderProps {
  contentElement: HTMLDivElement | null;
  children: React.ReactNode;
}

export function PanelContextProvider(props: PanelContextProviderProps) {
  const { contentElement, children } = props;
  const { width, height } = useResizeObserver({ ref: contentElement });

  const context: PanelContextType = useMemo(() => {
    const contentDimensions =
      width !== undefined && height !== undefined
        ? { width, height }
        : undefined;
    return { contentDimensions };
  }, [width, height]);

  return (
    <PanelContext.Provider value={context}>{children}</PanelContext.Provider>
  );
}

export function usePanelContext() {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error(`No Panel context found. Did you forget a Provider?`);
  }
  return context;
}
