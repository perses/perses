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

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { createDashboardProviderSpy, getTestDashboard, renderWithContext } from '../../test';
import { DashboardProvider } from '../../context/DashboardProvider';
import { PanelDrawer } from './PanelDrawer';

describe('Panel Drawer', () => {
  const renderPanelDrawer = (defaultPanelKind?: string) => {
    const { store, DashboardProviderSpy } = createDashboardProviderSpy();

    renderWithContext(
      <DashboardProvider initialState={{ dashboardResource: getTestDashboard(), isEditMode: true, defaultPanelKind }}>
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

  it('should not have default selected panel kind if not specified', async () => {
    const storeApi = renderPanelDrawer();

    // Open the drawer for a new panel
    act(() => storeApi.getState().openAddPanel());

    await waitFor(() => {
      const kindButton = screen.getByRole('button', {
        name: 'Type',
      });

      // Remove `&ZeroWidthSpace;` from MUI to text for empty text.
      const normalizedTextContent = kindButton.textContent?.replace(/\u200B/g, '');
      expect(normalizedTextContent).toBe('');
    });
  });

  it('should default selected panel kind when specified', async () => {
    const storeApi = renderPanelDrawer('TimeSeriesChart');

    // Open the drawer for a new panel
    act(() => storeApi.getState().openAddPanel());

    await waitFor(() => {
      const kindButton = screen.getByRole('button', {
        name: 'Type',
      });
      expect(kindButton).toHaveTextContent('TimeSeriesChart');
    });
  });

  it('should add panel with duplicate panel name', async () => {
    const storeApi = renderPanelDrawer();

    act(() => storeApi.getState().openAddPanel());

    const nameInput = await screen.findByLabelText(/Name/);
    userEvent.type(nameInput, 'cpu');
    userEvent.click(screen.getByText('Add'));

    const panels = storeApi.getState().panels;
    expect(panels).toMatchObject({
      // make sure we don't have duplicate panel key by appending "-1"
      'cpu-1': {
        kind: 'Panel',
        spec: {
          display: { name: 'cpu' },
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
