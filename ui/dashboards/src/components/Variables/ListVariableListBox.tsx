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

import React, { ForwardedRef, HTMLAttributes, ReactNode, forwardRef, useContext, useMemo } from 'react';
import { Checkbox, Divider } from '@mui/material';
import { VariableOption } from '@perses-dev/plugin-system';
import { DEFAULT_ALL_VALUE } from '@perses-dev/core';

// TODO: handle filtered options
export interface ListVariableListBoxContextValue {
  options: VariableOption[];
  selectedOptions: VariableOption[];
  filteredOptions: VariableOption[];
  allowAllValue: boolean;
  onChange: (selectedOptions: VariableOption[]) => void;
}

const ListVariableListBoxContext = React.createContext<ListVariableListBoxContextValue | undefined>(undefined);

export function useListVariableListBoxContext(): ListVariableListBoxContextValue {
  const ctx = useContext(ListVariableListBoxContext);
  if (!ctx) throw new Error('ListVariableListBoxContext not found');
  return ctx;
}

/*
 * Handles the logic for toggling the global select checkbox in the ListBox header.
 *
 * If all options are selected, it will deselect all options.
 * Except if filteredOptions is a subset of options, then it will only deselect the filtered options.
 *
 * If some options are selected, it will select all filtered options.
 *
 * If no options are selected, it will select all filtered options.
 * Should be not possible since a ListVariable has always at least one value.
 *
 * If allowAllValue is true, it will handle the special "All" option logic.
 * Main difference is if some options are selected and there is no filter, it will select the "All" option
 */
function handleGlobalSelectToggle(
  options: VariableOption[],
  selectedOptions: VariableOption[],
  filteredOptions: VariableOption[],
  isIndeterminate: boolean,
  isAllSelected: boolean,
  allowAllValue: boolean,
  onChange: (selectedOptions: VariableOption[]) => void
): void {
  if (isAllSelected) {
    if (filteredOptions.length !== options.length) {
      onChange(selectedOptions.filter((o) => !filteredOptions.includes(o)));
    } else {
      onChange([]);
    }
    return;
  }

  if (isIndeterminate) {
    if (allowAllValue) {
      if (filteredOptions.length === options.length) {
        if (selectedOptions[0]?.value === DEFAULT_ALL_VALUE) {
          onChange(options.filter((o) => o.value !== DEFAULT_ALL_VALUE));
        } else {
          onChange([{ label: DEFAULT_ALL_VALUE, value: DEFAULT_ALL_VALUE }]);
        }
      } else {
        if (filteredOptions.every((o) => selectedOptions.includes(o))) {
          onChange(selectedOptions.filter((o) => !filteredOptions.includes(o)));
        } else {
          onChange([...selectedOptions, ...filteredOptions.filter((o) => o.value !== DEFAULT_ALL_VALUE)]);
        }
      }
    } else {
      if (filteredOptions.length === options.length) {
        onChange(options);
      } else {
        if (filteredOptions.every((o) => selectedOptions.includes(o))) {
          onChange(selectedOptions.filter((o) => !filteredOptions.includes(o)));
        } else {
          onChange([...selectedOptions, ...filteredOptions]);
        }
      }
    }
    return;
  }

  // Nothing selected, so select filtered options
  onChange(filteredOptions);
}

export function ListVariableListBoxProvider({
  value,
  children,
}: {
  value: ListVariableListBoxContextValue;
  children: ReactNode;
}): React.ReactElement {
  return <ListVariableListBoxContext.Provider value={value}>{children}</ListVariableListBoxContext.Provider>;
}

export const ListVariableListBox = forwardRef(function ListVariableListBox(
  props: HTMLAttributes<HTMLUListElement>,
  ref: ForwardedRef<HTMLUListElement>
) {
  const { children, ...rest } = props;
  const { options, selectedOptions, filteredOptions, allowAllValue, onChange } = useListVariableListBoxContext();

  // Derived selection metadata for context listbox header
  const selectedCount = useMemo(() => selectedOptions.length, [selectedOptions]);
  const isIndeterminate = useMemo(
    () => options.length > 0 && selectedCount > 0 && selectedCount !== options.length,
    [selectedCount, options]
  );
  const isAllSelected = useMemo(() => options.length > 0 && selectedCount === options.length, [selectedCount, options]);

  return (
    <ul {...rest} ref={ref} role="listbox">
      <li style={{ display: 'flex', alignItems: 'center' }}>
        <Checkbox
          indeterminate={isIndeterminate}
          checked={isAllSelected}
          // intentionally not passing event to underlying handler to mimic previous behavior
          onChange={() =>
            handleGlobalSelectToggle(
              options,
              selectedOptions,
              filteredOptions,
              isIndeterminate,
              isAllSelected,
              allowAllValue,
              onChange
            )
          }
          sx={{ ml: 2 }}
        />
        <span>
          <strong>{selectedCount}</strong> Selected
        </span>
      </li>
      <Divider />
      {children}
    </ul>
  );
});
