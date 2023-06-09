import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { SettingsAutocomplete } from './SettingsAutocomplete';

describe('SettingsAutocomplete', () => {
  test('determines `isOptionEqualToValue` using `id` attr', () => {
    const options = [
      {
        id: '1',
        label: 'One',
      },
      {
        id: '2',
        label: 'Two',
      },
    ];
    render(
      <SettingsAutocomplete
        options={options}
        value={{
          id: '2',
          label: 'Two',
        }}
      />
    );

    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toHaveValue('Two');

    userEvent.click(dropdown);

    const dropdownOptions = screen.getAllByRole('option');
    expect(dropdownOptions[0]).not.toHaveAttribute('aria-selected', 'true');
    expect(dropdownOptions[1]).toHaveAttribute('aria-selected', 'true');
  });

  test('options show the `label` prop when available', () => {
    const options = [
      {
        id: '1',
        label: 'One',
      },
    ];
    render(<SettingsAutocomplete options={options} />);

    const dropdown = screen.getByRole('combobox');
    userEvent.click(dropdown);

    expect(screen.getByRole('option')).toHaveTextContent('One');
    expect(screen.getByRole('option')).not.toHaveTextContent('1');
  });

  test('options show the `id` prop when `label` is not set', () => {
    const options = [
      {
        id: '2',
      },
    ];
    render(<SettingsAutocomplete options={options} />);

    const dropdown = screen.getByRole('combobox');
    userEvent.click(dropdown);

    expect(screen.getByRole('option')).toHaveTextContent('2');
  });

  describe('when options include a description', () => {
    const options = [
      {
        id: '1',
        label: 'One',
        description: 'The first description',
      },
      {
        id: '2',
        label: 'Two',
        description: 'Second description.',
      },
    ];

    test('dropdown options show label and description', () => {
      render(<SettingsAutocomplete options={options} />);

      const dropdown = screen.getByRole('combobox');
      userEvent.click(dropdown);

      const dropdownOptions = screen.getAllByRole('option');
      expect(dropdownOptions).toHaveLength(options.length);

      dropdownOptions.forEach((dropdownOption, i) => {
        const option = options[i];

        if (!option) {
          throw new Error(`Could not find option for ${i}`);
        }

        expect(dropdownOption).toHaveTextContent(option.label);
        expect(dropdownOption).toHaveTextContent(option.description);
      });
    });

    test('filtering includes the label', () => {
      render(<SettingsAutocomplete options={options} />);

      const dropdown = screen.getByRole('combobox');
      userEvent.type(dropdown, 'One');

      const filteredOption = screen.getByRole('option');
      expect(filteredOption).toHaveTextContent('One');
    });

    test('filtering includes the description', () => {
      render(<SettingsAutocomplete options={options} />);

      const dropdown = screen.getByRole('combobox');
      userEvent.type(dropdown, 'second');

      const filteredOption = screen.getByRole('option');
      expect(filteredOption).toHaveTextContent('Second description');
    });
  });

  describe('when options are disabled', () => {
    const options = [
      {
        id: '1',
        label: 'Active',
      },
      {
        id: '2',
        label: 'Inactive',
        disabled: true,
      },
    ];

    test('the associated dropdown option is disabled', () => {
      render(<SettingsAutocomplete options={options} />);

      const dropdown = screen.getByRole('combobox');
      userEvent.click(dropdown);

      const dropdownOptions = screen.getAllByRole('option');
      expect(dropdownOptions).toHaveLength(options.length);

      // .toBeDisabled didn't work for this. It may not be properly checking
      // for the aria-disabled attr.
      expect(dropdownOptions[1]).toHaveAttribute('aria-disabled', 'true');

      expect(dropdownOptions[0]).not.toHaveAttribute('aria-disabled', 'true');
    });
  });
});
