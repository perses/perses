// Copyright 2025 The Perses Authors
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
import { ReactElement, useMemo, useState } from 'react';
import { ErrorAlert } from '@perses-dev/components';
import CloseIcon from 'mdi-material-ui/Close';
import { useReplaceVariablesInString } from '@perses-dev/plugin-system';
import { PrometheusDatasourceSelector } from '../model';
import { replacePromBuiltinVariables } from '../plugins/prometheus-time-series-query/replace-prom-builtin-variables';
import { useParseQuery } from './query';
import TreeNode from './TreeNode';

const treeViewStr = 'Tree View';
const treeViewOpenStr = 'Open ' + treeViewStr;
const treeViewCloseStr = 'Close ' + treeViewStr;

export type PromQLEditorProps = {
  completeConfig: CompleteConfiguration;
  datasource: PrometheusDatasourceSelector;
} & Omit<ReactCodeMirrorProps, 'theme' | 'extensions'>;

export function PromQLEditor({ completeConfig, datasource, ...rest }: PromQLEditorProps): ReactElement {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [isTreeViewVisible, setTreeViewVisible] = useState(false);

  const promQLExtension = useMemo(() => {
    return new PromQLExtension().activateLinter(false).setComplete(completeConfig).asExtension();
  }, [completeConfig]);

  let queryExpr = useReplaceVariablesInString(rest.value);
  if (queryExpr) {
    // TODO placeholder values for steps to be replaced with actual values
    // Looks like providing proper values involves some refactoring: currently we'd need to rely on the timeseries query context,
    // but these step values are actually computed independently / before the queries are getting fired, so it's useless to fire
    // queries here, so maybe we should extract this part to independant hook(s), to be reused here?
    queryExpr = replacePromBuiltinVariables(queryExpr, 12345, 12345);
  }

  const { data: parseQueryResponse, isLoading, error } = useParseQuery(queryExpr ?? '', datasource, isTreeViewVisible);

  const handleShowTreeView = (): void => {
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
      {queryExpr && (
        <>
          <Tooltip title={isTreeViewVisible ? treeViewCloseStr : treeViewOpenStr}>
            <IconButton
              aria-label={isTreeViewVisible ? treeViewCloseStr : treeViewOpenStr}
              onClick={handleShowTreeView}
              sx={{ position: 'absolute', right: '5px', top: '5px' }}
              size="small"
            >
              <FileTreeIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          </Tooltip>
          {isTreeViewVisible && (
            <div style={{ border: `1px solid ${theme.palette.divider}`, position: 'relative' }}>
              <Tooltip title={treeViewCloseStr}>
                <IconButton
                  aria-label={treeViewCloseStr}
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
                    name: `${treeViewStr} not available`,
                    message: error.message,
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: `${theme.spacing(1.5)} ${theme.spacing(1.5)} 0 ${theme.spacing(1.5)}`, // let paddingBottom at 0 because nodes have margin-bottom
                    overflowX: 'auto',
                    backgroundColor: theme.palette.background.default,
                  }}
                >
                  {isLoading ? (
                    <CircularProgress />
                  ) : parseQueryResponse?.data ? (
                    <TreeNode node={parseQueryResponse.data} reverse={false} childIdx={0} datasource={datasource} />
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
