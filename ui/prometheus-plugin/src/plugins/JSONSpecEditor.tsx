// Copyright 2022 The Perses Authors
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

import { useEffect, useRef, useState } from 'react';
import { TextField } from '@mui/material';
import { OptionsEditorProps } from '@perses-dev/plugin-system';

export function JSONSpecEditor<T>(props: OptionsEditorProps<T>) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(JSON.stringify(props.value, null, 2));
  const [invalidJSON, setInvalidJSON] = useState(false);

  useEffect(() => {
    setValue(JSON.stringify(props.value, null, 2));
    setInvalidJSON(false);
  }, [props.value]);

  return (
    <TextField
      label="JSON"
      error={invalidJSON}
      helperText={invalidJSON ? 'Invalid JSON' : ''}
      multiline
      inputRef={ref}
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
      }}
      onBlur={() => {
        try {
          const json = JSON.parse(value ?? '{}');
          setInvalidJSON(false);
          props.onChange(json);
        } catch (e) {
          setInvalidJSON(true);
        }
      }}
    />
  );
}
