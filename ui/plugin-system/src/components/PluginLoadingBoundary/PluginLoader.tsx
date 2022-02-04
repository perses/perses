// Copyright 2021 The Perses Authors
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

import { useQuery } from 'react-query';
import { PluginType } from '../../model';
import { usePluginRegistry } from '../PluginRegistry';

export interface PluginLoaderProps {
  pluginType: PluginType;
  kind: string;
}

/**
 * Uses the PluginRegistry to load the specified plugin and throws any errors
 * encountered while loading.
 */
export function PluginLoader(props: PluginLoaderProps) {
  const { pluginType, kind } = props;

  // Load the plugin and throw any loading/not found errors
  const { loadPlugin } = usePluginRegistry();
  const { error } = useQuery(`PluginLoader:${pluginType}_${kind}`, () => loadPlugin(pluginType, kind));
  if (error !== undefined && error !== null) {
    throw error;
  }

  return null;
}
