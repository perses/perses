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
import { DashboardProvider, QueryStringProvider, TemplateVariableProvider, TimeRangeProvider } from '../../../context';
import { getTestDashboard, renderWithContext } from '../../../test';
import { DashboardApp } from '../DashboardApp';

describe('Panel Groups', () => {
  const renderDashboard = () => {
    renderWithContext(
      <QueryStringProvider queryString={new URLSearchParams('https://localhost:3000/')}>
        <TimeRangeProvider initialTimeRange={{ pastDuration: '30m' }}>
          <TemplateVariableProvider>
            <DashboardProvider initialState={{ dashboardSpec: getTestDashboard().spec, isEditMode: true }}>
              <DashboardApp dashboardResource={getTestDashboard()} />
            </DashboardProvider>
          </TemplateVariableProvider>
        </TimeRangeProvider>
      </QueryStringProvider>
    );
  };

  it('should delete panel', () => {
    renderDashboard();
    const panel = screen.getByText('CPU');
    userEvent.hover(panel);
    const deletePanelButton = screen.getByLabelText('delete panel');
    userEvent.click(deletePanelButton);
    screen.getByText('Delete Panel');
    const deleteButton = screen.getByText('Delete');
    userEvent.click(deleteButton);

    // The panel should disappear
    const deletedPanel = screen.queryByText('CPU');
    expect(deletedPanel).not.toBeInTheDocument();
  });

  it('should only delete panel from panel group if panel is not referenced more than once', () => {
    renderDashboard();

    const panels = screen.getAllByText('Disk I/O Utilization');
    expect(panels).toHaveLength(2);

    const panel = panels[0];
    if (panel === undefined) throw new Error('Missing panel');

    userEvent.hover(panel);
    const deletePanelButton = screen.getByLabelText('delete panel');
    userEvent.click(deletePanelButton);
    screen.getByText('Delete Panel');
    const deleteButton = screen.getByText('Delete');
    userEvent.click(deleteButton);

    // The deleted panel should still be on screen in the other group
    const deletedPanel = screen.queryByText('Disk I/O Utilization');
    expect(deletedPanel).toBeInTheDocument();
  });

  it('should swap panels', () => {
    renderDashboard();

    // should move panel down
    const group1 = screen.getByText('CPU Stats');
    userEvent.hover(group1);
    const moveGroupDownBtn = screen.getByLabelText('move group down');
    userEvent.click(moveGroupDownBtn);
    userEvent.unhover(moveGroupDownBtn);

    // should move panel up
    const group2 = screen.getByText('Disk Stats');
    userEvent.hover(group2);
    const moveGroupUpBtn = screen.getByLabelText('move group up');
    userEvent.click(moveGroupUpBtn);

    /* TODO: Figure out how to test this visually without coupling to the store
    const layouts = storeApi.getState().layouts;
    expect(layouts[0]?.title).toBe(undefined);
    expect(layouts[1]?.title).toBe('Disk Stats');
    expect(layouts[2]?.title).toBe('CPU Stats');
    */
  });

  it('should delete a panel group', () => {
    renderDashboard();
    const group = screen.getByText('CPU Stats');
    userEvent.hover(group);
    const deleteGroupIcon = screen.getByLabelText('delete group');
    userEvent.click(deleteGroupIcon);
    screen.getByText('Delete Panel Group');
    const deleteButton = screen.getByText('Delete');
    userEvent.click(deleteButton);

    // should remove group
    const deletedGroup = screen.queryByText('CPU Stats');
    expect(deletedGroup).not.toBeInTheDocument();

    // CPU panel should be completely gone since it wasn't in any other group
    let panel = screen.queryByText('CPU');
    expect(panel).not.toBeInTheDocument();

    // A DiskIO panel should still be present in the other group that wasn't deleted
    panel = screen.queryByText('Disk I/O Utilization');
    expect(panel).toBeInTheDocument();
  });
});
