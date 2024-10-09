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
import { useTheme, InputLabel, Stack, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import DotsVertical from 'mdi-material-ui/DotsVertical';
import CloseIcon from 'mdi-material-ui/Close';
import { useMemo, useState } from 'react';
import TreeNode from './TreeNode';
import {
  aggregationType,
  BinaryExpr,
  binaryOperatorType,
  matchType,
  nodeType,
  valueType,
  vectorMatchCardinality,
} from './promql/ast';

export type PromQLEditorProps = { completeConfig: CompleteConfiguration } & Omit<
  ReactCodeMirrorProps,
  'theme' | 'extensions'
>;

export function PromQLEditor({ completeConfig, ...rest }: PromQLEditorProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editorContent, setEditorContent] = useState(rest.value);
  const [isTreeViewVisible, setTreeViewVisible] = useState(true);

  const promQLExtension = useMemo(() => {
    return new PromQLExtension().activateLinter(false).setComplete(completeConfig).asExtension();
  }, [completeConfig]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShowTreeView = () => {
    setTreeViewVisible(!isTreeViewVisible); // Toggle TreeView visibility
    setAnchorEl(null);
  };

  const handleEditorChange = (value: string) => {
    setEditorContent(value);
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
              paddingRight: '40px',
            },
          }),
        ]}
        placeholder="Example: sum(rate(http_requests_total[5m]))"
        // TODO enable back: onChange={handleEditorChange}
      />
      {editorContent && editorContent.trim() !== '' && (
        <>
          <Tooltip title="Settings">
            <IconButton
              aria-label="Settings"
              aria-controls="long-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              sx={{ position: 'absolute', right: '5px', top: '5px' }}
              size="small"
            >
              <DotsVertical sx={{ fontSize: '18px' }} />
            </IconButton>
          </Tooltip>
          <Menu id="long-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleShowTreeView}>{isTreeViewVisible ? 'Hide Tree View' : 'Show Tree View'}</MenuItem>
          </Menu>
          {isTreeViewVisible && <TreeView content={editorContent} onClose={() => setTreeViewVisible(false)} />}
        </>
      )}
    </Stack>
  );
}

const TreeView = ({ content, onClose }: { content: string; onClose: () => void }) => {
  const theme = useTheme();

  console.log('content: ', content);

  // TEMP: Sample node for testing, representing the following expression:
  // rate(demo_api_request_duration_seconds_count{job="demo"}[5m]) / on(instance) group_left sum by(instance) (rate(demo_api_request_duration_seconds_count{job="demo"}[5m]))
  const sampleNode: BinaryExpr = {
    type: nodeType.binaryExpr,
    op: binaryOperatorType.div,
    lhs: {
      type: nodeType.call,
      func: {
        name: 'rate',
        argTypes: [valueType.matrix],
        variadic: 0,
        returnType: valueType.vector,
      },
      args: [
        {
          type: nodeType.matrixSelector,
          name: 'demo_api_request_duration_seconds_count',
          matchers: [
            {
              type: matchType.equal,
              name: 'job',
              value: 'demo',
            },
          ],
          range: 300, // 5 minutes in seconds
          offset: 0,
          timestamp: null,
          startOrEnd: null,
        },
      ],
    },
    rhs: {
      type: nodeType.aggregation,
      expr: {
        type: nodeType.call,
        func: {
          name: 'rate',
          argTypes: [valueType.matrix],
          variadic: 0,
          returnType: valueType.vector,
        },
        args: [
          {
            type: nodeType.matrixSelector,
            name: 'demo_api_request_duration_seconds_count',
            matchers: [
              {
                type: matchType.equal,
                name: 'job',
                value: 'demo',
              },
            ],
            range: 300, // 5 minutes in seconds
            offset: 0,
            timestamp: null,
            startOrEnd: null,
          },
        ],
      },
      op: aggregationType.sum,
      param: null,
      grouping: ['instance'],
      without: false,
    },
    matching: {
      card: vectorMatchCardinality.oneToOne,
      labels: ['instance'],
      on: true,
      include: [],
    },
    bool: false,
  };

  return (
    <div style={{ border: `1px solid ${theme.palette.divider}`, padding: '10px', position: 'relative' }}>
      <Tooltip title="Close tree view">
        <IconButton
          aria-label="Close tree view"
          onClick={onClose} // Trigger the onClose function
          sx={{ position: 'absolute', top: '5px', right: '5px' }}
          size="small"
        >
          <CloseIcon sx={{ fontSize: '18px' }} />
        </IconButton>
      </Tooltip>
      <TreeNode node={sampleNode} reverse={false} childIdx={0} />
    </div>
  );
};
