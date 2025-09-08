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

import userEvent from '@testing-library/user-event';
import { screen, RenderOptions, render, RenderResult } from '@testing-library/react';
import { DurationString } from '@perses-dev/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactElement } from 'react';
import { SnackbarProvider } from '@perses-dev/components';
import { TimeRangeProvider, TimeRangeProviderWithQueryParams } from '@perses-dev/plugin-system';
import { TimeRangeControls } from './TimeRangeControls';

/**
 * Test helper to render a React component with some common app-level providers wrapped around it.
 */
export function renderWithContext(ui: React.ReactElement, options?: Omit<RenderOptions, 'queries'>): RenderResult {
  // Create a new QueryClient for each test to avoid caching issues
  const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } });

  const BaseRender = (): ReactElement => (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>{ui}</SnackbarProvider>
    </QueryClientProvider>
  );

  return render(<BaseRender />, options);
}

describe('TimeRangeControls', () => {
  const testDefaultTimeRange = { pastDuration: '30m' as DurationString };
  const testDefaultRefreshInterval = '0s';

  const renderTimeRangeControls = (testURLParams: boolean): void => {
    renderWithContext(
      <>
        {testURLParams ? (
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
        )}
      </>,
      undefined
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

  // TODO: add additional tests for absolute time selection, other inputs, form validation, etc.
});
