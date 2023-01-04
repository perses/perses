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
import { TimeRangeProvider } from '@perses-dev/plugin-system';
import { DashboardProvider, TemplateVariableProvider } from '../../../context';
import { getTestDashboard, renderWithContext } from '../../../test';
import { DashboardApp } from '../DashboardApp';

describe('Panel Groups', () => {
  const renderDashboard = () => {
    renderWithContext(
      <TimeRangeProvider initialTimeRange={{ pastDuration: '30m' }}>
        <TemplateVariableProvider>
          <DashboardProvider initialState={{ dashboardResource: getTestDashboard(), isEditMode: true }}>
            <DashboardApp dashboardResource={getTestDashboard()} isReadonly={false} />
          </DashboardProvider>
        </TemplateVariableProvider>
      </TimeRangeProvider>
    );
  };
  it('should delete panel', () => {
    renderDashboard();
    const panelTitle = 'CPU';
    const deletePanelButton = screen.getByLabelText(`delete panel ${panelTitle}`);
    userEvent.click(deletePanelButton);
    screen.getByText('Delete Panel');
    const deleteButton = screen.getByText('Delete');
    userEvent.click(deleteButton);

    // The panel should disappear
    const deletedPanel = screen.queryByText(panelTitle);
    expect(deletedPanel).not.toBeInTheDocument();
  });

  it('should only delete panel from panel group if panel is not referenced more than once', () => {
    renderDashboard();

    const panelTitle = 'Disk I/O Utilization';
    const panels = screen.getAllByText(panelTitle);
    expect(panels).toHaveLength(2);

    const deletePanelButton = screen.getAllByLabelText(`delete panel ${panelTitle}`)[0];
    if (deletePanelButton === undefined) throw new Error('Missing delete button');

    userEvent.click(deletePanelButton);
    screen.getByText('Delete Panel');
    const deleteButton = screen.getByText('Delete');
    userEvent.click(deleteButton);

    // The deleted panel should still be on screen in the other group
    const deletedPanel = screen.queryByText(panelTitle);
    expect(deletedPanel).toBeInTheDocument();
  });

  it('should swap panels', () => {
    renderDashboard();

    // should move panel down
    const groupTitle1 = 'CPU Stats';
    const moveGroupDownBtn = screen.getByLabelText(`move group ${groupTitle1} down`);
    userEvent.click(moveGroupDownBtn);

    // should move panel up
    const groupTitle2 = 'Disk Stats';
    const moveGroupUpBtn = screen.getByLabelText(`move group ${groupTitle2} up`);
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
    const groupTitle = 'CPU Stats';
    const deleteGroupIcon = screen.getByLabelText(`delete group ${groupTitle}`);
    userEvent.click(deleteGroupIcon);
    screen.getByText('Delete Panel Group');
    const deleteButton = screen.getByText('Delete');
    userEvent.click(deleteButton);

    // should remove group
    const deletedGroup = screen.queryByText(groupTitle);
    expect(deletedGroup).not.toBeInTheDocument();

    // CPU panel should be completely gone since it wasn't in any other group
    let panel = screen.queryByText('CPU');
    expect(panel).not.toBeInTheDocument();

    // A DiskIO panel should still be present in the other group that wasn't deleted
    panel = screen.queryByText('Disk I/O Utilization');
    expect(panel).toBeInTheDocument();
  });
});
