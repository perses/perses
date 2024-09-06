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

import { useMemo } from 'react';
import { useTheme } from '@mui/material';
import CodeMirror, { EditorView, ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { CompletionConfig, TraceQLExtension } from './TraceQLExtension';

export interface TraceQLEditorProps extends Omit<ReactCodeMirrorProps, 'theme' | 'extensions'> {
  completeConfig: CompletionConfig;
}

export function TraceQLEditor({ completeConfig, ...rest }: TraceQLEditorProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const traceQLExtension = useMemo(() => {
    return TraceQLExtension(completeConfig);
  }, [completeConfig]);

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
      extensions={[EditorView.lineWrapping, traceQLExtension]}
    />
  );
}
