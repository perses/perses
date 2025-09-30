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

import React, { ForwardedRef, HTMLAttributes, ReactNode, forwardRef, useContext, useMemo } from 'react';
import { Checkbox, Divider } from '@mui/material';
import { VariableOption } from '@perses-dev/plugin-system';
import { DEFAULT_ALL_VALUE } from '@perses-dev/core';

// TODO: handle filtered options
export interface ListVariableListBoxContextValue {
  selectedOptions: VariableOption[];
  options: VariableOption[];
  allowAllValue: boolean;
  onChange: (selectedOptions: VariableOption[]) => void;
}

const ListVariableListBoxContext = React.createContext<ListVariableListBoxContextValue | undefined>(undefined);

export function useListVariableListBoxContext(): ListVariableListBoxContextValue {
  const ctx = useContext(ListVariableListBoxContext);
  if (!ctx) throw new Error('ListVariableListBoxContext not found');
  return ctx;
}

function handleGlobalSelectToggle(
  selectedOptions: VariableOption[],
  options: VariableOption[],
  isIndeterminate: boolean,
  isAllSelected: boolean,
  allowAllValue: boolean,
  onChange: (selectedOptions: VariableOption[]) => void
): void {
  if (isAllSelected) {
    console.log('test2');
    onChange([]);
    return;
  }

  if (isIndeterminate) {
    if (allowAllValue) {
      if (selectedOptions[0]?.value === DEFAULT_ALL_VALUE) {
        onChange(options.slice(1));
      } else {
        onChange([{ label: DEFAULT_ALL_VALUE, value: DEFAULT_ALL_VALUE }]);
      }
    } else {
      console.log('test');
      onChange(options);
    }
    return;
  }

  // Nothing selected, so select all options
  onChange(options);
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
  const { selectedOptions, options, allowAllValue, onChange } = useListVariableListBoxContext();

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
            handleGlobalSelectToggle(selectedOptions, options, isIndeterminate, isAllSelected, allowAllValue, onChange)
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
