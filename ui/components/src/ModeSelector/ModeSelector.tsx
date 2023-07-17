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

const MODE_OPTIONS: Array<{ id: ModeOption; label: string }> = [
  { id: 'value', label: 'Value' },
  { id: 'percentage', label: 'Percentage' },
];

export type ModeOption = 'value' | 'percentage';

export interface ModeSelectorProps {
  disablePercentageMode: boolean;
  onChange: (mode: ModeOption) => void;
  value: ModeOption;
}

export function ModeSelector({ disablePercentageMode, onChange, value }: ModeSelectorProps) {
  const handleModeChange = (_: unknown, { id }: { id: ModeOption }) => {
    onChange(id);
  };

  return (
    <OptionsEditorControl
      label="Mode"
      control={
        <SettingsAutocomplete
          value={MODE_OPTIONS.find((o) => o.id === value)}
          options={MODE_OPTIONS}
          getOptionLabel={(o) => o.label}
          getOptionDisabled={(o) => o.id === 'percentage' && disablePercentageMode}
          onChange={handleModeChange}
          disableClearable
        />
      }
    />
  );
}
