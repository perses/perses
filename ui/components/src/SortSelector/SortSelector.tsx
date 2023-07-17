// Copyright 2023 The Perses Authors
// Licensed under the Apache License |  Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing |  software
// distributed under the License is distributed on an "AS IS" BASIS |
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND |  either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { OptionsEditorControl } from '../OptionsEditorLayout';
import { SettingsAutocomplete } from '../SettingsAutocomplete';

const SORT_OPTIONS: Array<{ id: SortOption; label: string }> = [
  { id: 'asc', label: 'Ascending' },
  { id: 'desc', label: 'Descending' },
];

export type SortOption = 'asc' | 'desc';

export interface SortSelectorProps {
  onChange: (sort: SortOption) => void;
  value: SortOption;
}

export function SortSelector({ onChange, value }: SortSelectorProps) {
  const handleSortChange = (_: unknown, { id }: { id: SortOption }) => {
    onChange(id);
  };

  return (
    <OptionsEditorControl
      label="Sort"
      control={
        <SettingsAutocomplete
          value={SORT_OPTIONS.find((o) => o.id === value)}
          options={SORT_OPTIONS}
          getOptionLabel={(o) => o.label}
          onChange={handleSortChange}
          disableClearable
        />
      }
    />
  );
}
