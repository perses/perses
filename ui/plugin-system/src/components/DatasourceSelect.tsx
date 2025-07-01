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

import OpenInNewIcon from 'mdi-material-ui/OpenInNew';
import {
  Stack,
  ListItemText,
  Chip,
  IconButton,
  Box,
  OutlinedSelectProps,
  BaseSelectProps,
  Autocomplete,
  TextField,
} from '@mui/material';
import { DatasourceSelector, GenericDatasource, VariableName } from '@perses-dev/core';
import { ReactElement, useMemo } from 'react';
import {
  DatasourceSelectItem,
  DatasourceSelectItemGroup,
  DatasourceSelectItemSelector,
  useDatasourceStore,
  useVariableValues,
  VariableStateMap,
} from '../runtime';
import { parseVariables } from '../utils';

const DATASOURCE_VARIABLE_VALUE_PREFIX = '__DATASOURCE_VARIABLE_VALUE__';
const VARIABLE_IDENTIFIER = '$';
// Props on MUI Select that we don't want people to pass because we're either redefining them or providing them in
// this component
type OmittedMuiProps = 'children' | 'value' | 'onChange';

type DataSourceOption = {
  groupEditLink?: string;
  groupLabel?: string;
  value: string;
} & Omit<DatasourceSelectItem, 'selector'> &
  Omit<DatasourceSelectItem['selector'], 'kind'>;

export type DatasourceSelectValue<T = DatasourceSelector> = T | VariableName;

export interface DatasourceSelectProps extends Omit<OutlinedSelectProps & BaseSelectProps<string>, OmittedMuiProps> {
  value: DatasourceSelectValue;
  onChange: (next: DatasourceSelectValue) => void;
  datasourcePluginKind: string;
  project?: string;
}

/**
 * Displays a MUI input for selecting a Datasource of a particular kind. Note: The 'value' and `onChange` handler for
 * the input deal with a `DatasourceSelector`.
 */
export function DatasourceSelect(props: DatasourceSelectProps): ReactElement {
  const { datasourcePluginKind, value, project, onChange, ...others } = props;
  const variables = useVariableValues();
  const { queryDatasource, getGroupingMetadata } = useDatasourceStore();

  const datasource = useMemo(() => {
    return queryDatasource?.({ kind: datasourcePluginKind, name: project }, true) || [];
  }, [datasourcePluginKind, project, queryDatasource]);

  const datasourceGroupingMetadata = useMemo(() => {
    return getGroupingMetadata?.() || {};
  }, [getGroupingMetadata]);

  const createDatasourceGroup = (datasource: GenericDatasource[]): Map<string, GenericDatasource[]> => {
    const groups = new Map<string, GenericDatasource[]>();
    datasource.forEach((ds) => {
      if (groups.has(ds.kind)) {
        groups.get(ds.kind)?.push(ds);
      } else {
        groups.set(ds.kind, [ds]);
      }
    });
    return groups;
  };

  /* TODO: 3059 - What about default?*/
  const options = useMemo<DataSourceOption[]>(() => {
    const datasourceOptions: DataSourceOption[] = [];
    const groups = createDatasourceGroup(datasource);
    Array.from(groups).forEach((group) => {
      /* IMPORTANT: 
        Some fields including saved,overridden,overriding are deprecated fields and are set to default values.
        Because, The data source provider should apply the priority and precedence for internal usage automatically.
        Since the consumer should provide the data source itself, it should be saved and ready already
        Later they should be safely removed  */
      const [kind, datasources] = group;

      datasources.forEach((ds) => {
        datasourceOptions.push({
          groupLabel: datasourceGroupingMetadata[kind]?.label || kind,
          group: datasourceGroupingMetadata[kind]?.label || kind,
          saved: true,
          overridden: false,
          overriding: false,
          value: selectorToOptionValue(datasourcePluginKind),
          name: ds.metadata.name,
          groupEditLink: datasourceGroupingMetadata[kind]?.editLink,
        });
      });
    });
    const datasourceOptionsMap = new Map(datasourceOptions.map((option) => [option.name, option]));
    const variableOptions = Object.entries(variables).flatMap<DataSourceOption>(([name, variable]) => {
      if (Array.isArray(variable.value)) return [];

      const associatedDatasource = datasourceOptionsMap.get(variable.value ?? '');
      if (!associatedDatasource) return [];

      return {
        groupLabel: 'Variables',
        name: `${VARIABLE_IDENTIFIER}${name}`,
        saved: true,
        value: `${DATASOURCE_VARIABLE_VALUE_PREFIX}${VARIABLE_IDENTIFIER}${name}`,
      };
    });

    return [...datasourceOptions, ...variableOptions];
  }, [datasource, datasourcePluginKind, datasourceGroupingMetadata, variables]);

  const defaultValue = useMemo<VariableName | DatasourceSelectItemSelector>(() => {
    if (isVariableDatasource(value)) {
      return value;
    }

    const targetIndex = value?.name
      ? datasource.findIndex((item) => item.spec.plugin.kind === value.kind && item.metadata.name === value.name)
      : datasource.findIndex((item) => item.spec.plugin.kind === value.kind);

    const group = datasource[targetIndex]?.kind === 'GlobalDatasource' ? 'global' : datasource[targetIndex]?.kind;
    return { ...value, group };
  }, [value, datasource]);

  const optionValue = options.find((option) => option.value === selectorToOptionValue(defaultValue));

  // When the user makes a selection, convert the string option value back to a DatasourceSelector
  const handleChange = (selectedOption: DataSourceOption | null): void => {
    if (selectedOption) {
      const next = optionValueToSelector(selectedOption?.value || '');
      onChange(next);
    } else {
      onChange({ kind: datasourcePluginKind });
    }
  };

  // We use a fake action event when we click on the action of the chip (hijack the "delete" feature).
  // This is because the href link action is on the `deleteIcon` property already, but the `onDelete` property
  // controls its visibility.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const fakeActionEvent = (): void => {};

  return (
    <Autocomplete<DataSourceOption>
      options={options}
      renderInput={(params) => <TextField {...params} label={others.label} placeholder="" />}
      groupBy={(option) => option.groupLabel || 'No group'}
      getOptionLabel={(option) => {
        return option.name;
      }}
      onChange={(_, v) => handleChange(v)}
      value={optionValue}
      renderOption={(props, option) => {
        return (
          <li {...props} key={option.value}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
              <ListItemText>
                <DatasourceName name={option.name} overridden={option.overridden} overriding={option.overriding} />
              </ListItemText>
              {!option.saved && <ListItemText>Save the dashboard to enable this datasource</ListItemText>}
              <ListItemText style={{ textAlign: 'right' }}>
                {option.groupLabel && option.groupLabel.length > 0 && (
                  <Chip
                    disabled={false}
                    label={option.groupLabel}
                    size="small"
                    onDelete={option.groupEditLink ? fakeActionEvent : undefined}
                    deleteIcon={
                      option.groupEditLink ? (
                        <IconButton href={option.groupEditLink} target="_blank">
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      ) : undefined
                    }
                  />
                )}
              </ListItemText>
            </Stack>
          </li>
        );
      }}
    />
  );
}

