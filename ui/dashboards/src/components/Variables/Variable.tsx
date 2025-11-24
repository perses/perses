// Copyright 2024 The Perses Authors
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

import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { TextField, Popper, PopperProps, Checkbox, Autocomplete, createFilterOptions, Chip, Box } from '@mui/material';
import {
  DEFAULT_ALL_VALUE,
  ListVariableDefinition,
  ListVariableSpec,
  TextVariableDefinition,
  VariableName,
  VariableValue,
} from '@perses-dev/core';
import {
  SORT_METHODS,
  SortMethodName,
  useListVariablePluginValues,
  VariableOption,
  VariableState,
} from '@perses-dev/plugin-system';
import { UseQueryResult } from '@tanstack/react-query';
import { useVariableDefinitionAndState, useVariableDefinitionActions } from '../../context';
import { MAX_VARIABLE_WIDTH, MIN_VARIABLE_WIDTH } from '../../constants';
import { ListVariableListBoxProvider, ListVariableListBox } from './ListVariableListBox';

type VariableProps = {
  name: VariableName;
  source?: string;
};

function variableOptionToVariableValue(options: VariableOption | VariableOption[] | null): VariableValue {
  if (options === null) {
    return null;
  }
  if (Array.isArray(options)) {
    return options.map((v) => {
      return v.value;
    });
  }
  return options.value;
}
// LOGZ.IO CHANGE START:: Prevented infinite rerender loop once value is set to 'All' (DEFAULT_ALL_VALUE)[APPZ-1271]
function canonicalizeVariableValue(value: VariableValue | undefined): VariableValue | undefined {
  if (Array.isArray(value)) {
    if (value.includes(DEFAULT_ALL_VALUE)) {
      return [DEFAULT_ALL_VALUE];
    }
    return [...value].sort();
  }
  return value;
}

function valuesEqualConsideringAll(a: VariableValue | undefined, b: VariableValue | undefined): boolean {
  const ax = canonicalizeVariableValue(a);
  const bx = canonicalizeVariableValue(b);
  const isAll = (v: VariableValue | undefined): boolean => v === DEFAULT_ALL_VALUE;
  const isAllArray = (v: VariableValue | undefined): boolean =>
    Array.isArray(v) && v.length === 1 && v[0] === DEFAULT_ALL_VALUE;
  if ((isAllArray(ax) && isAll(bx)) || (isAll(ax) && isAllArray(bx))) return true;
  if (Array.isArray(ax) && Array.isArray(bx)) {
    if (ax.length !== bx.length) return false;
    for (let i = 0; i < ax.length; i++) {
      if (ax[i] !== bx[i]) return false;
    }
    return true;
  }
  return ax === bx;
}
// LOGZ.IO CHANGE END:: Prevented infinite rerender loop once value is set to 'All' (DEFAULT_ALL_VALUE)[APPZ-1271]

export function Variable({ name, source }: VariableProps): ReactElement {
  const ctx = useVariableDefinitionAndState(name, source);
  const kind = ctx.definition?.kind;
  switch (kind) {
    case 'TextVariable':
      return <TextVariable name={name} source={source} />;
    case 'ListVariable':
      return <ListVariable name={name} source={source} />;
  }

  return <div>Unsupported Variable Kind: ${kind}</div>;
}

