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
import * as dashboardAppSlice from '../../context/DashboardAppSlice';
import * as layoutsSlice from '../../context/LayoutsSlice';
import * as context from '../../context/DashboardProvider';
import { DashboardStoreProps } from '../../context';
import { renderWithContext } from '../../test';
import testDashboard from '../../test/testDashboard';
import PanelDrawer from './PanelDrawer';

const updatePanel = jest.fn();
jest.spyOn(context, 'usePanels').mockReturnValue({
  updatePanel,
  panels: {},
});

const addItemToLayout = jest.fn();
jest.spyOn(layoutsSlice, 'useLayouts').mockReturnValue({
  addItemToLayout,
  updateLayout: jest.fn(),
  layouts: testDashboard.spec.layouts,
});

const dashboardApp = {
  panelDrawer: undefined,
  openPanelDrawer: jest.fn(),
  closePanelDrawer: jest.fn(),
  panelGroupDialog: undefined,
  openPanelGroupDialog: jest.fn(),
  closePanelGroupDialog: jest.fn(),
};

describe('Add Panel', () => {
  let initialState: DashboardStoreProps;
  beforeEach(() => {
    initialState = {
      isEditMode: true,
      dashboardSpec: testDashboard.spec,
    };
    jest.clearAllMocks();
  });
  it('should add new panel', async () => {
    jest.spyOn(dashboardAppSlice, 'useDashboardApp').mockReturnValue(dashboardApp);
    renderWithContext(<PanelDrawer />, undefined, initialState);
    const nameInput = await screen.getByLabelText(/Panel Name/);
    userEvent.type(nameInput, 'New Panel');
    userEvent.click(screen.getByText('Add'));
    expect(updatePanel).toHaveBeenCalledWith('NewPanel', {
      kind: 'EmptyChart',
      display: { name: 'New Panel', description: '' },
      options: {},
    });
    expect(addItemToLayout).toHaveBeenCalledWith(0, {
      x: 0,
      y: 1,
      width: 12,
      height: 6,
      content: { $ref: `#/spec/panels/NewPanel` },
    });
  });

  it('should edit an existing panel', async () => {
    jest.spyOn(dashboardAppSlice, 'useDashboardApp').mockReturnValue({
      ...dashboardApp,
      panelDrawer: {
        groupIndex: 0,
        panelRef: 'cpu',
      },
    });
    renderWithContext(<PanelDrawer />, undefined, initialState);
    const nameInput = await screen.getByLabelText(/Panel Name/);
    userEvent.type(nameInput, 'cpu usage');
    userEvent.click(screen.getByText('Apply'));
    expect(updatePanel).toHaveBeenCalledWith('cpu', {
      display: { name: 'cpu usage', description: '' },
    });
  });
});