export function DatasourceName(props: { name: string; overridden?: boolean; overriding?: boolean }): ReactElement {
  const { name, overridden, overriding } = props;
  return (
    <>
      {`${name} `}
      {!overridden && overriding && (
        <Box display="inline" fontWeight="normal" color={(theme) => theme.palette.primary.main}>
          (overriding)
        </Box>
      )}
      {overridden && '(overridden)'}
    </>
  );
}

// Delimiter used to stringify/parse option values
const OPTION_VALUE_DELIMITER = '_____';

/**
 * Given a DatasourceSelectItemSelector,
 * returns a string value like `{kind}_____{group}_____{name}` that can be used as a Select input value.
 * @param selector
 */
export function selectorToOptionValue(selector: DatasourceSelectItemSelector | VariableName): string {
  if (isVariableDatasource(selector)) {
    return `${DATASOURCE_VARIABLE_VALUE_PREFIX}${selector}`;
  }
  return [selector.kind, selector.group ?? '', selector.name ?? ''].join(OPTION_VALUE_DELIMITER);
}

/**
 * Given an option value name like `{kind}_____{group}_____{name}`,
 * returns a DatasourceSelector to be used by the query data model.
 * @param optionValue
 */
export function optionValueToSelector(optionValue: string): DatasourceSelectValue {
  if (optionValue.startsWith(DATASOURCE_VARIABLE_VALUE_PREFIX)) {
    return optionValue.split(DATASOURCE_VARIABLE_VALUE_PREFIX)[1]!;
  }

  const words = optionValue.split(OPTION_VALUE_DELIMITER);
  const kind = words[0];
  const name = words[2];
  if (kind === undefined || name === undefined) {
    throw new Error('Invalid optionValue string');
  }
  return {
    kind,
    name: name === '' ? undefined : name,
  };
}

export function isVariableDatasource(value: DatasourceSelectValue | undefined): value is VariableName {
  return typeof value === 'string' && value.startsWith(VARIABLE_IDENTIFIER);
}

export const datasourceSelectValueToSelector = (
  value: DatasourceSelectValue | undefined,
  variables: VariableStateMap,
  datasourceSelectItemGroups: DatasourceSelectItemGroup[] | undefined
): DatasourceSelector | undefined => {
  if (!isVariableDatasource(value)) {
    return value;
  }

  const [variableName] = parseVariables(value);
  const variable = variables[variableName ?? ''];

  // If the variable is not defined or if its value is an array, we cannot determine a selector and return undefined
  if (!variable || Array.isArray(variable.value)) {
    return undefined;
  }

  const associatedDatasource = (datasourceSelectItemGroups || [])
    .flatMap((itemGroup) => itemGroup.items)
    .find((datasource) => datasource.name === variable.value);

  // If the variable value is not a datasource, we cannot determine a selector and return undefined
  if (associatedDatasource === undefined) {
    return undefined;
  }

  const datasourceSelector: DatasourceSelector = {
    kind: associatedDatasource.selector.kind,
    name: associatedDatasource.selector.name,
  };

  return datasourceSelector;
};

export const useDatasourceSelectValueToSelector = (
  value: DatasourceSelectValue,
  datasourcePluginKind: string
): DatasourceSelector => {
  const { queryGroupedDatasource } = useDatasourceStore();
  const datasources = queryGroupedDatasource?.({ kind: datasourcePluginKind }) || [];
  const variables = useVariableValues();
  if (!isVariableDatasource(value)) {
    return value;
  }

  return (
    datasourceSelectValueToSelector(value, variables, datasources) ?? {
      kind: datasourcePluginKind,
    }
  );
};
