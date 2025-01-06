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
import { PersesPlugin, RemotePluginModule } from './PersesPlugin.types';
import { usePluginRuntime } from './PluginRuntime';

interface PluginLoaderProps<P> {
  plugin: PersesPlugin;
  props?: P;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function PluginContainer<P>({ pluginFn, props }: { pluginFn: Function; props: P }): JSX.Element {
  return pluginFn(props);
}

export function PluginLoader<P>({ plugin, props }: PluginLoaderProps<P>): JSX.Element | null {
  const { loadPlugin } = usePluginRuntime({ plugin });
  const [pluginModule, setPluginModule] = useState<RemotePluginModule | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const name = `${plugin.moduleName}-${plugin.name}`;
  const previousPluginName = useRef<string>(name);

  useEffect(() => {
    previousPluginName.current = name;
    setError(null);

    loadPlugin()
      .then((module) => {
        setPluginModule(module);
      })
      .catch((error) => {
        setPluginModule(null);
        console.error(`PluginLoader: Error loading plugin ${plugin.name} from module ${plugin.moduleName}:`, error);
        setError(new Error(`PluginLoader: Error loading plugin ${plugin.name} from module ${plugin.moduleName}`));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  if (error) {
    throw error;
  }

  if (!pluginModule) {
    return null;
  }

  const pluginFunction = pluginModule[plugin.name];

  if (!pluginFunction) {
    throw new Error(`PluginLoader: Plugin module does not have a ${plugin.name} export`);
  }

  if (typeof pluginFunction !== 'function') {
    throw new Error(`PluginLoader: Plugin ${plugin.name} export is not a function`);
  }

  // make sure to re mount the plugin when changes, to avoid mismatch in hooks ordering when re rendering
  if (previousPluginName.current !== name) {
    return null;
  }

  return <PluginContainer key={name} pluginFn={pluginFunction} props={props} />;
}
