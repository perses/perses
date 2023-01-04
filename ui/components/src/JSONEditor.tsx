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

import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import { useTheme } from '@mui/material';
import { ReactCodeMirrorProps } from '@uiw/react-codemirror/src';

type JSONEditorProps<T> = Omit<ReactCodeMirrorProps, 'onBlur' | 'theme' | 'extensions' | 'onChange' | 'value'> & {
  value: T;
  onChange?: (next: T) => void;
};

export function JSONEditor<T>(props: JSONEditorProps<T>) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [value, setValue] = useState(() => JSON.stringify(props.value, null, 2));

  useEffect(() => {
    setValue(JSON.stringify(props.value, null, 2));
  }, [props.value]);

  return (
    <CodeMirror
      {...props}
      style={{ border: `1px solid ${theme.palette.divider}` }}
      theme={isDarkMode ? 'dark' : 'light'}
      extensions={[json(), linter(jsonParseLinter()), lintGutter()]}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
      }}
      onBlur={() => {
        try {
          const json = JSON.parse(value ?? '{}');
          if (props.onChange !== undefined) {
            props.onChange(json);
          }
        } catch (e) {
          // ignore this error
        }
      }}
    />
  );
}
