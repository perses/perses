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
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { DashboardProvider } from '../../context';
import { createDashboardProviderSpy, getTestDashboard, renderWithContext } from '../../test';
import { PanelGroupDialog } from './PanelGroupDialog';

describe('Add Panel Group', () => {
  const renderDialog = () => {
    const { store, DashboardProviderSpy } = createDashboardProviderSpy();

    renderWithContext(
      <DashboardProvider initialState={{ dashboardResource: getTestDashboard(), isEditMode: true }}>
        <DashboardProviderSpy />
        <PanelGroupDialog />
      </DashboardProvider>
    );

    const { value: storeApi } = store;
    if (storeApi === undefined) {
      throw new Error('Expected dashboard store to be set after initial render');
    }

    return storeApi;
  };

  it('should add new panel group', async () => {
    const storeApi = renderDialog();

    // Open the dialog for a new panel group
    act(() => storeApi.getState().openAddPanelGroup());

    const nameInput = await screen.findByLabelText(/Name/);
    userEvent.type(nameInput, 'New Panel Group');
    userEvent.click(screen.getByText('Add'));

    // TODO: Figure out how to test this without coupling to the store state
    const panelGroups = Object.values(storeApi.getState().panelGroups);
    expect(panelGroups).toContainEqual({
      id: expect.any(Number),
      title: 'New Panel Group',
      isCollapsed: false,
      itemLayouts: expect.any(Array),
      itemPanelKeys: expect.any(Object),
    });
  });

  it('should edit existing panel group', async () => {
    const storeApi = renderDialog();

    // Open the dialog for an existing panel group
    const group = Object.values(storeApi.getState().panelGroups).find((group) => group.title === 'CPU Stats');
    if (group === undefined) {
      throw new Error('Missing test group');
    }
    act(() => storeApi.getState().openEditPanelGroup(group.id));

    const nameInput = await screen.findByLabelText(/Name/);
    userEvent.clear(nameInput);
    userEvent.type(nameInput, 'New Name');
    userEvent.click(screen.getByText('Apply'));

    // TODO: Figure out how to test this without coupling to the store state
    const panelGroups = storeApi.getState().panelGroups;
    expect(panelGroups).toMatchObject({
      [group.id]: {
        id: group.id,
        title: 'New Name',
        isCollapsed: false,
      },
    });
  });
});
