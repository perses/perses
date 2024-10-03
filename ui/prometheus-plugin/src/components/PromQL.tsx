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

import CodeMirror, { ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { PromQLExtension, CompleteConfiguration } from '@prometheus-io/codemirror-promql';
import { EditorView } from '@codemirror/view';
import { useTheme, InputLabel, Stack } from '@mui/material';
import { useMemo } from 'react';

export type PromQLEditorProps = { completeConfig: CompleteConfiguration } & Omit<
  ReactCodeMirrorProps,
  'theme' | 'extensions'
>;

export function PromQLEditor({ completeConfig, ...rest }: PromQLEditorProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const promQLExtension = useMemo(() => {
    return new PromQLExtension().activateLinter(false).setComplete(completeConfig).asExtension();
  }, [completeConfig]);

  return (
    <Stack position="relative">
      <InputLabel // reproduce the same kind of input label that regular MUI TextFields have
        shrink
        sx={{
          position: 'absolute',
          top: '-8px',
          left: '10px',
          padding: '0 4px',
          color: theme.palette.text.primary,
          zIndex: 1,
        }}
      >
        PromQL expression
      </InputLabel>
      <CodeMirror
        {...rest}
        style={{ border: `1px solid ${theme.palette.divider}` }}
        theme={isDarkMode ? 'dark' : 'light'}
        basicSetup={{
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          foldGutter: false,
        }}
        extensions={[
          EditorView.lineWrapping,
          promQLExtension,
          EditorView.theme({
            '.cm-content': {
              paddingTop: '8px',
              paddingBottom: '8px',
            },
          }),
        ]}
        placeholder="sum(rate(http_requests_total[5m]))"
      />
    </Stack>
  );
}
