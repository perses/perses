// Copyright The Perses Authors
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

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { vi } from 'vitest';

import ImportView from './ImportView';

// Like the real editor, only uses its value as initial content.
vi.mock('@perses-dev/components', () => ({
  YAMLEditor: ({ value, onChange }: { value: string; onChange: (next: string) => void }): ReactElement => {
    const [text] = useState(value);
    return <textarea aria-label="Definition" defaultValue={text} onChange={(e) => onChange(e.target.value)} />;
  },
}));

vi.mock('use-query-params', () => ({
  StringParam: {},
  useQueryParam: (): [undefined] => [undefined],
}));

vi.mock('./GrafanaFlow', () => ({
  default: ({ dashboard }: { dashboard: { title?: string } }): ReactElement => <p>Grafana flow: {dashboard.title}</p>,
}));

vi.mock('./PersesFlow', () => ({
  default: ({ dashboard }: { dashboard: { metadata: { name: string } } }): ReactElement => (
    <p>Perses flow: {dashboard.metadata.name}</p>
  ),
}));

function getFileInput(): HTMLInputElement {
  return screen.getByLabelText<HTMLInputElement>(/Upload JSON or YAML file/);
}

// jsdom doesn't implement Blob.text().
function textFile(content: string, name: string): File {
  return Object.assign(new File([content], name), { text: async (): Promise<string> => content });
}

function getEditor(): HTMLTextAreaElement {
  return screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Definition' });
}

describe('ImportView', () => {
  it('shows the uploaded file in the editor and the matching flow', async () => {
    render(<ImportView />);

    userEvent.upload(getFileInput(), textFile('kind: Dashboard\nmetadata:\n  name: uploaded\n', 'dashboard.yaml'));

    expect(await screen.findByText('Perses flow: uploaded')).toBeTruthy();
    expect(getEditor().value).toBe('kind: Dashboard\nmetadata:\n  name: uploaded\n');
    expect(getFileInput().value).toBe('');
  });

  it('replaces the edited definition when a file is uploaded again', async () => {
    render(<ImportView />);
    const file = textFile('{"title": "uploaded"}', 'dashboard.json');

    userEvent.upload(getFileInput(), file);
    expect(await screen.findByText('Grafana flow: uploaded')).toBeTruthy();

    fireEvent.change(getEditor(), { target: { value: '{"title": "edited"}' } });
    expect(await screen.findByText('Grafana flow: edited')).toBeTruthy();

    // userEvent doesn't model the input reset, and skips a selection it considers unchanged: the reset is checked above.
    fireEvent.change(getFileInput(), { target: { files: [file] } });
    expect(await screen.findByText('Grafana flow: uploaded')).toBeTruthy();
    expect(getEditor().value).toBe('{"title": "uploaded"}');
  });

  it('tells why the definition cannot be imported', async () => {
    render(<ImportView />);

    fireEvent.change(getEditor(), { target: { value: 'kind: PersesDashboard\nmetadata:\n  name: test\n' } });

    expect(await screen.findByText(/PersesDashboard resources of the Perses operator are not supported/)).toBeTruthy();
    expect(screen.queryByText(/flow/)).toBeNull();
  });
});
