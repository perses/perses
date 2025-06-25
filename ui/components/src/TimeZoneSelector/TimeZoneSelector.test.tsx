// Copyright 2025 The Perses Authors
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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_DASHBOARD_TIMEZONE } from '@perses-dev/core';
import { getTimeZoneOffset } from '../model/timeZoneOption';
import { TimeZoneSelector, TimeZoneSelectorProps } from './TimeZoneSelector';

describe('TimeZoneSelector', () => {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localTimeZoneOffset = getTimeZoneOffset(localTimeZone)?.value;
  const mockOnChange = jest.fn();
  const timeZoneSelectorProps: TimeZoneSelectorProps = {
    timeZoneOptions: [
      { label: 'UTC, GMT', value: 'UTC', longOffset: 'GMT+00:00' },
      { label: `${localTimeZone} (default)`, value: DEFAULT_DASHBOARD_TIMEZONE, longOffset: 'GMT+01:00' },
      { label: 'Europe/Paris', value: 'Europe/Paris', longOffset: 'GMT+02:00' },
    ],
    onChange: mockOnChange,
    value: DEFAULT_DASHBOARD_TIMEZONE,
  };
  const renderComponent = (props: TimeZoneSelectorProps): void => {
    render(<TimeZoneSelector {...props} />);
  };

  it('should display the local timezone as default', () => {
    renderComponent(timeZoneSelectorProps);
    expect(screen.getByTestId('current-timezone')).toHaveTextContent(localTimeZoneOffset ?? '');
  });

  it('should display the list of timezones', () => {
    renderComponent(timeZoneSelectorProps);
    expect(screen.getByText('UTC, GMT')).toBeInTheDocument();
    expect(screen.getByText(`${localTimeZone} (default)`)).toBeInTheDocument();
    expect(screen.getByText('Europe/Paris')).toBeInTheDocument();
  });

  it('should select a timezone', () => {
    renderComponent(timeZoneSelectorProps);
    userEvent.click(screen.getByText('Europe/Paris'));
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith({
      label: 'Europe/Paris',
      value: 'Europe/Paris',
      longOffset: 'GMT+02:00',
    });
  });

  it('should filter the list after searching', () => {
    renderComponent(timeZoneSelectorProps);
    userEvent.type(screen.getByTestId('search-timezone'), 'Europe');
    expect(screen.queryByText('UTC, GMT')).toBeNull();
    expect(screen.queryByText(`${localTimeZone} (default)`)).toBeNull();
    expect(screen.getByText('Europe/Paris')).toBeInTheDocument();
  });
});
