import { immer } from 'zustand/middleware/immer';
import { useDashboardStore } from './DashboardProvider';

export interface DashboardAppSlice {
  addPanelComponent: {
    isOpen: boolean;
    groupIndex: number;
    setIsOpen: (isOpen: boolean, groupIndex?: number, panelRef?: string) => void;
    panelRef?: string;
  };
  addGroupComponent: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean, index?: number) => void;
    index?: number;
  };
}

export const createDashboardAppSlice = immer<DashboardAppSlice>((set) => ({
  addPanelComponent: {
    isOpen: false,
    groupIndex: 0,
    setIsOpen: (isOpen: boolean, groupIndex = 0, panelRef?: string) =>
      set((state) => {
        state.addPanelComponent.isOpen = isOpen;
        state.addPanelComponent.groupIndex = groupIndex;
        state.addPanelComponent.panelRef = panelRef;
      }),
  },
  addGroupComponent: {
    isOpen: false,
    isEdit: false,
    setIsOpen: (isOpen: boolean, index?: number) =>
      set((state) => {
        state.addGroupComponent.isOpen = isOpen;
        state.addGroupComponent.index = index;
      }),
  },
}));

export function useDashboardApp() {
  return useDashboardStore(({ addGroupComponent, addPanelComponent }) => ({
    addGroupComponent,
    addPanelComponent,
  }));
}
