import {
  Autocomplete,
  AutocompleteProps,
  TextField,
  Typography,
  UseAutocompleteProps,
  createFilterOptions,
} from '@mui/material';
import { ReactNode } from 'react';

/**
 * Interface to extend from for `options` when using `SettingsAutocomplete`.
 */
export interface SettingsAutocompleteOption {
  /**
   * Unique identifier for the option.
   */
  id: string;

  /**
   * Optional value that is presented to the user for each option. If not set,
   * the `id` will be used instead.
   */
  label?: string;

  /**
   * Optional description that will be rendered below the `label` to provide the
   * user with additional information about the option.
   */
  description?: ReactNode;

  /**
   * When `true`, the option will be disabled.
   */
  disabled?: boolean;
}

export interface SettingsAutocompleteProps<
  OptionType extends SettingsAutocompleteOption,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined
  // Note that the last `false` in the generic arguments sets the `freeSolo` option to `false`.
  // This component is intended to be used with a discrete list of options, so `freeSolo` never
  // needs to be `true`.
> extends Omit<AutocompleteProps<OptionType, Multiple, DisableClearable, false>, 'renderInput'> {
  // Modifying this to optional, so we can define a sensible default below that
  // is used in many of the simple cases.
  renderInput?: AutocompleteProps<OptionType, Multiple, DisableClearable, false>['renderInput'];
}

/**
 * Opinionated autocomplete component useful for providing users with a dropdown
 * for settings that require selecting one or more options from a list.
 *
 * **Note: This component is currently experimental and is likely to have significant breaking changes in the near future. Use with caution outside of the core Perses codebase.**
 */
export function SettingsAutocomplete<
  OptionType extends SettingsAutocompleteOption,
  Multiple extends boolean | undefined = false,
  DisableClearable extends boolean | undefined = false
>({
  options,
  renderInput = (params) => <TextField {...params} />,
  ...otherProps
}: SettingsAutocompleteProps<OptionType, Multiple, DisableClearable>) {
  const getOptionLabel: UseAutocompleteProps<OptionType, undefined, boolean, undefined>['getOptionLabel'] = (
    option
  ) => {
    return option.label ?? option.id;
  };

  return (
    <Autocomplete
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionDisabled={(option) => !!option.disabled}
      getOptionLabel={getOptionLabel}
      options={options}
      renderInput={renderInput}
      renderOption={(props, option) => {
        return (
          <li {...props}>
            <div>
              <Typography variant="body1" component="div">
                {getOptionLabel(option)}
              </Typography>
              {option.description && (
                <Typography variant="body2" component="div" color={(theme) => theme.palette.text.secondary}>
                  {option.description}
                </Typography>
              )}
            </div>
          </li>
        );
      }}
      filterOptions={createFilterOptions({
        // Include the label and the description in search.
        stringify: (option) => `${getOptionLabel(option)} ${option.description || ''}`,
      })}
      {...otherProps}
    />
  );
}
