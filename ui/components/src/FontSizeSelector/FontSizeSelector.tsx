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
  'Default',
  '12',
  '14',
  '16',
  '20',
  '24',
  '28',
  '32',
  '36',
  '40',
  '48',
  '56',
  '64',
  '72',
  '96',
  '128',
  '160',
  '192',
] as const;
export type FontSizeOption = (typeof FONT_SIZE_OPTIONS)[number];

export interface FontSizeSelectorProps {
  value: FontSizeOption;
  onChange: (fontSize: FontSizeOption) => void;
}

export function FontSizeSelector({ value, onChange }: FontSizeSelectorProps) {
  const handleFontSizeChange = (_: unknown, newValue: { id: FontSizeOption; label: FontSizeOption }) => {
    onChange(newValue.id);
  };

  return (
    <OptionsEditorControl
      label="Font Size"
      control={
        <SettingsAutocomplete
          value={{ id: value, label: value }}
          options={FONT_SIZE_OPTIONS.map((fontSize) => ({ id: fontSize, label: fontSize }))}
          getOptionLabel={(o) => o.label}
          onChange={handleFontSizeChange}
          disableClearable
        />
      }
    />
  );
}
