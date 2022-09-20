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

import * as DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Box } from '@mui/material';
import { PanelProps } from '@perses-dev/plugin-system';
import { MarkdownPanelOptions } from './markdown-panel-model';

export type MarkdownPanelProps = PanelProps<MarkdownPanelOptions>;

// Overall, this panel does:
// 1. text --> html (with support for original markdown and GFM)
// 2. sanitize the html to prevent XSS attacks

export function MarkdownPanel(props: MarkdownPanelProps) {
  const {
    definition: {
      options: { text },
    },
  } = props;

  const html = marked.parse(text, { gfm: true });
  const sanitizedHTML = DOMPurify.sanitize(html);

  return <Box sx={{ height: '100%', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
}
