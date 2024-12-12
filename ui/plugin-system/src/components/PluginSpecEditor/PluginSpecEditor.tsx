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

import { ErrorAlert } from '@perses-dev/components';
import { UnknownSpec } from '@perses-dev/core';
import { ReactElement } from 'react';
import { OptionsEditorProps } from '../../model';
import { usePlugin } from '../../runtime';
import { PluginEditorSelection } from '../PluginEditor';

export interface PluginSpecEditorProps extends OptionsEditorProps<UnknownSpec> {
  pluginSelection: PluginEditorSelection;
  isEditor?: boolean;
}

export function PluginSpecEditor(props: PluginSpecEditorProps): ReactElement | null {
  const {
    pluginSelection: { type: pluginType, kind: pluginKind },
    ...others
  } = props;
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
    throw new Error('This editor should not be used for panel type. Please use Panel Spec Editor instead.');
  }

  const { OptionsEditorComponent } = plugin;

  if (OptionsEditorComponent !== undefined) {
    return <OptionsEditorComponent {...others} />;
  }

  return null;
}
