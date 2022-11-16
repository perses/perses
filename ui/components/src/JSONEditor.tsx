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

import { useEffect, useState } from 'react';
import { TextField } from '@mui/material';

interface JSONEditorProps<Spec> {
  value: Spec;
  onChange?: (next: Spec) => void;
}

export function JSONEditor<T>(props: JSONEditorProps<T>) {
  const [value, setValue] = useState(() => JSON.stringify(props.value, null, 2));
  const [invalidJSON, setInvalidJSON] = useState(false);

  useEffect(() => {
    setValue(JSON.stringify(props.value, null, 2));
    setInvalidJSON(false);
  }, [props.value]);

  // TODO: replace with CodeMirror editor
  return (
    <TextField
      label="JSON"
      error={invalidJSON}
      helperText={invalidJSON ? 'Invalid JSON' : ''}
      multiline
      fullWidth
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
      }}
      onBlur={() => {
        try {
          const json = JSON.parse(value ?? '{}');
          setInvalidJSON(false);
          if (props.onChange !== undefined) {
            props.onChange(json);
          }
        } catch (e) {
          setInvalidJSON(true);
        }
      }}
    />
  );
}
