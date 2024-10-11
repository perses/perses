// Copyright 2024 The Perses Authors
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
import { useTheme, CircularProgress, InputLabel, Stack, IconButton, Tooltip } from '@mui/material';
import FileTreeIcon from 'mdi-material-ui/FileTree';
import { useMemo, useState } from 'react';
import { ErrorAlert } from '@perses-dev/components';
import CloseIcon from 'mdi-material-ui/Close';
import { PrometheusDatasourceSelector } from '../model';
import { useParseQuery } from './utils';
import TreeNode from './TreeNode';

export type PromQLEditorProps = {
  completeConfig: CompleteConfiguration;
  datasource: PrometheusDatasourceSelector;
} & Omit<ReactCodeMirrorProps, 'theme' | 'extensions'>;

export function PromQLEditor({ completeConfig, datasource, ...rest }: PromQLEditorProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [isTreeViewVisible, setTreeViewVisible] = useState(true);

  const promQLExtension = useMemo(() => {
    return new PromQLExtension().activateLinter(false).setComplete(completeConfig).asExtension();
  }, [completeConfig]);

  const handleShowTreeView = () => {
    setTreeViewVisible(!isTreeViewVisible);
  };

  const { data: parseQueryResponse, isLoading, error } = useParseQuery(rest.value ?? '', datasource);
  let errorMessage = 'An unknown error occurred';
  if (error && error instanceof Error) {
    if (error.message.trim() === '404 page not found') {
      errorMessage = 'Tree view is available only for datasources whose APIs comply with Prometheus 3.0 specifications';
    } else {
      errorMessage = error.message;
    }
  }

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
        PromQL Expression
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
              paddingRight: '40px',
            },
          }),
        ]}
        placeholder="Example: sum(rate(http_requests_total[5m]))"
      />
      {rest.value && rest.value.trim() !== '' && (
        <>
          <Tooltip title={isTreeViewVisible ? 'Hide Tree View' : 'Show Tree View'}>
            <IconButton
              aria-label={isTreeViewVisible ? 'Hide Tree View' : 'Show Tree View'}
              onClick={handleShowTreeView}
              sx={{ position: 'absolute', right: '5px', top: '5px' }}
              size="small"
            >
              <FileTreeIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          </Tooltip>
          {isTreeViewVisible && (
            <div style={{ border: `1px solid ${theme.palette.divider}`, position: 'relative' }}>
              <Tooltip title="Close tree view">
                <IconButton
                  aria-label="Close tree view"
                  onClick={() => setTreeViewVisible(false)}
                  sx={{ position: 'absolute', top: '5px', right: '5px' }}
                  size="small"
                >
                  <CloseIcon sx={{ fontSize: '18px' }} />
                </IconButton>
              </Tooltip>
              {error ? (
                <ErrorAlert error={{ name: 'Tree view rendering error', message: errorMessage }} />
              ) : (
                <div style={{ padding: '10px' }}>
                  {isLoading ? (
                    <CircularProgress />
                  ) : parseQueryResponse?.data ? (
                    <TreeNode node={parseQueryResponse.data} reverse={false} childIdx={0} />
                  ) : null}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Stack>
  );
}
