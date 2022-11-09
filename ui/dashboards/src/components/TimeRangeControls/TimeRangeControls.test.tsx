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

import { generatePath } from 'react-router';
import { createMemoryHistory } from 'history';
import userEvent from '@testing-library/user-event';
import { screen, act } from '@testing-library/react';
import { renderWithContext } from '../../test';
import testDashboard from '../../test/testDashboard';
import { DashboardProvider, DashboardStoreProps, TimeRangeProvider } from '../../context';
import { TimeRangeControls } from './TimeRangeControls';

const history = createMemoryHistory({
  initialEntries: [generatePath('/dashboards/:id', { id: 'test' })],
});

describe('TimeRangeControls', () => {
  let initialState: DashboardStoreProps;
  const testDefaultTimeRange = { pastDuration: testDashboard.spec.duration };

  beforeEach(() => {
    initialState = {
      dashboardResource: testDashboard,
    };
  });

  const renderTimeRangeControls = (testURLParams: boolean) => {
    renderWithContext(
      <DashboardProvider initialState={initialState}>
        <TimeRangeProvider initialTimeRange={testDefaultTimeRange} enabledURLParams={testURLParams}>
          <TimeRangeControls />
        </TimeRangeProvider>
      </DashboardProvider>,
      undefined,
      history
    );
  };

  it('should default to dashboard duration and update selected time option when clicked', async () => {
    renderTimeRangeControls(false);
    expect(screen.getByText('Last 30 minutes')).toBeInTheDocument();
    const dateButton = screen.getByRole('button');
    userEvent.click(dateButton);
    const firstSelected = screen.getByRole('option', { name: 'Last 5 minutes' });
    userEvent.click(firstSelected);
    expect(dateButton).toHaveTextContent(/5 minutes/i);
  });

  it('should update URL params with correct time range values', () => {
    renderTimeRangeControls(true);
    const dateButton = screen.getByRole('button');
    userEvent.click(dateButton);
    const firstSelected = screen.getByRole('option', { name: 'Last 5 minutes' });
    userEvent.click(firstSelected);
    expect(history.location.search).toEqual('?start=5m');

    // pick another option from TimeRangeSelector dropdown
    const secondSelected = screen.getByText('Last 12 hours');
    userEvent.click(secondSelected);
    expect(history.location.search).toEqual('?start=12h');

    // back button should return to first option selected
    act(() => {
      history.back();
    });
    expect(history.location.search).toEqual('?start=5m');
  });

  // TODO: add additional tests for absolute time selection, other inputs, form validation, etc.
});
