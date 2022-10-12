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
import { DashboardProvider, TemplateVariableProvider, TimeRangeProvider } from '../../../context';
import { PanelGroupDefinition } from '../../../context/DashboardProvider/layout-slice';
import { createDashboardProviderSpy, getTestDashboard, renderWithContext } from '../../../test';
import testDashboard from '../../../test/testDashboard';
import { DashboardApp } from '../DashboardApp';

describe('Panel Groups', () => {
  const renderDashboard = () => {
    const { store, DashboardProviderSpy } = createDashboardProviderSpy();
    renderWithContext(
      <TimeRangeProvider
        timeRange={{ pastDuration: '30m' }}
        setTimeRange={() => {
          return; // TODO: fix no-op condition
        }}
      >
        <TemplateVariableProvider>
          <DashboardProvider initialState={{ dashboardSpec: getTestDashboard().spec, isEditMode: true }}>
            <DashboardProviderSpy />
            <DashboardApp dashboardResource={getTestDashboard()} />
          </DashboardProvider>
        </TemplateVariableProvider>
      </TimeRangeProvider>
    );

    const { value: storeApi } = store;
    if (storeApi === undefined) {
      throw new Error('Expected dashboard store to be set after initial render');
    }

    return storeApi;
  };

  beforeEach(() => {
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });

  it('should delete panel', () => {
    const storeApi = renderDashboard();
    const panel = screen.getByText('CPU');
    userEvent.hover(panel);
    const deletePanelButton = screen.getByLabelText('delete panel');
    userEvent.click(deletePanelButton);
    screen.getByText('Delete Panel');
    const deleteButton = screen.getByText('Delete');
    userEvent.click(deleteButton);

    const layouts = storeApi.getState().layouts;
    const deletedPanel = testDashboard.spec.panels['cpu'];
    expect(layouts[0]?.items).toEqual(expect.not.objectContaining(deletedPanel));

    const panels = storeApi.getState().panels;
    // should remove cpu from state.panels since it's not used anymore
    expect(panels).toEqual(expect.not.objectContaining({ cpu: testDashboard.spec.panels['cpu'] }));
  });

  it('should only delete panel from panel group if panel is referenced more than once', () => {
    const storeApi = renderDashboard();
    const panel = screen.getByText('Disk I/O Utilization');
    userEvent.hover(panel);
    const deletePanelButton = screen.getByLabelText('delete panel');
    userEvent.click(deletePanelButton);
    screen.getByText('Delete Panel');
    const deleteButton = screen.getByText('Delete');
    userEvent.click(deleteButton);
    const layouts = storeApi.getState().layouts;
    const deletedPanel = testDashboard.spec.panels['diskIO'];
    expect(layouts[0]?.items).toEqual(expect.not.objectContaining(deletedPanel));

    const panels = storeApi.getState().panels;
    // should NOT remove diskIO from state.panels since it's used in another panel group
    expect(panels).toEqual(expect.objectContaining({ diskIO: testDashboard.spec.panels['diskIO'] }));
  });

  it('should swap panels', () => {
    const storeApi = renderDashboard();
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

    const layouts = storeApi.getState().layouts;
    expect(layouts[0]?.title).toBe(undefined);
    expect(layouts[1]?.title).toBe('Disk Stats');
    expect(layouts[2]?.title).toBe('CPU Stats');
  });

  it('should delete a panel group', () => {
    const storeApi = renderDashboard();
    const group = screen.getByText('CPU Stats');
    userEvent.hover(group);
    const deleteGroupIcon = screen.getByLabelText('delete group');
    userEvent.click(deleteGroupIcon);
    screen.getByText('Delete Panel Group');
    const deleteButton = screen.getByText('Delete');
    userEvent.click(deleteButton);

    // should remove group from state.layouts
    const layouts = storeApi.getState().layouts;
    expect(layouts).toHaveLength(2);
    const deletedLayout: PanelGroupDefinition = {
      id: 0,
      title: 'CPU Stats',
      isCollapsed: false,
      items: [
        {
          x: 0,
          y: 0,
          width: 12,
          height: 4,
          content: { $ref: '#/spec/panels/cpu' },
        },
      ],
    };
    expect(layouts).toEqual(expect.not.objectContaining(deletedLayout));

    const panels = storeApi.getState().panels;
    // should remove cpu from state.panels since it's not used anymore
    expect(panels).toEqual(expect.not.objectContaining({ cpu: testDashboard.spec.panels['cpu'] }));
    // should not remove diskIO from state.panels since it's still used in another group
    expect(panels).toEqual(expect.objectContaining({ diskIO: testDashboard.spec.panels['diskIO'] }));
  });
});
