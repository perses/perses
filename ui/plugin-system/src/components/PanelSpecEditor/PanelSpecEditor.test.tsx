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

import { screen } from '@testing-library/react';
import { renderWithContext } from '../../test';
import { PanelSpecEditor, PanelSpecEditorProps } from './PanelSpecEditor';

describe('PanelSpecEditor', () => {
  const renderComponent = (props: PanelSpecEditorProps) => {
    renderWithContext(<PanelSpecEditor {...props} />);
  };

  it('should show query, options and json editors', async () => {
    renderComponent({
      panelDefinition: {
        kind: 'Panel',
        spec: {
          display: { name: 'Single Query', description: 'This is a panel rendering a time series chart' },
          plugin: {
            kind: 'BertPanel1',
            spec: {},
          },
          queries: [],
        },
      },
      onQueriesChange: jest.fn(),
      onPluginSpecChange: jest.fn(),
      onJSONChange: jest.fn(),
    });
    const queryEditor = await screen.findByLabelText('Query');
    expect(queryEditor).toBeInTheDocument();
    const editor = await screen.findByLabelText('Editor');
    expect(editor).toBeInTheDocument();
    const jsonEditor = await screen.findByLabelText('JSON');
    expect(jsonEditor).toBeInTheDocument();
  });

  it('should hide query editor if hideQueryEditor is true', async () => {
    renderComponent({
      panelDefinition: {
        kind: 'Panel',
        spec: {
          display: { name: 'Single Query', description: 'This is a panel rendering a time series chart' },
          plugin: {
            kind: 'BertPanel2',
            spec: {},
          },
          queries: [],
        },
      },
      onQueriesChange: jest.fn(),
      onPluginSpecChange: jest.fn(),
      onJSONChange: jest.fn(),
    });

    const queryEditor = await screen.queryByLabelText('Query');
    expect(queryEditor).not.toBeInTheDocument();
    const settings = await screen.findByLabelText('Settings');
    expect(settings).toBeInTheDocument();
    const jsonEditor = await screen.findByLabelText('JSON');
    expect(jsonEditor).toBeInTheDocument();
  });
});
