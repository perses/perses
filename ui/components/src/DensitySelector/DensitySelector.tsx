// Copyright 2024 The Perses Authors
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

const DENSITY_OPTIONS: Array<{ id: DensityOption; label: string }> = [
  { id: 'compact', label: 'Compact' },
  { id: 'standard', label: 'Standard' },
];

export type DensityOption = 'compact' | 'standard';

export interface DensitySelectorProps {
  onChange: (density: DensityOption) => void;
  value?: DensityOption;
}

export function DensitySelector({ onChange, value = 'standard' }: DensitySelectorProps) {
  const handleSortChange = (_: unknown, { id }: { id: DensityOption }) => {
    onChange(id);
  };

  return (
    <OptionsEditorControl
      label="Density"
      control={
        <SettingsAutocomplete
          value={DENSITY_OPTIONS.find((o) => o.id === value)}
          options={DENSITY_OPTIONS}
          getOptionLabel={(o) => o.label}
          onChange={handleSortChange}
          disableClearable
        />
      }
    />
  );
}
