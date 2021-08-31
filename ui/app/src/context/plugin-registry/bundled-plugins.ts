import { PluginModule, PluginResource } from '@perses-ui/core';

// Eagerly load the metadata for the bundled plugins, but lazy-load the plugins
import prometheusPackage from '@perses-ui/prometheus-plugin/package.json';
import panelsPackage from '@perses-ui/panels-plugin/package.json';

export interface BundledPlugin {
  cacheKey: string;
  importPluginModule: () => Promise<PluginModule>;
}

/**
 * Plugins that are bundled with the app via code-splitting.
 */
export const BUNDLED_PLUGINS = new Map<PluginResource, BundledPlugin>();
BUNDLED_PLUGINS.set(prometheusPackage.perses as PluginResource, {
  cacheKey: 'prometheus-plugin',
  importPluginModule: () => import('@perses-ui/prometheus-plugin'),
});
BUNDLED_PLUGINS.set(panelsPackage.perses as PluginResource, {
  cacheKey: 'panels-plugin',
  importPluginModule: () => import('@perses-ui/panels-plugin'),
});
