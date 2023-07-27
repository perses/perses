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

const FONT_SIZE_OPTIONS = [
  { id: 'default', label: 'Default', value: undefined },
  { id: '12', label: '12', value: 12 },
  { id: '14', label: '14', value: 14 },
  { id: '16', label: '16', value: 16 },
  { id: '20', label: '20', value: 20 },
  { id: '24', label: '24', value: 24 },
  { id: '28', label: '28', value: 28 },
  { id: '32', label: '32', value: 32 },
  { id: '36', label: '36', value: 36 },
  { id: '40', label: '40', value: 40 },
  { id: '48', label: '48', value: 48 },
  { id: '56', label: '56', value: 56 },
  { id: '64', label: '64', value: 64 },
  { id: '72', label: '72', value: 72 },
  { id: '96', label: '96', value: 96 },
  { id: '128', label: '128', value: 128 },
  { id: '160', label: '160', value: 160 },
  { id: '192', label: '192', value: 192 },
];

export type FontSizeOption = number | undefined;

export interface FontSizeSelectorProps {
  value: FontSizeOption;
  onChange: (fontSize: FontSizeOption) => void;
}

export function FontSizeSelector({ value, onChange }: FontSizeSelectorProps) {
  const handleFontSizeChange = (_: unknown, { value }: { value: FontSizeOption }) => {
    onChange(value);
  };

  return (
    <OptionsEditorControl
      label="Font Size"
      control={
        <SettingsAutocomplete
          value={FONT_SIZE_OPTIONS.find((o) => o.value === value)}
          options={FONT_SIZE_OPTIONS}
          getOptionLabel={(o) => o.label}
          onChange={handleFontSizeChange}
          disableClearable
        />
      }
    />
  );
}
