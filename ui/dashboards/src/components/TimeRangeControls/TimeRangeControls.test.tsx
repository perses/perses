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

import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithHistory } from '../../test';
import testDashboard from '../../test/testDashboard';
import { DashboardProvider, DashboardStoreProps, TimeRangeProvider } from '../../context';
import { TimeRangeControls } from './TimeRangeControls';

describe('TimeRangeControls', () => {
  let initialState: DashboardStoreProps;
  const testDefaultTimeRange = { pastDuration: testDashboard.spec.duration };

  beforeEach(() => {
    initialState = {
      dashboardSpec: testDashboard.spec,
    };
  });

  const renderTimeRangeControls = () => {
    renderWithHistory(
      <DashboardProvider initialState={initialState}>
        <TimeRangeProvider timeRange={testDefaultTimeRange}>
          <TimeRangeControls />
        </TimeRangeProvider>
      </DashboardProvider>
    );
  };

  it('should render correct initial relative time shortcut', async () => {
    renderTimeRangeControls();
    expect(screen.getByText('Last 5 minutes')).toBeInTheDocument();
  });

  it('should be able to select the first option', () => {
    renderTimeRangeControls();
    const dateButton = screen.getByRole('button');
    userEvent.click(dateButton);
    const firstOption = screen.getByRole('option', { name: 'Last 5 minutes' });
    userEvent.click(firstOption);
    expect(dateButton).toHaveTextContent(/5 minutes/i);
  });

  // TODO: add additional tests for absolute time selection, other inputs, form validation, etc.
});
