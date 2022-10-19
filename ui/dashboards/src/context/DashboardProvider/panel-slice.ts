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

import { PanelDefinition } from '@perses-dev/core';
import { StateCreator } from 'zustand';
import { Middleware } from './common';

/**
 * Slice with the state of Panels, along with any actions that modify only the Panels state.
 */
export interface PanelSlice {
  panels: Record<string, PanelDefinition>;
  previousPanels: Record<string, PanelDefinition>;

  /**
   * Reset panels to previous state
   */
  resetPanels: () => void;

  /**
   * Save panels
   */
  savePanels: () => void;
}

/**
 * Curried function for creating the PanelSlice.
 */
export function createPanelSlice(panels: PanelSlice['panels']): StateCreator<PanelSlice, Middleware, [], PanelSlice> {
  return (set) => ({
    panels,
    previousPanels: panels,

    resetPanels() {
      set((state) => {
        state.panels = state.previousPanels;
      });
    },

    savePanels() {
      set((state) => {
        state.previousPanels = state.panels;
      });
    },
  });
}
