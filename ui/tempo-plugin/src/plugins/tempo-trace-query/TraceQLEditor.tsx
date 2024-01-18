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

import { useTheme } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';

export function TraceQLEditor({ ...rest }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <CodeMirror
      {...rest}
      style={{ border: `1px solid ${theme.palette.divider}` }}
      theme={isDarkMode ? 'dark' : 'light'}
      basicSetup={{
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
        foldGutter: false,
      }}
    />
  );
}
