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
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PanelDefinition } from '@perses-dev/core';
import { renderWithContext, mockPluginRegistryProps, FAKE_PANEL_PLUGIN } from '../../test';
import { Panel, PanelProps } from './Panel';

describe('Panel', () => {
  const createTestPanel = (): PanelDefinition => ({
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
  });

  // Helper to render the panel with some context set
  const renderPanel = (definition?: PanelDefinition, editHandlers?: PanelProps['editHandlers']) => {
    definition ??= createTestPanel();

    const { addMockPlugin, pluginRegistryProps } = mockPluginRegistryProps();
    addMockPlugin('Panel', 'FakePanel', FAKE_PANEL_PLUGIN);

    renderWithContext(
      <PluginRegistry {...pluginRegistryProps}>
        <Panel definition={definition} editHandlers={editHandlers} />
      </PluginRegistry>
    );
  };

  // Helper to get the panel once rendered
  const getPanel = () => screen.getByRole('region', { name: 'Fake Panel Title' });

  it('should render panel', async () => {
    renderPanel();

    const panel = getPanel();
    expect(panel).toBeInTheDocument();

    // Should diplay header with panel's title
    const header = screen.getByRole('banner');
    expect(header).toHaveTextContent('Fake Panel Title');

    // Should display chart's content from the fake panel plugin
    const content = screen.getByRole('figure');
    await waitFor(() => {
      expect(content).toHaveTextContent('FakePanel chart');
    });
    expect(content);
  });

  it('shows panel description', async () => {
    renderPanel();

    const panel = getPanel();

    // Description button should not be visible until hover on panel
    const missingButton = screen.queryByRole('button', { name: /description/i });
    expect(missingButton).not.toBeInTheDocument();
    userEvent.hover(panel);
    const descriptionButton = screen.getByRole('button', { name: /description/i });
    expect(descriptionButton).toBeInTheDocument();

    // Can hover to see panel description in tooltip
    userEvent.hover(descriptionButton);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('This is a fake panel');
  });

  it('does not show description when panel does not have one', () => {
    // Render a panel without a description set
    const withoutDescription = createTestPanel();
    withoutDescription.spec.display.description = undefined;
    renderPanel(withoutDescription);

    const panel = getPanel();
    userEvent.hover(panel);
    const descriptionButton = screen.queryByRole('button', { name: /description/i });
    expect(descriptionButton).not.toBeInTheDocument();
  });

  it('does not show description in edit mode', () => {
    renderPanel(undefined, { onEditPanelClick: jest.fn(), onDeletePanelClick: jest.fn() });

    const panel = getPanel();
    userEvent.hover(panel);
    const descriptionButton = screen.queryByRole('button', { name: /description/i });
    expect(descriptionButton).not.toBeInTheDocument();
  });

  it('can trigger panel actions in edit mode', () => {
    const onEditPanelClick = jest.fn();
    const onDeletePanelClick = jest.fn();
    renderPanel(undefined, { onEditPanelClick, onDeletePanelClick });

    const panel = getPanel();
    userEvent.hover(panel);

    const editButton = screen.getByRole('button', { name: /edit/i });
    userEvent.click(editButton);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    userEvent.click(deleteButton);

    expect(onEditPanelClick).toHaveBeenCalledTimes(1);
    expect(onDeletePanelClick).toHaveBeenCalledTimes(1);
  });
});
