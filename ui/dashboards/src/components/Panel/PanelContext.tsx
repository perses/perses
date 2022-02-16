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

import { createContext, useContext } from 'react';

/**
 * Context for the current Panel.
 */
export interface PanelContextType {
  contentDimensions?: {
    width: number;
    height: number;
  };
}

/**
 * React context provided by the Panel component to its children.
 */
export const PanelContext = createContext<PanelContextType | undefined>(undefined);

/**
 * Gets the context for the current Panel and throws if the Provider is missing.
 */
export function usePanelContext() {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error(`No Panel context found. Did you forget a Provider?`);
  }
  return context;
}
