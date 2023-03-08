// Copyright 2023 The Perses Authors
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

import { ErrorAlert, JSONEditor } from '@perses-dev/components';
import { QueryDefinition, UnknownSpec } from '@perses-dev/core';
import { OptionsEditorProps, PanelPlugin, PluginType } from '../model';
import { usePlugin } from '../runtime';
import { OptionsEditorTabsProps, OptionsEditorTabs } from './OptionsEditorTabs';

export interface PluginSpecEditorProps extends OptionsEditorProps<UnknownSpec> {
  pluginType: PluginType;
  pluginKind: string;
  // TO DO: consider removing query editor out of plugin spec so we don't need to pass queries to plugin spec editor
  queries?: QueryDefinition[];
}

export function PluginSpecEditor(props: PluginSpecEditorProps) {
  const { pluginType, pluginKind, queries, ...others } = props;
  const { data: plugin, isLoading, error } = usePlugin(pluginType, pluginKind);

  if (error) {
    return <ErrorAlert error={error} />;
  }

  // TODO: Proper loading indicator
  if (isLoading) {
    return null;
  }

  if (plugin === undefined) {
    throw new Error(`Missing implementation for ${pluginType} plugin with kind '${pluginKind}'`);
  }

  if (pluginType === 'Panel') {
    const { PanelQueryEditorComponent, panelOptionsEditorComponents } = plugin as PanelPlugin;
    let tabs: OptionsEditorTabsProps['tabs'] = [];
    if (PanelQueryEditorComponent !== undefined && queries !== undefined) {
      tabs.push({ label: 'Query', content: <PanelQueryEditorComponent {...others} queries={queries} /> });
    }
    if (panelOptionsEditorComponents !== undefined) {
      tabs = tabs.concat(
        panelOptionsEditorComponents.map(({ label, content: OptionsEditorComponent }) => ({
          label,
          content: <OptionsEditorComponent {...others} />,
        }))
      );
    }

    // always show json editor by default
    tabs.push({ label: 'JSON', content: <JSONEditor {...others} /> });

    return <OptionsEditorTabs tabs={tabs} />;
  }

  const { OptionsEditorComponent } = plugin;

  if (OptionsEditorComponent !== undefined) {
    return <OptionsEditorComponent {...others} />;
  }

  return null;
}
