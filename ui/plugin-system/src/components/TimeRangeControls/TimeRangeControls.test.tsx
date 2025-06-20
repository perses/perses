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

import { generatePath } from 'react-router';
import { createMemoryHistory, MemoryHistory } from 'history';
import userEvent from '@testing-library/user-event';
import { screen, act, RenderOptions, render, RenderResult } from '@testing-library/react';
import { DurationString } from '@perses-dev/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QueryParamProvider } from 'use-query-params';
import React, { ReactElement, useLayoutEffect, useState } from 'react';
import { Router } from 'react-router-dom';
import { SnackbarProvider } from '@perses-dev/components';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { TimeRangeProvider, TimeRangeProviderWithQueryParams } from '@perses-dev/plugin-system';
import { TimeRangeControls } from './TimeRangeControls';

const history = createMemoryHistory({
  initialEntries: [generatePath('/home'), generatePath('/dashboards/:id', { id: 'test' })],
});

interface CustomRouterProps {
  history: MemoryHistory;
  children: React.ReactNode;
}

/*
 * Workaround for React router upgrade type errors.
 * More details: https://stackoverflow.com/a/69948457/17575201
 */
const CustomRouter: React.FC<CustomRouterProps> = ({ history, children }): ReactElement => {
  const [state, setState] = useState({
    action: history.action,
    location: history.location,
  });

  useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router location={state.location} navigationType={state.action} navigator={history}>
      {children}
    </Router>
  );
};

/**
 * Test helper to render a React component with some common app-level providers wrapped around it.
 */
export function renderWithContext(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'queries'>,
  history?: MemoryHistory
): RenderResult {
  // Create a new QueryClient for each test to avoid caching issues
  const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } });

  const customHistory = history ?? createMemoryHistory();

  const BaseRender = (): ReactElement => (
    <CustomRouter history={customHistory}>
      <QueryClientProvider client={queryClient}>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>{ui}</SnackbarProvider>
        </QueryParamProvider>
      </QueryClientProvider>
    </CustomRouter>
  );

  return render(<BaseRender />, options);
}

describe('TimeRangeControls', () => {
  const testDefaultTimeRange = { pastDuration: '30m' as DurationString };
  const testDefaultRefreshInterval = '0s';

  const renderTimeRangeControls = (testURLParams: boolean): void => {
    renderWithContext(
      testURLParams ? (
        <TimeRangeProviderWithQueryParams
          initialRefreshInterval={testDefaultRefreshInterval}
          initialTimeRange={testDefaultTimeRange}
        >
          <TimeRangeControls />
        </TimeRangeProviderWithQueryParams>
      ) : (
        <TimeRangeProvider refreshInterval={testDefaultRefreshInterval} timeRange={testDefaultTimeRange}>
          <TimeRangeControls />
        </TimeRangeProvider>
      ),
      undefined,
      history
    );
  };

  it('should default to dashboard duration and update selected time option when clicked', async () => {
    renderTimeRangeControls(false);
    expect(screen.getByText('Last 30 minutes')).toBeInTheDocument();
    const dateButton = await screen.findByLabelText(/time range/i, { selector: '[role="combobox"]' });
    userEvent.click(dateButton);
    const firstSelected = screen.getByRole('option', { name: 'Last 5 minutes' });
    userEvent.click(firstSelected);
    expect(dateButton).toHaveTextContent(/5 minutes/i);
  });

  it('should update URL params with correct time range values', () => {
    renderTimeRangeControls(true);
    const dateButton = screen.getByLabelText(/time range/i, { selector: '[role="combobox"]' });
    userEvent.click(dateButton);
    const firstSelected = screen.getByRole('option', { name: 'Last 5 minutes' });
    userEvent.click(firstSelected);
    expect(history.location.search).toEqual('?start=5m&refresh=0s&timeZone=local');

    // pick another option from TimeRangeSelector dropdown
    const secondSelected = screen.getByText('Last 12 hours');
    userEvent.click(secondSelected);
    expect(history.location.search).toEqual('?start=12h&refresh=0s&timeZone=local');

    const refreshButton = screen.getByLabelText(/refresh interval/i, { selector: '[role="combobox"]' });
    userEvent.click(refreshButton);

    const firstRefreshSelected = screen.getByRole('option', { name: '5s' });
    userEvent.click(firstRefreshSelected);
    expect(history.location.search).toEqual('?start=12h&refresh=5s&timeZone=local');

    // back button should return to previous page selected
    act(() => {
      history.back();
    });
    expect(history.location.pathname).toEqual('/home');
  });

  // TODO: add additional tests for absolute time selection, other inputs, form validation, etc.
});
