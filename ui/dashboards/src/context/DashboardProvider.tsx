import create from 'zustand';
import type { StoreApi } from 'zustand';
import createZustandContext from 'zustand/context';
import produce from 'immer';
import { DashboardSpec, LayoutDefinition, PanelDefinition } from '@perses-dev/core';

interface DashboardState {
  isEditMode: boolean;
  layouts: LayoutDefinition[];
  panels: Record<string, PanelDefinition>;
}

interface DashboardActions {
  setEditMode: (isEditMode: boolean) => void;
  setLayouts: (layouts: LayoutDefinition[]) => void;
  setPanels: (panels: Record<string, PanelDefinition>) => void;
  addPanel: (name: string, panel: PanelDefinition) => void;
}

export type DashboardStoreState = DashboardState & DashboardActions;

interface DashboardProviderProps {
  initialDashboard: DashboardSpec;
  children?: React.ReactNode;
}

const { Provider, useStore } = createZustandContext<StoreApi<DashboardStoreState>>();

export function usePanels() {
  const { panels, addPanel } = useStore(({ panels, addPanel }) => ({ panels, addPanel }));
  return { panels, addPanel };
}

export function useLayouts() {
  const { layouts, setLayouts } = useStore(({ layouts, setLayouts }) => ({ layouts, setLayouts }));
  return { layouts, setLayouts };
}

export function useEditMode() {
  const { isEditMode, setEditMode } = useStore(({ isEditMode, setEditMode }) => ({ isEditMode, setEditMode }));
  return { isEditMode, setEditMode };
}

export function DashboardProvider(props: DashboardProviderProps) {
  const {
    children,
    initialDashboard: { layouts, panels },
  } = props;

  return (
    <Provider
      createStore={() =>
        create((set) => ({
          isEditMode: false,
          layouts,
          panels,
          setEditMode: (isEditMode: boolean) => set({ isEditMode }),
          setLayouts: (layouts: LayoutDefinition[]) => set({ layouts }),
          setPanels: (panels: Record<string, PanelDefinition>) => set({ panels }),
          addPanel: (name: string, panel: PanelDefinition) => {
            set(
              produce((state: DashboardStoreState) => {
                state.panels[name] = panel;
              }, {})
            );
          },
        }))
      }
    >
      {children}
    </Provider>
  );
}