export function useListVariableState(
  spec: ListVariableSpec | undefined,
  state: VariableState | undefined,
  variablesOptionsQuery: Partial<UseQueryResult<VariableOption[]>>
): {
  // Value, Loading, Options are modified only when we want to save the changes made
  value: VariableValue | undefined;
  loading: boolean;
  options: VariableOption[] | undefined;
  // selectedOptions is/are the option(s) selected in the view
  selectedOptions: VariableOption | VariableOption[];
  // viewOptions are the options used in the view only (= options + All if allowed)
  viewOptions: VariableOption[];
} {
  const allowMultiple = spec?.allowMultiple === true;
  const allowAllValue = spec?.allowAllValue === true;
  const sort = spec?.sort;
  const loading = useMemo(() => variablesOptionsQuery.isFetching ?? false, [variablesOptionsQuery.isFetching]);
  const options = useMemo(() => variablesOptionsQuery.data ?? [], [variablesOptionsQuery.data]);

  let value = state?.value;

  // Make sure value is an array if allowMultiple is true
  if (allowMultiple && !Array.isArray(value)) {
    value = typeof value === 'string' ? [value] : [];
  }

  // Sort the provided list of options according to the method defined
  const sortedOptions = useMemo((): VariableOption[] => {
    const opts = options ? [...options] : [];

    if (!sort || sort === 'none') return opts;
    const sortMethod = SORT_METHODS[sort as SortMethodName];
    return !sortMethod ? opts : sortMethod.sort(opts);
  }, [options, sort]);

  const viewOptions = useMemo(() => {
    let computedOptions = sortedOptions;

    // Add the all value if it's allowed
    if (allowAllValue) {
      computedOptions = [{ value: DEFAULT_ALL_VALUE, label: 'All' }, ...computedOptions];
    }
    return computedOptions;
  }, [allowAllValue, sortedOptions]);

  const valueIsInOptions = useMemo(
    () =>
      Boolean(
        viewOptions.find((v) => {
          if (allowMultiple) {
            return (value as string[]).includes(v.value);
          }
          return value === v.value;
        })
      ),
    [viewOptions, value, allowMultiple]
  );

  value = useMemo(() => {
    const firstOptionValue = viewOptions?.[allowAllValue ? 1 : 0]?.value;

    // If there is no value but there are options, or the value is not in options, we set the value to the first option.
    if (firstOptionValue) {
      if (!valueIsInOptions || !value || value.length === 0) {
        return allowMultiple ? [firstOptionValue] : firstOptionValue;
      }
    }

    return value;
  }, [viewOptions, value, valueIsInOptions, allowMultiple, allowAllValue]);

  const selectedOptions = useMemo(() => {
    // In the case Autocomplete.multiple equals false, Autocomplete.value expects a single object, not
    // an array, hence this conditional
    if (Array.isArray(value)) {
      return viewOptions.filter((o) => {
        return value?.includes(o.value);
      });
    } else {
      return (
        viewOptions.find((o) => {
          return value === o.value;
        }) ?? { value: '', label: '' }
      );
    }
  }, [value, viewOptions]);

  return { value, loading, options, selectedOptions, viewOptions };
}

const StyledPopper = (props: PopperProps): ReactElement => (
  <Popper {...props} sx={{ minWidth: 'fit-content' }} placement="bottom-start" />
);

const LETTER_HSIZE = 8; // approximation
const ARROW_OFFSET = 40; // right offset for list variables (= take into account the dropdown toggle size)
const getWidthPx = (inputValue: string, kind: 'list' | 'text'): number => {
  const width = (inputValue.length + 1) * LETTER_HSIZE + (kind === 'list' ? ARROW_OFFSET : 0);
  if (width < MIN_VARIABLE_WIDTH) {
    return MIN_VARIABLE_WIDTH;
  } else if (width > MAX_VARIABLE_WIDTH) {
    return MAX_VARIABLE_WIDTH;
  } else {
    return width;
  }
};

