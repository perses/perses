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
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { createDashboardProviderSpy, getTestDashboard, renderWithContext } from '../../test';
import { DashboardProvider } from '../../context/DashboardProvider';
import { PanelDrawer } from './PanelDrawer';

describe('Panel Drawer', () => {
  const renderPanelDrawer = () => {
    const { store, DashboardProviderSpy } = createDashboardProviderSpy();

    renderWithContext(
      <DashboardProvider initialState={{ dashboardResource: getTestDashboard(), isEditMode: true }}>
        <DashboardProviderSpy />
        <PanelDrawer />
      </DashboardProvider>
    );

    const { value: storeApi } = store;
    if (storeApi === undefined) {
      throw new Error('Expected dashboard store to be set after initial render');
    }

    return storeApi;
  };

  it('should add new panel', async () => {
    const storeApi = renderPanelDrawer();

    // Open the drawer for a new panel
    act(() => storeApi.getState().openAddPanel());

    const nameInput = await screen.findByLabelText(/Name/);
    userEvent.type(nameInput, 'New Panel');
    userEvent.click(screen.getByText('Add'));

    // TODO: Assert drawer is closed?
    const panels = storeApi.getState().panels;
    expect(panels).toMatchObject({
      // Should have the new panel in the store
      NewPanel: {
        kind: 'Panel',
        spec: {
          display: { name: 'New Panel' },
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
    const group = Object.values(storeApi.getState().panelGroups).find((group) => group.title === 'CPU Stats');
    if (group === undefined) {
      throw new Error('Test group not found');
    }
    const layout = Object.entries(group.itemPanelKeys).find(([, panelKey]) => panelKey === 'cpu');
    if (layout === undefined) {
      throw new Error('Test panel not found');
    }
    act(() => storeApi.getState().openEditPanel({ panelGroupId: group.id, panelGroupItemLayoutId: layout[0] }));

    const nameInput = await screen.findByLabelText(/Name/);
    userEvent.clear(nameInput);
    userEvent.type(nameInput, 'cpu usage');
    userEvent.click(screen.getByText('Apply'));

    const panels = storeApi.getState().panels;
    expect(panels).toMatchObject({
      cpu: {
        kind: 'Panel',
        spec: {
          display: { name: 'cpu usage' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {},
          },
        },
      },
    });
  });
});
