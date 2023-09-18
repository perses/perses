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
import { Box, LinearProgress, TextField, Autocomplete } from '@mui/material';
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
  // selectedValue is the value(s) that will be used in the view only
  selectedValue: VariableValue;
  // viewOptions are the options used in the view only (options + All if allowed)
  viewOptions: VariableOption[];
} {
  const allowMultiple = spec?.allowMultiple === true;
  const allowAllValue = spec?.allowAllValue === true;
  const sort = spec?.sort;
  const loading = useMemo(() => variablesOptionsQuery.isFetching || false, [variablesOptionsQuery]);
  const options = variablesOptionsQuery.data;

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

  // Once we computed value, we set it as the selected one, if it is available in the options
  const selectedValue = value && valueIsInOptions ? value : allowMultiple ? [] : '';

  return { value, loading, options, selectedValue, viewOptions };
}

function ListVariable({ name, source }: TemplateVariableProps) {
  const ctx = useTemplateVariable(name, source);
  const definition = ctx.definition as ListVariableDefinition;
  const variablesOptionsQuery = useListVariablePluginValues(definition);
  const { setVariableValue, setVariableLoading, setVariableOptions } = useTemplateVariableActions();
  const { selectedValue, value, loading, options, viewOptions } = useListVariableState(
    definition?.spec,
    ctx.state,
    variablesOptionsQuery
  );

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
    <Box display={'flex'}>
      <Autocomplete
        disablePortal
        disableCloseOnSelect={allowMultiple}
        multiple={allowMultiple}
        fullWidth
        onChange={(e, value) => {
          // Must be selected
          if ((value === null || (Array.isArray(value) && value.length === 0)) && allowAllValue) {
            setVariableValue(name, DEFAULT_ALL_VALUE, source);
            return;
          }
          setVariableValue(name, variableOptionToVariableValue(value), source);
        }}
        options={viewOptions}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => <TextField {...params} value={selectedValue} label={title} />}
      />
      {loading && <LinearProgress />}
    </Box>
  );
}

function TextVariable({ name, source }: TemplateVariableProps) {
  const ctx = useTemplateVariable(name, source);
  const state = ctx.state;
  const definition = ctx.definition as TextVariableDefinition;
  const [tempValue, setTempValue] = useState(state?.value ?? '');
  const { setVariableValue } = useTemplateVariableActions();

  useEffect(() => {
    setTempValue(state?.value ?? '');
  }, [state?.value]);

  return (
    <TextField
      title={tempValue as string}
      value={tempValue}
      onChange={(e) => setTempValue(e.target.value)}
      onBlur={() => setVariableValue(name, tempValue, source)}
      placeholder={name}
      label={definition?.spec.display?.name ?? name}
      InputProps={{
        readOnly: definition?.spec.constant ?? false,
      }}
    />
  );
}
