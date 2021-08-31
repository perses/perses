import { usePluginRuntime } from '../context/PluginRuntimeContext';

export interface PanelState {
  contentDimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Gets the state of the current panel being rendered.
 */
export function usePanelState(): PanelState {
  return usePluginRuntime('usePanelState')();
}
