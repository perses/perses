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

import { useEffect, useMemo, useState } from 'react';
import { LinearProgress, TextField, Autocomplete, Popper, PopperProps } from '@mui/material';
import {
  DEFAULT_ALL_VALUE,
  ListVariableDefinition,
  ListVariableSpec,
  TextVariableDefinition,
  UnknownSpec,
  VariableName,
  VariableValue,
} from '@perses-dev/core';
import { useListVariablePluginValues, VariableOption, VariableState } from '@perses-dev/plugin-system';
import { UseQueryResult } from '@tanstack/react-query';
import { useTemplateVariable, useTemplateVariableActions } from '../../context';
import { MAX_TEMPLATE_VARIABLE_WIDTH, MIN_TEMPLATE_VARIABLE_WIDTH } from '../../constants';

type TemplateVariableProps = {
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

export function TemplateVariable({ name, source }: TemplateVariableProps) {
  const ctx = useTemplateVariable(name, source);
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
  spec: ListVariableSpec<UnknownSpec> | undefined,
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

    switch (sort) {
      case 'alphabetical-asc':
        return opts.sort((a, b) => (a.label > b.label ? 1 : -1));
      case 'alphabetical-desc':
        return opts.sort((a, b) => (a.label > b.label ? -1 : 1));
      case 'numerical-asc':
        return opts.sort((a, b) => (parseInt(a.label) > parseInt(b.label) ? 1 : -1));
      case 'numerical-desc':
        return opts.sort((a, b) => (parseInt(a.label) < parseInt(b.label) ? 1 : -1));
      case 'alphabetical-ci-asc':
        return opts.sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
      case 'alphabetical-ci-desc':
        return opts.sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? -1 : 1));
      default:
        return opts;
    }
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

const StyledPopper = (props: PopperProps) => (
  <Popper {...props} sx={{ minWidth: 'fit-content' }} placement="bottom-start" />
);

const LETTER_HSIZE = 8; // approximation
const ARROW_OFFSET = 40; // right offset for list variables (= take into account the dropdown toggle size)
const getWidthPx = (inputValue: string, kind: 'list' | 'text'): number => {
  const width = (inputValue.length + 1) * LETTER_HSIZE + (kind === 'list' ? ARROW_OFFSET : 0);
  if (width < MIN_TEMPLATE_VARIABLE_WIDTH) {
    return MIN_TEMPLATE_VARIABLE_WIDTH;
  } else if (width > MAX_TEMPLATE_VARIABLE_WIDTH) {
    return MAX_TEMPLATE_VARIABLE_WIDTH;
  } else {
    return width;
  }
};

function ListVariable({ name, source }: TemplateVariableProps) {
  const ctx = useTemplateVariable(name, source);
  const definition = ctx.definition as ListVariableDefinition;
  const variablesOptionsQuery = useListVariablePluginValues(definition);
  const { setVariableValue, setVariableLoading, setVariableOptions } = useTemplateVariableActions();
  const { selectedOptions, value, loading, options, viewOptions } = useListVariableState(
    definition?.spec,
    ctx.state,
    variablesOptionsQuery
  );
  const [inputValue, setInputValue] = useState<string>('');
  const [inputWidth, setInputWidth] = useState(MIN_TEMPLATE_VARIABLE_WIDTH);

  const title = definition?.spec.display?.name ?? name;
  const allowMultiple = definition?.spec.allowMultiple === true;
  const allowAllValue = definition?.spec.allowAllValue === true;

  // Update value when changed
  useEffect(() => {
    if (value) {
      setVariableValue(name, value, source);
    }
  }, [setVariableValue, name, value, source]);

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

  return (
    <>
      <Autocomplete
        disablePortal
        disableCloseOnSelect={allowMultiple}
        multiple={allowMultiple}
        fullWidth
        limitTags={3}
        size="small"
        disableClearable
        PopperComponent={StyledPopper}
        renderInput={(params) => {
          return allowMultiple ? (
            <TextField {...params} label={title} />
          ) : (
            <TextField {...params} label={title} style={{ width: `${inputWidth}px` }} />
          );
        }}
        sx={{
          '& .MuiInputBase-root': {
            minHeight: '38px',
          },
          '& .MuiInputBase-root.MuiOutlinedInput-root.MuiInputBase-sizeSmall': {
            paddingY: '5px',
            paddingLeft: '5px',
          },
        }}
        value={selectedOptions}
        onChange={(_, value) => {
          if ((value === null || (Array.isArray(value) && value.length === 0)) && allowAllValue) {
            setVariableValue(name, DEFAULT_ALL_VALUE, source);
          } else {
            setVariableValue(name, variableOptionToVariableValue(value), source);
          }
        }}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
          if (!allowMultiple) {
            setInputWidth(getWidthPx(newInputValue, 'list'));
          }
        }}
        options={viewOptions}
      />
      {loading && <LinearProgress />}
    </>
  );
}

function TextVariable({ name, source }: TemplateVariableProps) {
  const ctx = useTemplateVariable(name, source);
  const state = ctx.state;
  const definition = ctx.definition as TextVariableDefinition;
  const [tempValue, setTempValue] = useState(state?.value ?? '');
  const [inputWidth, setInputWidth] = useState(getWidthPx(tempValue as string, 'text'));
  const { setVariableValue } = useTemplateVariableActions();

  useEffect(() => {
    setTempValue(state?.value ?? '');
  }, [state?.value]);

  return (
    <TextField
      title={tempValue as string}
      value={tempValue}
      //onChange={(e) => setTempValue(e.target.value)}
      onChange={(e) => {
        setTempValue(e.target.value);
        setInputWidth(getWidthPx(e.target.value, 'text'));
      }}
      onBlur={() => setVariableValue(name, tempValue, source)}
      placeholder={name}
      label={definition?.spec.display?.name ?? name}
      InputProps={{
        readOnly: definition?.spec.constant ?? false,
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
