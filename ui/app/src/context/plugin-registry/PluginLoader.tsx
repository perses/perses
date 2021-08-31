import loadable, { LoadableLibrary } from '@loadable/component';
import { PluginModule, PluginResource } from '@perses-ui/core';
import { BUNDLED_PLUGINS } from './bundled-plugins';

type LoadableLibraryProps = React.ComponentProps<LoadableLibrary<PluginModule>>;

interface PluginLoaderProps {
  resource: PluginResource;
}

/**
 * Uses `@loadable/component` to load a plugin library.
 */
export const PluginLoader = loadable.lib(
  (props: PluginLoaderProps) => {
    const bundled = BUNDLED_PLUGINS.get(props.resource);
    if (bundled !== undefined) {
      return bundled.importPluginModule();
    }
    throw new Error(`TODO: Support webpack module federation plugins`);
  },
  {
    cacheKey: (props) => getResourceCacheKey(props.resource),
  }
) as React.ComponentType<LoadableLibraryProps & PluginLoaderProps>;

/**
 * Gets a unique cache key for a plugin resource.
 */
export function getResourceCacheKey(resource: PluginResource) {
  return (
    BUNDLED_PLUGINS.get(resource)?.cacheKey ?? resource.spec.plugin_module_path
  );
}
