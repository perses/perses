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
import { Select, SelectProps, MenuItem, Stack, Divider, ListItemText, Chip, IconButton, Box } from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import { ReactElement, useMemo } from 'react';
import { DatasourceSelectItemSelector, useListDatasourceSelectItems } from '../runtime';

// Props on MUI Select that we don't want people to pass because we're either redefining them or providing them in
// this component
type OmittedMuiProps = 'children' | 'value' | 'onChange';

export interface DatasourceSelectProps extends Omit<SelectProps<string>, OmittedMuiProps> {
  value: DatasourceSelector;
  onChange: (next: DatasourceSelector) => void;
  datasourcePluginKind: string;
  project?: string;
}

/**
 * Displays a MUI input for selecting a Datasource of a particular kind. Note: The 'value' and `onChange` handler for
 * the input deal with a `DatasourceSelector`.
 */
export function DatasourceSelect(props: DatasourceSelectProps): ReactElement {
  const { datasourcePluginKind, value, project, onChange, ...others } = props;
  const { data, isLoading } = useListDatasourceSelectItems(datasourcePluginKind, project);
  // Rebuild the group of the value if not provided
  const defaultValue = useMemo(() => {
    const group = (data ?? [])
      .flatMap((itemGroup) => itemGroup.items)
      .find((item) => {
        return value.kind === item.selector.kind && value.name === item.selector.name && !item.overridden;
      })?.selector.group;
    return { ...value, group };
  }, [value, data]);

  // Convert the datasource list into menu items with name/group?/value strings that the Select input can work with
  const menuItems = useMemo(() => {
    return (data ?? []).map((itemGroup) => ({
      group: itemGroup.group,
      editLink: itemGroup.editLink,
      items: itemGroup.items.map((item) => ({
        name: item.name,
        overriding: item.overriding,
        overridden: item.overridden,
        saved: item.saved ?? true,
        group: item.selector.group,
        value: selectorToOptionValue(item.selector),
      })),
    }));
  }, [data]);

  // While loading available values, just use an empty string so MUI select doesn't warn about values out of range
  const optionValue = isLoading ? '' : selectorToOptionValue(defaultValue);

  // When the user makes a selection, convert the string option value back to a DatasourceSelector
  const handleChange: SelectProps<string>['onChange'] = (e) => {
    const next = optionValueToSelector(e.target.value);
    onChange(next);
  };

  // We use a fake action event when we click on the action of the chip (hijack the "delete" feature).
  // This is because the href link action is on the `deleteIcon` property already, but the `onDelete` property
  // controls its visibility.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const fakeActionEvent = (): void => {};

  // TODO:
  //  - Does this need a loading indicator of some kind?
  //  - The group's edit link is not clickable once selected.
  //  - The group's edit link is disabled if datasource is overridden.
  //    Ref: https://github.com/mui/material-ui/issues/36572
  return (
    <Select {...others} value={optionValue} onChange={handleChange}>
      {menuItems.map((menuItemGroup) => [
        <Divider key={`${menuItemGroup.group}-divider`} />,
        ...menuItemGroup.items.map((menuItem) => (
          <MenuItem key={menuItem.value} value={menuItem.value} disabled={menuItem.overridden || !menuItem.saved}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
              <ListItemText>
                <DatasourceName
                  name={menuItem.name}
                  overridden={menuItem.overridden}
                  overriding={menuItem.overriding}
                />
              </ListItemText>
              {!menuItem.saved && <ListItemText>Save the dashboard to enable this datasource</ListItemText>}
              <ListItemText style={{ textAlign: 'right' }}>
                {menuItemGroup.group && menuItemGroup.group.length > 0 && (
                  <Chip
                    disabled={false}
                    label={menuItemGroup.group}
                    size="small"
                    onDelete={menuItemGroup.editLink ? fakeActionEvent : undefined}
                    deleteIcon={
                      menuItemGroup.editLink ? (
                        <IconButton href={menuItemGroup.editLink} target="_blank">
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      ) : undefined
                    }
                  />
                )}
              </ListItemText>
            </Stack>
          </MenuItem>
        )),
      ])}
    </Select>
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
function selectorToOptionValue(selector: DatasourceSelectItemSelector): string {
  return [selector.kind, selector.group ?? '', selector.name ?? ''].join(OPTION_VALUE_DELIMITER);
}

/**
 * Given an option value name like `{kind}_____{group}_____{name}`,
 * returns a DatasourceSelector to be used by the query data model.
 * @param optionValue
 */
function optionValueToSelector(optionValue: string): DatasourceSelector {
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
