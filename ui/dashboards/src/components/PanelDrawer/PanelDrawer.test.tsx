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
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import {
  createDashboardProviderSpy,
  FAKE_PANEL_PLUGIN,
  getTestDashboard,
  mockPluginRegistryProps,
  renderWithContext,
} from '../../test';
import { DashboardProvider } from '../../context/DashboardProvider';
import PanelDrawer from './PanelDrawer';

describe('Panel Drawer', () => {
  const renderPanelDrawer = () => {
    const { addMockPlugin, pluginRegistryProps } = mockPluginRegistryProps();
    addMockPlugin('Panel', 'LineChart', FAKE_PANEL_PLUGIN);

    const { store, DashboardProviderSpy } = createDashboardProviderSpy();

    renderWithContext(
      <PluginRegistry {...pluginRegistryProps}>
        <DashboardProvider initialState={{ dashboardSpec: getTestDashboard().spec, isEditMode: true }}>
          <DashboardProviderSpy />
          <PanelDrawer />
        </DashboardProvider>
      </PluginRegistry>
    );

    const { value: storeApi } = store;
    if (storeApi === undefined) {
      throw new Error('Expected dashboard store to be set after initial render');
    }

    return storeApi;
  };

  it('should add new panel', async () => {
    const storeApi = renderPanelDrawer();

    // Open the drawer for a new panel (i.e. no panel key)
    act(() => storeApi.getState().openPanelDrawer({ groupIndex: 0 }));

    const nameInput = await screen.findByLabelText(/Panel Name/);
    userEvent.type(nameInput, 'New Panel');
    userEvent.click(screen.getByText('Add'));

    // TODO: Assert drawer is closed?
    const panels = storeApi.getState().panels;
    expect(panels).toMatchObject({
      // Should have the new panel in the store
      NewPanel: {
        kind: 'Panel',
        spec: {
          display: { name: 'New Panel', description: '' },
          plugin: {
            kind: '',
            spec: {},
          },
        },
      },
    });
  });

  it('should edit an existing panel', async () => {
    const storeApi = renderPanelDrawer();

    // Open the drawer for an existing panel
    act(() => storeApi.getState().openPanelDrawer({ groupIndex: 0, panelKey: 'cpu' }));

    const nameInput = await screen.findByLabelText(/Panel Name/);
    userEvent.clear(nameInput);
    userEvent.type(nameInput, 'cpu usage');
    userEvent.click(screen.getByText('Apply'));

    const panels = storeApi.getState().panels;
    expect(panels).toMatchObject({
      cpu: {
        kind: 'Panel',
        spec: {
          display: { name: 'cpu usage', description: '' },
          plugin: {
            kind: 'LineChart',
            spec: {},
          },
        },
      },
    });
  });
});
