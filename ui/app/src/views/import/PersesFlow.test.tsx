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

import type { DashboardResource } from '@perses-dev/client';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import PersesFlow from './PersesFlow';

// Stable references (as react-query returns), otherwise the list of project names is recomputed on each render.
const { mutate, projects } = vi.hoisted(() => ({
  mutate: vi.fn(),
  projects: [
    { kind: 'Project', metadata: { name: 'source' }, spec: {} },
    { kind: 'Project', metadata: { name: 'target' }, spec: {} },
  ],
}));

vi.mock('react-router-dom', () => ({
  useNavigate: (): (() => void) => vi.fn(),
}));

vi.mock('@perses-dev/components', () => ({
  useSnackbar: (): object => ({ exceptionSnackbar: vi.fn() }),
}));

vi.mock('../../context/Config', () => ({
  useIsReadonly: (): boolean => false,
}));

vi.mock('../../model/dashboard-client', () => ({
  useCreateDashboardMutation: (): object => ({ mutate, isPending: false, isError: false }),
}));

vi.mock('../../model/project-client', () => ({
  useProjectList: (): object => ({ data: projects, error: null }),
}));

const dashboard = {
  kind: 'Dashboard',
  metadata: { name: 'MyDashboard', project: '' },
  spec: { duration: '1h' },
} as unknown as DashboardResource;

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

describe('PersesFlow', () => {
  beforeEach(() => {
    mutate.mockClear();
  });

  it('imports the dashboard into the default project', () => {
    render(<PersesFlow dashboard={dashboard} defaultProject="target" />);

    expect(getProjectInput().value).toBe('target');
    fireEvent.click(getImportButton());

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'MyDashboard', project: 'target' } }),
    );
  });

  it('imports the dashboard into the project selected instead of the default one', () => {
    render(<PersesFlow dashboard={dashboard} defaultProject="source" />);

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
    render(<PersesFlow dashboard={dashboard} defaultProject={defaultProject} />);

    expect(getProjectInput().value).toBe('');
    expect(getImportButton().disabled).toBe(true);

    selectProject('source');
    fireEvent.click(getImportButton());

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'MyDashboard', project: 'source' } }),
    );
  });

  it('cannot import once the selected project is cleared', () => {
    render(<PersesFlow dashboard={dashboard} defaultProject="target" />);

    fireEvent.change(getProjectInput(), { target: { value: '' } });

    expect(getProjectInput().value).toBe('');
    expect(getImportButton().disabled).toBe(true);
  });
});
