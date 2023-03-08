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
import * as DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Box, Theme } from '@mui/material';
import { PanelProps } from '@perses-dev/plugin-system';
import { PersesChartsTheme, useChartsTheme } from '@perses-dev/components';
import { MarkdownPanelOptions } from './markdown-panel-model';

export type MarkdownPanelProps = PanelProps<MarkdownPanelOptions>;

function createMarkdownPanelStyles(theme: Theme, chartsTheme: PersesChartsTheme) {
  return {
    padding: `${chartsTheme.container.padding.default}px`,
    // Make the content scrollable
    height: '100%',
    overflowY: 'auto',
    // Ignore top margin on the first element.
    '& :first-of-type': {
      marginTop: 0,
    },
    // Styles for headers
    '& h1': {
      fontSize: '2em',
    },
    // Styles for <code>
    '& code': { fontSize: '0.85em' },
    '& :not(pre) code': {
      padding: '0.2em 0.4em',
      backgroundColor: theme.palette.grey[100],
      borderRadius: '4px',
    },
    '& pre': {
      padding: '1.2em',
      backgroundColor: theme.palette.grey[100],
      borderRadius: '4px',
    },
    // Styles for <table>
    '& table, & th, & td': {
      padding: '0.6em',
      border: `1px solid ${theme.palette.grey[300]}`,
      borderCollapse: 'collapse',
    },
    // Styles for <li>
    '& li + li': {
      marginTop: '0.25em',
    },
    // Styles for <a>
    '& a': {
      color: theme.palette.primary.main,
    },
  };
}

// Convert markdown to HTML
// Supports original markdown and GitHub Flavored markdown
function markdownToHTML(text: string): string {
  return marked.parse(text, { gfm: true });
}

// Prevent XSS attacks by removing the vectors for attacks
function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html);
}

export function MarkdownPanel(props: MarkdownPanelProps) {
  const {
    spec: { text },
  } = props;
  const chartsTheme = useChartsTheme();

  const html = useMemo(() => markdownToHTML(text), [text]);
  const sanitizedHTML = useMemo(() => sanitizeHTML(html), [html]);

  return (
    <Box
      sx={(theme) => createMarkdownPanelStyles(theme, chartsTheme)}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}
