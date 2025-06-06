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

import { ReactElement, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import { useTheme } from '@mui/material';
import { ReactCodeMirrorProps } from '@uiw/react-codemirror/src';

type JSONEditorProps<T> = Omit<ReactCodeMirrorProps, 'onBlur' | 'theme' | 'extensions' | 'onChange' | 'value'> & {
  value: T;
  placeholder?: string;
  onChange?: (next: string) => void;
};

export function JSONEditor<T>(props: JSONEditorProps<T>): ReactElement {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [value, setValue] = useState(() => JSON.stringify(props.value, null, 2));
  const [lastProcessedValue, setLastProcessedValue] = useState<string>(value);

  return (
    <CodeMirror
      {...props}
      style={{ border: `1px solid ${theme.palette.divider}` }}
      theme={isDarkMode ? 'dark' : 'light'}
      extensions={[json(), linter(jsonParseLinter()), lintGutter()]}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        // Trigger the provided onChange callback in real-time
        if (props.onChange) {
          props.onChange(newValue);
        }
      }}
      onBlur={() => {
        // Don't trigger the provided onChange if the last processed value is equal to the current value.
        // This prevents e.g CTRL+F to trigger value refresh downstream, which would cause the embedded
        // find & replace interface to close immediately.
        if (lastProcessedValue !== value && props.onChange !== undefined) {
          props.onChange(value);
          setLastProcessedValue(value);
        }
      }}
      placeholder={props.placeholder}
    />
  );
}
