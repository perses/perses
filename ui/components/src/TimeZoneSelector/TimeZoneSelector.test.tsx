import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeZoneSelector, TimeZoneSelectorProps } from './TimeZoneSelector';

describe('TimeZoneSelector', () => {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const mockOnChange = jest.fn();
  const timeZoneSelectorProps: TimeZoneSelectorProps = {
    timeZoneOptions: [
      { label: 'UTC, GMT', value: 'UTC', longOffset: 'GMT+00:00' },
      { label: `${localTimeZone} (default)`, value: 'local', longOffset: 'GMT+01:00' },
      { label: 'Europe/Paris', value: 'Europe/Paris', longOffset: 'GMT+02:00' },
    ],
    onChange: mockOnChange,
    value: 'local',
  };
  const renderComponent = (props: TimeZoneSelectorProps): void => {
    render(<TimeZoneSelector {...props} />);
  };

  it('should display the local timezone as default', () => {
    renderComponent(timeZoneSelectorProps);
    expect(screen.getByTestId('current-timezone')).toHaveTextContent(localTimeZone);
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
