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

const ALIGN_OPTIONS: Array<{ id: AlignOption; label: string }> = [
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right' },
];

export type AlignOption = 'left' | 'center' | 'right';

export interface AlignSelectorProps {
  onChange: (align: AlignOption) => void;
  value?: AlignOption;
}

export function AlignSelector({ onChange, value = 'left' }: AlignSelectorProps) {
  const handleSortChange = (_: unknown, { id }: { id: AlignOption }) => {
    onChange(id);
  };

  return (
    <OptionsEditorControl
      label="Align"
      control={
        <SettingsAutocomplete
          value={ALIGN_OPTIONS.find((o) => o.id === value)}
          options={ALIGN_OPTIONS}
          getOptionLabel={(o) => o.label}
          onChange={handleSortChange}
          disableClearable
        />
      }
    />
  );
}
