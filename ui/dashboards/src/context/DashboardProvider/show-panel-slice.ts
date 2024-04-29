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

import { StateCreator } from 'zustand';
import { PanelGroupItemId } from '@perses-dev/dashboards';
import { Middleware } from './common';

/**
 * Slice that handles duplicating Panels.
 */
export interface ShowPanelSlice {
  showPanel?: ShowPanelState;
  setShowPanel: (panelGroupItemId?: PanelGroupItemId) => void;
}

export interface ShowPanelState {
  panelGroupItemId?: PanelGroupItemId;
}

/**
 * Curried function for viewing panel full screen.
 */
export function createShowPanelSlice(
  showPanelRef?: string
): StateCreator<ShowPanelSlice, Middleware, [], ShowPanelSlice> {
  return (set) => ({
    setShowPanel(panelGroupItemId?: PanelGroupItemId) {
      set((state) => {
        state.showPanel = {
          panelGroupItemId: panelGroupItemId,
        };
      });
    },
  });
}
