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

import { screen } from '@testing-library/react';
import { renderWithContext } from '../test';
import { PluginSpecEditor, PluginSpecEditorProps } from './PluginSpecEditor';

describe('PluginSpecEditor', () => {
  const renderComponent = (props: PluginSpecEditorProps) => {
    renderWithContext(<PluginSpecEditor {...props} />);
  };

  it('shows the options editor component for a plugin', async () => {
    renderComponent({ pluginType: 'Panel', pluginKind: 'BertPanel1', value: {}, onChange: jest.fn() });
    const editor = await screen.findByText('BertPanel1 editor');
    expect(editor).toBeInTheDocument();
  });

  it('shows an error if plugin fails to load', async () => {
    renderComponent({ pluginType: 'Variable', pluginKind: 'DoesNotExist', value: {}, onChange: jest.fn() });
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(/doesnotexist/i);
  });
});
