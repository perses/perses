import { useEffect } from 'react';
import {
  AnyChartQueryDefinition,
  AnyPanelDefinition,
  AnyVariableDefinition,
  PluginType,
  AnyPluginDefinition,
  AnyPluginImplementation,
} from '@perses-ui/core';
import { usePluginLoadingBoundary } from './PluginLoadingBoundary';
import { usePluginRegistry } from './PluginRegistry';

/**
 * Gets variable options supplied from a variable plugin.
 */
export function useVariableOptions(definition: AnyVariableDefinition) {
  const plugin = usePlugin('Variable', definition);
  if (plugin === undefined) {
    // Provide default values while the plugin is being loaded
    return { data: [], loading: true };
  }
  return plugin.useVariableOptions(definition);
}

/**
 * Gets the Panel component from a panel plugin.
 */
export function usePanelComponent(definition: AnyPanelDefinition) {
  const plugin = usePlugin('Panel', definition);
  if (plugin === undefined) {
    // Default values while plugin is being loaded
    return () => null;
  }
  return plugin.PanelComponent;
}

export function useChartQuery(definition: AnyChartQueryDefinition) {
  const plugin = usePlugin('ChartQuery', definition);
  if (plugin === undefined) {
    // Provide default values while the plugin is being loaded
    return { data: [], loading: true };
  }
  return plugin.useChartQuery(definition);
}

// Generic usePlugin that will register the dependency with the loading boundary
// and get the plugin if it's already loaded
function usePlugin<Type extends PluginType>(
  pluginType: Type,
  definition: AnyPluginDefinition<Type>
): AnyPluginImplementation<Type> | undefined {
  // Tell the loading boundary about the dependency
  const { registerPluginDependency } = usePluginLoadingBoundary();
  useEffect(() => {
    registerPluginDependency(pluginType, definition.kind);
  }, [pluginType, definition.kind, registerPluginDependency]);

  // Get the plugin, which could be undefined if it hasn't loaded yet
  const { plugins } = usePluginRegistry();
  return plugins[pluginType].get(definition.kind);
}
