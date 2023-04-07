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

import { OptionsEditorProps, PanelPlugin } from '../../../model';

function BertPanel1Editor({ value, onChange }: OptionsEditorProps<{ option1: string }>) {
  return (
    <div>
      <label htmlFor="editor-input">BertPanel1 editor</label>
      <input
        type="text"
        id="editor-input"
        value={value.option1}
        onChange={(e) => onChange({ ...value, option1: e.target.value })}
      />
    </div>
  );
}

// Dummy plugins to test loading
export const BertPanel1: PanelPlugin<{ option1: string }> = {
  PanelComponent: () => null,
  panelOptionsEditorComponents: [
    {
      label: 'Editor',
      content: BertPanel1Editor,
    },
  ],
  createInitialOptions: () => ({ option1: '' }),
};

export const BertPanel2: PanelPlugin<{ option2: string }> = {
  PanelComponent: () => null,
  panelOptionsEditorComponents: [
    {
      label: 'Settings',
      content: function BertPanel2Editor({ value, onChange }) {
        return (
          <div>
            <label htmlFor="editor-input">BertPanel2 editor</label>
            <input
              type="text"
              id="editor-input"
              value={value.option2}
              onChange={(e) => onChange({ ...value, option2: e.target.value })}
            />
          </div>
        );
      },
    },
    {
      label: 'Custom Tab',
      content: function Editor() {
        return <div>custom content</div>;
      },
    },
  ],
  createInitialOptions: () => ({ option2: '' }),
  hideQueryEditor: true,
};
