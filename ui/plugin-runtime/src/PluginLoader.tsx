/* eslint-disable @typescript-eslint/ban-ts-comment */
// Copyright 2024 The Perses Authors
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

import { useEffect, useRef, useState } from 'react';
import { PersesPlugin, PersesPluginModule } from './PersesPlugin.types';
import { usePluginRuntime } from './PluginRuntime';

interface PluginLoaderProps<P> {
  plugin: PersesPlugin;
  props?: P;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function PluginContainer<P>({ pluginFn, props }: { pluginFn: Function; props: P }) {
  return pluginFn(props);
}

export function PluginLoader<P>({ plugin, props }: PluginLoaderProps<P>) {
  const { load } = usePluginRuntime({ moduleName: plugin.moduleName, baseURL: plugin.baseURL });
  const [pluginModule, setPluginModule] = useState<PersesPluginModule | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const name = `${plugin.name}-${plugin.moduleName}`;
  const previousPluginName = useRef<string>(name);

  useEffect(() => {
    previousPluginName.current = name;
    setError(null);

    load(plugin.name)
      .then((module) => {
        setPluginModule(module);
      })
      .catch((error) => {
        setPluginModule(null);
        console.error(`PluginLoader: Error loading plugin ${plugin.name}:`, error);
        setError(new Error(`PluginLoader: Error loading plugin ${plugin.name}`));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  if (error) {
    throw error;
  }

  if (!pluginModule) {
    return null;
  }

  if (!pluginModule.default) {
    throw new Error('PluginLoader: Plugin module does not have a default export');
  }

  if (typeof pluginModule.default !== 'function') {
    throw new Error('PluginLoader: Plugin module default export is not a function');
  }

  // make sure to re mount the plugin when changes, to avoid mismatch in hooks ordering when re rendering
  if (previousPluginName.current !== name) {
    return null;
  }

  return <PluginContainer key={name} pluginFn={pluginModule.default} props={props} />;
}
