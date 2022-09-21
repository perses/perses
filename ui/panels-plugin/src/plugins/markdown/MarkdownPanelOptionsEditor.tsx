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

import { ChangeEvent } from 'react';
import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { TextField } from '@mui/material';
import { MarkdownPanelOptions } from './markdown-panel-model';

export type MarkdownPanelOptionsEditorProps = OptionsEditorProps<MarkdownPanelOptions>;

export function MarkdownPanelOptionsEditor(props: MarkdownPanelOptionsEditorProps) {
  const {
    onChange,
    value: { text },
  } = props;

  console.log('in MarkdownPanelOptionsEditor');
  console.log({ text });
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ text: e.target.value });
  };

  return <TextField label="Text" multiline maxRows={20} value={text} onChange={handleChange} />;
}
