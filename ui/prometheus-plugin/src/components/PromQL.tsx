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
import { useReplaceVariablesInString } from '@perses-dev/plugin-system';
import { PrometheusDatasourceSelector } from '../model';
import { useParseQuery } from './parse';
import TreeNode from './TreeNode';

export type PromQLEditorProps = {
  completeConfig: CompleteConfiguration;
  datasource: PrometheusDatasourceSelector;
} & Omit<ReactCodeMirrorProps, 'theme' | 'extensions'>;

export function PromQLEditor({ completeConfig, datasource, ...rest }: PromQLEditorProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [isTreeViewVisible, setTreeViewVisible] = useState(false);

  const promQLExtension = useMemo(() => {
    return new PromQLExtension().activateLinter(false).setComplete(completeConfig).asExtension();
  }, [completeConfig]);

  const queryExpr = useReplaceVariablesInString(rest.value);

  const { data: parseQueryResponse, isLoading, error } = useParseQuery(queryExpr ?? '', datasource);
  let errorMessage = 'An unknown error occurred';
  let isGenericError = false;
  // If the error is 404 page not found, it likely means the datasource does not support the tree view.
  // In that case we want a different behavior, see below.
  if (error && error instanceof Error && error.message.trim() !== '404 page not found') {
    errorMessage = error.message;
    isGenericError = true;
  }

  const treeViewText = 'Tree View';
  const treeViewActionTexts = {
    open: 'Open ' + treeViewText,
    close: 'Close ' + treeViewText,
  };

  const handleShowTreeView = () => {
    setTreeViewVisible(!isTreeViewVisible);
  };

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
              paddingRight: '40px', // offset for the tree view button
            },
          }),
        ]}
        placeholder="Example: sum(rate(http_requests_total[5m]))"
      />
      {queryExpr?.trim() !== '' && (
        <>
          {isGenericError ? (
            // Display the error without any close button, tree view etc when it's a generic error
            <div style={{ border: `1px solid ${theme.palette.divider}` }}>
              <ErrorAlert error={{ name: 'Parse query error', message: errorMessage }} />
            </div>
          ) : (
            // Otherwise include the logic to show/hide the tree view
            <>
              <Tooltip title={isTreeViewVisible ? treeViewActionTexts.close : treeViewActionTexts.open}>
                <IconButton
                  aria-label={isTreeViewVisible ? treeViewActionTexts.close : treeViewActionTexts.open}
                  onClick={handleShowTreeView}
                  sx={{ position: 'absolute', right: '5px', top: '5px' }}
                  size="small"
                >
                  <FileTreeIcon sx={{ fontSize: '18px' }} />
                </IconButton>
              </Tooltip>
              {isTreeViewVisible && (
                <div style={{ border: `1px solid ${theme.palette.divider}`, position: 'relative' }}>
                  <Tooltip title={treeViewActionTexts.close}>
                    <IconButton
                      aria-label={treeViewActionTexts.close}
                      onClick={() => setTreeViewVisible(false)}
                      sx={{ position: 'absolute', top: '5px', right: '5px' }}
                      size="small"
                    >
                      <CloseIcon sx={{ fontSize: '18px' }} />
                    </IconButton>
                  </Tooltip>
                  {error ? (
                    // Here the user is able to hide the error alert
                    <ErrorAlert
                      error={{
                        name: 'Tree view not supported',
                        message:
                          'Tree view is available only for datasources whose APIs comply with Prometheus 3.0 specifications',
                      }}
                    />
                  ) : (
                    <div
                      style={{ padding: '10px', overflowX: 'auto', backgroundColor: theme.palette.background.default }}
                    >
                      {isLoading ? (
                        <CircularProgress />
                      ) : parseQueryResponse?.data ? (
                        <TreeNode node={parseQueryResponse.data} reverse={false} />
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </Stack>
  );
}
