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
import { UnknownSpec } from '@perses-dev/core';
import { OptionsEditorProps, PanelPlugin, PluginType } from '../model';
import { usePlugin } from '../runtime';
import { OptionsEditorTabsProps, OptionsEditorTabs } from './OptionsEditorTabs';

export interface PluginSpecEditorProps extends OptionsEditorProps<UnknownSpec> {
  pluginType: PluginType;
  pluginKind: string;
}

export function PluginSpecEditor(props: PluginSpecEditorProps) {
  const { pluginType, pluginKind, ...others } = props;
  const { data: plugin, isLoading, error } = usePlugin(pluginType, pluginKind);

  if (error) {
    return <ErrorAlert error={error} />;
  }

  // TODO: Proper loading indicator
  if (isLoading) {
    return null;
  }

  if (plugin === undefined) {
    throw new Error(`Missing OptionsEditorComponent for ${pluginType} plugin with kind '${pluginKind}'`);
  }

  if (`${pluginType}` === 'Panel') {
    const { PanelQueryEditorComponent, panelOptionsEditorComponents } = plugin as unknown as PanelPlugin;
    let tabs: OptionsEditorTabsProps['tabs'] = [];
    if (PanelQueryEditorComponent !== undefined) {
      tabs.push({ id: 'query', label: 'Query', content: <PanelQueryEditorComponent {...others} /> });
    }

    if (panelOptionsEditorComponents !== undefined) {
      tabs = tabs.concat(
        panelOptionsEditorComponents.map(({ id, label, content: OptionsEditorComponent }) => ({
          id,
          label,
          content: <OptionsEditorComponent {...others} />,
        }))
      );
    }

    tabs.push({ id: 'json', label: 'JSON', content: <JSONEditor {...others} /> });

    return <OptionsEditorTabs tabs={tabs} />;
  }

  const { OptionsEditorComponent } = plugin;

  if (OptionsEditorComponent !== undefined) {
    return <OptionsEditorComponent {...others} />;
  }

  return null;
}
