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

import { useMemo } from 'react';
import { usePlugin } from '@perses-dev/plugin-system';
import { useImmer } from 'use-immer';

/**
 * Manages panel plugin spec state. The spec will be undefined while a plugin is being loaded.
 */
export function usePanelSpecState(panelPluginKind: string, initialState: unknown) {
  // Keeping track of spec values by kind allows users to switch between panel types and come back with their old
  // values intact from before the switch
  const [specByKind, setSpecByKind] = useImmer<Record<string, unknown>>({ [panelPluginKind]: initialState });
  const { data: plugin } = usePlugin('Panel', panelPluginKind, { enabled: panelPluginKind !== '' });
  const pluginInitialSpec = useMemo(() => plugin?.createInitialOptions(), [plugin]);

  // Use the value in specByKind or if unset, use the initial values from the plugin (which could still be undefined)
  const spec = specByKind[panelPluginKind] ?? pluginInitialSpec;

  // TODO: Do we want to expose more of a immer style API to plugin authors for managing their state, rather than the
  // current "onChange" API?
  const onSpecChange = (next: unknown) => {
    setSpecByKind((draft) => {
      draft[panelPluginKind] = next;
    });
  };

  return {
    spec,
    onSpecChange,
  };
}