function ListVariable({ name, source }: VariableProps): ReactElement {
  const ctx = useVariableDefinitionAndState(name, source);
  const definition = ctx.definition as ListVariableDefinition;
  const variablesOptionsQuery = useListVariablePluginValues(definition);
  const { setVariableValue, setVariableLoading, setVariableOptions } = useVariableDefinitionActions();
  const { selectedOptions, value, loading, options, viewOptions } = useListVariableState(
    definition?.spec,
    ctx.state,
    variablesOptionsQuery
  );
  const [inputWidth, setInputWidth] = useState(MIN_VARIABLE_WIDTH);
  // Used for multiple value variables, it will not clear variable input when selecting an option
  const [inputValue, setInputValue] = useState('');

  const title = definition?.spec.display?.name ?? name;
  const allowMultiple = definition?.spec.allowMultiple === true;
  const allowAllValue = definition?.spec.allowAllValue === true;

  const filterOptions = createFilterOptions<VariableOption>({});

  const filteredOptions = useMemo(
    () => filterOptions(viewOptions, { inputValue, getOptionLabel: (o) => o.label }),
    [inputValue, viewOptions, filterOptions]
  );

  // Update value when changed
  useEffect(() => {
    // LOGZ.IO CHANGE:: Prevented infinite rerender loop once value is set to 'All' (DEFAULT_ALL_VALUE)[APPZ-1271]
    if (value && !valuesEqualConsideringAll(value, ctx.state?.value)) {
      setVariableValue(name, value, source);
    }
  }, [setVariableValue, name, value, source, ctx.state?.value]); // LOGZ.IO CHANGE:: Prevented infinite rerender loop once value is set to 'All' (DEFAULT_ALL_VALUE)[APPZ-1271]

  // Update loading when changed
  useEffect(() => {
    setVariableLoading(name, loading, source);
  }, [setVariableLoading, name, loading, source]);

  // Update options when changed
  useEffect(() => {
    if (options) {
      setVariableOptions(name, options, source);
    }
  }, [setVariableOptions, name, options, source]);

  const handleGlobalSelect = useCallback(
    (options: VariableOption[]): void => {
      setVariableValue(name, variableOptionToVariableValue(options), source);
    },
    [name, setVariableValue, source]
  );

  const listBoxProviderValue = useMemo(
    () => ({
      options: viewOptions,
      selectedOptions: selectedOptions as VariableOption[], // Only used when allowMultiple is true => selectedOptions is always an array
      filteredOptions: filteredOptions,
      allowAllValue,
      onChange: handleGlobalSelect,
    }),
    [allowAllValue, filteredOptions, handleGlobalSelect, selectedOptions, viewOptions]
  );

  const autocompleteComponent = useMemo(() => {
    return (
      <Autocomplete
        disablePortal
        loading={loading}
        disableCloseOnSelect={allowMultiple}
        multiple={allowMultiple}
        fullWidth
        limitTags={3}
        size="small"
        disableClearable
        slotProps={{ listbox: { component: allowMultiple ? ListVariableListBox : undefined } }}
        slots={{ popper: StyledPopper }}
        sx={{
          '& .MuiInputBase-root': {
            minHeight: '38px',
          },
          '& .MuiAutocomplete-tag': {
            margin: '1px 2px', // Default margin of 2px (Y axis) make min height of the autocomplete 40px
          },
        }}
        filterOptions={filterOptions}
        options={viewOptions}
        value={selectedOptions}
        onChange={(_, value) => {
          if ((value === null || (Array.isArray(value) && value.length === 0)) && allowAllValue) {
            setVariableValue(name, DEFAULT_ALL_VALUE, source);
          } else {
            setVariableValue(name, variableOptionToVariableValue(value as VariableOption), source);
          }
        }}
        inputValue={allowMultiple ? inputValue : undefined}
        onInputChange={(_, newInputValue) => {
          if (!allowMultiple) {
            setInputWidth(getWidthPx(newInputValue, 'list'));
          }
        }}
        onBlur={() => {
          if (allowMultiple) {
            setInputValue('');
          }
        }}
        renderInput={(params) => {
          return allowMultiple ? (
            <TextField {...params} label={title} onChange={(e) => setInputValue(e.target.value)} />
          ) : (
            <TextField {...params} label={title} style={{ width: `${inputWidth}px` }} />
          );
        }}
        renderOption={(props, option, { selected }) => {
          const { key, ...optionProps } = props;
          return (
            <li key={key} {...optionProps} style={{ padding: 0 }}>
              <Checkbox style={{ marginRight: 8 }} checked={selected} />
              {option.label}
            </li>
          );
        }}
        renderTags={(value, getTagProps, ownerState) => {
          // When focused, if there are too much value selected, it will use all screen place. Putting limit to 200px (~6 lines of chips)
          if (ownerState.focused) {
            return (
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {value.map((option, index) => (
                  <Chip {...getTagProps({ index })} key={index} label={option.label} size="small" />
                ))}
              </Box>
            );
          }

          const limitTags: number | undefined = ownerState.limitTags;
          const numTags: number = value.length;

          return (
            <>
              {value.slice(0, limitTags).map((option, index) => (
                <Chip {...getTagProps({ index })} key={index} label={option.label} size="small" />
              ))}

              {limitTags && numTags > limitTags && ` +${numTags - limitTags}`}
            </>
          );
        }}
      />
    );
  }, [
    allowAllValue,
    allowMultiple,
    filterOptions,
    inputValue,
    inputWidth,
    loading,
    name,
    selectedOptions,
    setVariableValue,
    source,
    title,
    viewOptions,
  ]);

  if (allowMultiple) {
    return (
      <ListVariableListBoxProvider value={listBoxProviderValue}>{autocompleteComponent}</ListVariableListBoxProvider>
    );
  }

  return autocompleteComponent;
}

function TextVariable({ name, source }: VariableProps): ReactElement {
  const ctx = useVariableDefinitionAndState(name, source);
  const state = ctx.state;
  const definition = ctx.definition as TextVariableDefinition;
  const [tempValue, setTempValue] = useState(state?.value ?? '');
  const [inputWidth, setInputWidth] = useState(getWidthPx(tempValue as string, 'text'));
  const { setVariableValue } = useVariableDefinitionActions();

  useEffect(() => {
    setTempValue(state?.value ?? '');
  }, [state?.value]);

  return (
    <TextField
      title={tempValue as string}
      value={tempValue}
      onChange={(e) => {
        setTempValue(e.target.value);
        setInputWidth(getWidthPx(e.target.value, 'text'));
      }}
      onBlur={() => setVariableValue(name, tempValue, source)}
      placeholder={name}
      label={definition?.spec.display?.name ?? name}
      slotProps={{
        input: {
          readOnly: definition?.spec.constant ?? false,
        },
      }}
      sx={{
        width: `${inputWidth}px`,
        '& .MuiInputBase-root': {
          minHeight: '38px',
        },
        '& .MuiInputBase-input': {
          textOverflow: 'ellipsis',
        },
      }}
    />
  );
}
