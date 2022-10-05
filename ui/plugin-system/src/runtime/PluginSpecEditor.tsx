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

import { UnknownSpec } from '@perses-dev/core';
import { OptionsEditorProps, usePlugin } from '@perses-dev/plugin-system';

export interface PluginSpecEditorProps extends OptionsEditorProps<UnknownSpec> {
  pluginType: 'Panel' | 'TimeSeriesQuery';
  pluginKind: string;
}

export function PluginSpecEditor(props: PluginSpecEditorProps) {
  const { pluginType, pluginKind, ...others } = props;
  const { data: plugin, isLoading } = usePlugin(pluginType, pluginKind, {
    useErrorBoundary: true,
    enabled: pluginKind !== '',
  });

  // TODO: Proper loading indicator
  if (isLoading) {
    return null;
  }

  if (plugin === undefined) {
    throw new Error(`Missing OptionsEditorComponent for ${pluginType} plugin with kind '${pluginKind}'`);
  }

  const { OptionsEditorComponent } = plugin;
  return <OptionsEditorComponent {...others} />;
}
