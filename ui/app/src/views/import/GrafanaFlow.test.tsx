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
import { vi } from 'vitest';

import GrafanaFlow from './GrafanaFlow';

// Stable references (as react-query returns), otherwise the list of project names is recomputed on each render.
const { mutate, projects, migratedDashboard } = vi.hoisted(() => ({
  mutate: vi.fn(),
  projects: [
    { kind: 'Project', metadata: { name: 'source' }, spec: {} },
    { kind: 'Project', metadata: { name: 'target' }, spec: {} },
  ],
  migratedDashboard: { kind: 'Dashboard', metadata: { name: 'MyDashboard', project: '' }, spec: { duration: '1h' } },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: (): (() => void) => vi.fn(),
}));

vi.mock('@perses-dev/components', () => ({
  JSONEditor: (): null => null,
  useSnackbar: (): object => ({ exceptionSnackbar: vi.fn() }),
}));

vi.mock('../../context/Config', () => ({
  useIsReadonly: (): boolean => false,
}));

vi.mock('../../model/dashboard-client', () => ({
  useCreateDashboardMutation: (): object => ({ mutate, isPending: false, isError: false }),
}));

// The dashboard is already migrated, so the import step is displayed.
vi.mock('../../model/migrate-client', () => ({
  useMigrate: (): object => ({
    mutate: vi.fn(),
    data: migratedDashboard,
    isPending: false,
    isSuccess: true,
    isError: false,
  }),
}));

vi.mock('../../model/project-client', () => ({
  useProjectList: (): object => ({ data: projects, isPending: false, error: null }),
}));

const grafanaDashboard = { title: 'My Dashboard', panels: [] };

function getProjectInput(): HTMLInputElement {
  return screen.getByRole<HTMLInputElement>('combobox', { name: /Project name/ });
}

function getImportButton(): HTMLButtonElement {
  return screen.getByRole<HTMLButtonElement>('button', { name: 'Import' });
}

function selectProject(project: string): void {
  fireEvent.mouseDown(getProjectInput());
  fireEvent.click(screen.getByRole('option', { name: project }));
}

describe('GrafanaFlow', () => {
  beforeEach(() => {
    mutate.mockClear();
  });

  it('imports the migrated dashboard into the default project', () => {
    render(<GrafanaFlow dashboard={grafanaDashboard} defaultProject="target" />);

    expect(getProjectInput().value).toBe('target');
    fireEvent.click(getImportButton());

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'MyDashboard', project: 'target' } }),
    );
  });

  it('imports the migrated dashboard into the project selected instead of the default one', () => {
    render(<GrafanaFlow dashboard={grafanaDashboard} defaultProject="source" />);

    selectProject('target');
    fireEvent.click(getImportButton());

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'MyDashboard', project: 'target' } }),
    );
  });

  it.each([
    ['there is no default project', undefined],
    ['the default project is not part of the list', 'unknown'],
  ])('requires to select a project when %s', (_, defaultProject) => {
    render(<GrafanaFlow dashboard={grafanaDashboard} defaultProject={defaultProject} />);

    expect(getProjectInput().value).toBe('');
    expect(getImportButton().disabled).toBe(true);

    selectProject('source');
    fireEvent.click(getImportButton());

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'MyDashboard', project: 'source' } }),
    );
  });

  it('cannot import once the selected project is cleared', () => {
    render(<GrafanaFlow dashboard={grafanaDashboard} defaultProject="target" />);

    fireEvent.change(getProjectInput(), { target: { value: '' } });

    expect(getProjectInput().value).toBe('');
    expect(getImportButton().disabled).toBe(true);
  });
});
