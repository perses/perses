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
import 'intersection-observer'; // TODO: Why do we need this side-effect? Should it be in test setup somewhere?
import { screen } from '@testing-library/react';
import { renderWithContext, mockPluginRegistryProps, FAKE_PANEL_PLUGIN, getTestDashboard } from '../../test';
import { DashboardProvider } from '../../context';
import { Panel, PanelProps } from './Panel';

describe('Panel', () => {
  // Helper to create panel props for rendering tests
  const createPanelProps = (): PanelProps => {
    return {
      definition: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Fake Panel',
            description: 'This is a fake panel',
          },
          plugin: {
            kind: 'FakePanel',
            spec: {},
          },
        },
      },
      groupIndex: 0,
      panelKey: 'panelRef',
    };
  };

  // Helper to render the panel with some context set
  const renderPanel = (isEditMode = false) => {
    const { addMockPlugin, pluginRegistryProps } = mockPluginRegistryProps();
    addMockPlugin('Panel', 'FakePanel', FAKE_PANEL_PLUGIN);

    renderWithContext(
      <PluginRegistry {...pluginRegistryProps}>
        <DashboardProvider initialState={{ dashboardSpec: getTestDashboard().spec, isEditMode }}>
          <Panel {...createPanelProps()} />
        </DashboardProvider>
      </PluginRegistry>
    );
  };

  it('should render name and info icon', async () => {
    renderPanel();
    await screen.findByText('Fake Panel');
    screen.queryByLabelText('info-tooltip');
  });

  it('should render edit icons when in edit mode', () => {
    renderPanel(true);
    screen.queryByLabelText('drag handle');
    screen.queryByLabelText('edit panel');
    screen.queryByLabelText('more');
  });
});
