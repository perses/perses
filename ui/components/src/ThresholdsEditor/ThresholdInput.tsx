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

import { RefObject, useState } from 'react';
import { Stack, FormLabel, TextField, IconButton } from '@mui/material';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { ThresholdColorPicker } from './ThresholdColorPicker';

export interface ThresholdInputProps {
  label: string;
  color: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onColorChange: (color: string) => void;
  onBlur: () => void;
  onDelete: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function ThresholdInput({
  inputRef,
  label,
  color,
  value,
  onChange,
  onColorChange,
  onBlur,
  onDelete,
}: ThresholdInputProps) {
  const [key, setKey] = useState(0); // use key to cause input to lose focus when pressing enter
  return (
    <Stack flex={1} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <ThresholdColorPicker label={label} color={color} onColorChange={onColorChange} />
      <FormLabel htmlFor={label}>{label}</FormLabel>
      <TextField
        id={label}
        key={key}
        inputRef={inputRef}
        type="number"
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onBlur();
            setKey(key + 1);
          }
        }}
      />
      <IconButton aria-label={`delete threshold ${label}`} size="small" onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
    </Stack>
  );
}
