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

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Box, Link, Paper, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { PanelProps } from '@perses-dev/plugin-system';
import { MarkdownPanelOptions } from './markdown-panel-model';

export type MarkdownPanelProps = PanelProps<MarkdownPanelOptions>;

function createMarkdownPanelStyles() {
  return {
    // Make the content scrollable
    height: '100%',
    overflowY: 'auto',
    // Ignore initial margin
    '& :first-child': {
      marginTop: 0,
    },
    // <code>
    '& code': { fontSize: '0.85em' },
    '& :not(pre) code': {
      padding: '0.2em 0.4em',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
    },
    '& pre': {
      padding: '1.2em',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
    },
    // <table>
    '& table tr:last-child td': {
      borderBottom: 0,
    },
    // <li>
    '& li + li': {
      marginTop: '0.25em',
    },
  };
}

// ReactMarkdown: Convert markdown text to HTML
// remarkGfm: Support Github Flavored Markdown (in addition to original markdown syntax)
// rehypeRaw: Allow HTML to be embedded in the markdown text
// rehypeSanitize: Sanitize the HTML, i.e. prevent XSS attacks by removing the vectors for these attacks
export function MarkdownPanel(props: MarkdownPanelProps) {
  const { spec } = props;
  const { text } = spec;

  const memoizedComponent = useMemo(() => {
    return (
      <Box sx={createMarkdownPanelStyles}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          /* eslint-disable @typescript-eslint/no-unused-vars */
          components={{
            a: ({ node, ...props }) => <Link {...props} />,
            table: ({ node, ...props }) => (
              <Paper variant="outlined" sx={{ width: 'fit-content' }}>
                <Table size="small" sx={{ width: 'fit-content' }} {...props} />
              </Paper>
            ),
            thead: ({ node, ...props }) => <TableHead {...props} />,
            tbody: ({ node, ...props }) => <TableBody {...props} />,
            tr: ({ node, ...props }) => <TableRow {...props} />,
            th: ({ style, children }) => <TableCell sx={style}>{children}</TableCell>,
            td: ({ style, children }) => <TableCell sx={style}>{children}</TableCell>,
          }}
        >
          {text}
        </ReactMarkdown>
      </Box>
    );
  }, [text]);

  return memoizedComponent;
}
