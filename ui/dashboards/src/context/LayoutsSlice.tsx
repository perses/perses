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
