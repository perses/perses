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

import { PluginRegistry } from '@perses-dev/plugin-system';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PanelDefinition } from '@perses-dev/core';
import { renderWithContext, mockPluginRegistryProps, FAKE_PANEL_PLUGIN } from '../../test';
import { Panel, PanelProps } from './Panel';

describe('Panel', () => {
  // Helper to render the panel with some context set
  const renderPanel = (editHandlers?: PanelProps['editHandlers']) => {
    const definition: PanelDefinition = {
      kind: 'Panel',
      spec: {
        display: {
          name: 'Fake Panel Title',
          description: 'This is a fake panel',
        },
        plugin: {
          kind: 'FakePanel',
          spec: {},
        },
      },
    };

    const { addMockPlugin, pluginRegistryProps } = mockPluginRegistryProps();
    addMockPlugin('Panel', 'FakePanel', FAKE_PANEL_PLUGIN);

    renderWithContext(
      <PluginRegistry {...pluginRegistryProps}>
        <Panel definition={definition} editHandlers={editHandlers} />
      </PluginRegistry>
    );
  };

  it('should render name and info icon', async () => {
    renderPanel();

    const panel = screen.getByRole('region', { name: 'Fake Panel Title' });
    expect(panel).toBeInTheDocument();

    // Should diplay header with panel's title
    const header = screen.getByRole('banner', { name: 'Fake Panel Title' });
    expect(header).toHaveTextContent('Fake Panel Title');

    // await screen.findByText('Fake Panel');
    // screen.queryByLabelText('info-tooltip');
  });

  /*
  it('should render edit icons when in edit mode', () => {
    renderPanel(true);
    const panelTitle = screen.getByText('Fake Panel');
    userEvent.hover(panelTitle);
    screen.getByLabelText('drag handle');
    screen.getByLabelText('edit panel');
    screen.getByLabelText('delete panel');
  });
  */
});
