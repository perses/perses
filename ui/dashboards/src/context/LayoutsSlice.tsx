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

import { LayoutDefinition, GridItemDefinition } from '@perses-dev/core';
import produce from 'immer';
import { StateCreator } from 'zustand';
import { useDashboardStore } from './DashboardProvider';

export interface LayoutsSlice {
  updateLayout: (layout: LayoutDefinition, index?: number) => void;
  addItemToLayout: (index: number, item: GridItemDefinition) => void;
}

export const createLayoutsSlice: StateCreator<LayoutsSlice> = (set) => ({
  updateLayout: (layout: LayoutDefinition, index?: number) =>
    set(
      produce((state) => {
        if (index === undefined) {
          state.layouts.unshift(layout);
        } else {
          state.layouts[index] = layout;
        }
      })
    ),
  addItemToLayout: (index: number, item: GridItemDefinition) =>
    set(
      produce((state) => {
        state.layouts[index].spec.items.push(item);
      })
    ),
});

export function useLayouts() {
  return useDashboardStore(({ layouts, updateLayout, addItemToLayout }) => ({
    layouts,
    updateLayout,
    addItemToLayout,
  }));
}
