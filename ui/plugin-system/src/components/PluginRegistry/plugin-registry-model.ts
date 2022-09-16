// Copyright 2022 The Perses Authors
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

import { JsonObject } from '@perses-dev/core';
import { createContext, useContext } from 'react';
import { PluginImplementation, PluginMetadata, PluginType } from '../../model';

export interface PluginRegistryContextType {
  getPlugin<T extends PluginType>(pluginType: T, kind: string): Promise<PluginImplementation<T, JsonObject>>;
  listPluginMetadata(pluginType: PluginType): Promise<PluginMetadata[]>;
}

export const PluginRegistryContext = createContext<PluginRegistryContextType | undefined>(undefined);

export function usePluginRegistry() {
  const ctx = useContext(PluginRegistryContext);
  if (ctx === undefined) {
    throw new Error('PluginRegistryContext not found. Did you forget a provider?');
  }
  return ctx;
}
