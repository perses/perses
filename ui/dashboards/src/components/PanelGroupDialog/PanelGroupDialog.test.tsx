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

import { GridDefinition } from '@perses-dev/core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import produce from 'immer';
import * as dashboardAppSlice from '../../context/DashboardAppSlice';
import * as layoutsSlice from '../../context/LayoutsSlice';
import { renderWithContext } from '../../test';
import testDashboard from '../../test/testDashboard';
import PanelGroupDialog from './PanelGroupDialog';

const dashboardApp = {
  panelDrawer: undefined,
  openPanelDrawer: jest.fn(),
  closePanelDrawer: jest.fn(),
  panelGroupDialog: {
    groupIndex: undefined,
  },
  openPanelGroupDialog: jest.fn(),
  closePanelGroupDialog: jest.fn(),
};

const updateLayout = jest.fn();
jest.spyOn(layoutsSlice, 'useLayouts').mockReturnValue({
  updateLayout,
  addItemToLayout: jest.fn(),
  layouts: testDashboard.spec.layouts,
});

describe('Add Panel Group', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add new panel group', async () => {
    jest.spyOn(dashboardAppSlice, 'useDashboardApp').mockReturnValue(dashboardApp);
    renderWithContext(<PanelGroupDialog />);
    const nameInput = await screen.getByLabelText(/Name/);
    userEvent.type(nameInput, 'New Panel Group');
    userEvent.click(screen.getByText('Add'));
    expect(updateLayout).toHaveBeenCalledWith(
      {
        kind: 'Grid',
        spec: {
          display: {
            title: 'New Panel Group',
            collapse: {
              open: true,
            },
          },
          items: [],
        },
      },
      undefined
    );
  });

  it('should edit existing panel group', async () => {
    jest.spyOn(dashboardAppSlice, 'useDashboardApp').mockReturnValue({
      ...dashboardApp,
      panelGroupDialog: {
        groupIndex: 0,
      },
    });
    renderWithContext(<PanelGroupDialog />);
    const nameInput = await screen.getByLabelText(/Name/);
    userEvent.type(nameInput, 'New Name');
    userEvent.click(screen.getByText('Apply'));
    expect(updateLayout).toHaveBeenCalledWith(
      produce(testDashboard.spec.layouts[0], (draftState: GridDefinition) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        draftState.spec.display!.title += 'New Name';
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        draftState.spec.display!.collapse = { open: false };
      }),
      0
    );
  });
});
