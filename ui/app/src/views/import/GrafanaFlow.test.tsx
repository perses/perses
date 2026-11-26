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
import type { ReactElement } from 'react';
import { vi } from 'vitest';

import GrafanaFlow from './GrafanaFlow';

// Stable references (as react-query returns), otherwise the list of project names is recomputed on each render.
const { mutate, migrate, projects, migratedDashboard } = vi.hoisted(() => ({
  mutate: vi.fn(),
  migrate: vi.fn(),
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

// Like react-query, keeps the variables of the last call, and succeeds right away.
vi.mock('../../model/migrate-client', async () => {
  const { useState } = await import('react');
  return {
    useMigrate: (): object => {
      const [variables, setVariables] = useState<unknown>();
      return {
        mutate: (body: unknown): void => {
          migrate(body);
          setVariables(body);
        },
        variables,
        data: variables === undefined ? undefined : migratedDashboard,
        isPending: false,
        isSuccess: variables !== undefined,
        isError: false,
      };
    },
  };
});

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

function getMigrateButton(): HTMLButtonElement {
  return screen.getByRole<HTMLButtonElement>('button', { name: 'Migrate' });
}

// Render the flow and migrate the dashboard, so that the import step is displayed.
function renderMigrated(element: ReactElement): ReturnType<typeof render> {
  const result = render(element);
  fireEvent.click(getMigrateButton());
  return result;
}

function selectProject(project: string): void {
  fireEvent.mouseDown(getProjectInput());
  fireEvent.click(screen.getByRole('option', { name: project }));
}

describe('GrafanaFlow', () => {
  beforeEach(() => {
    mutate.mockClear();
    migrate.mockClear();
  });

  it('imports the migrated dashboard into the default project', () => {
    renderMigrated(<GrafanaFlow dashboard={grafanaDashboard} defaultProject="target" />);

    expect(getProjectInput().value).toBe('target');
    fireEvent.click(getImportButton());

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'MyDashboard', project: 'target' } }),
    );
  });

  it('imports the migrated dashboard into the project selected instead of the default one', () => {
    renderMigrated(<GrafanaFlow dashboard={grafanaDashboard} defaultProject="source" />);

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
    renderMigrated(<GrafanaFlow dashboard={grafanaDashboard} defaultProject={defaultProject} />);

    expect(getProjectInput().value).toBe('');
    expect(getImportButton().disabled).toBe(true);

    selectProject('source');
    fireEvent.click(getImportButton());

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'MyDashboard', project: 'source' } }),
    );
  });

  it('cannot import once the selected project is cleared', () => {
    renderMigrated(<GrafanaFlow dashboard={grafanaDashboard} defaultProject="target" />);

    fireEvent.change(getProjectInput(), { target: { value: '' } });

    expect(getProjectInput().value).toBe('');
    expect(getImportButton().disabled).toBe(true);
  });

  it('hides the migration output once the dashboard changes', () => {
    const { rerender } = renderMigrated(<GrafanaFlow dashboard={grafanaDashboard} defaultProject="target" />);
    expect(getImportButton()).toBeTruthy();

    rerender(<GrafanaFlow dashboard={{ ...grafanaDashboard, title: 'Edited' }} defaultProject="target" />);
    expect(screen.queryByRole('button', { name: 'Import' })).toBeNull();

    fireEvent.click(getMigrateButton());
    expect(migrate).toHaveBeenLastCalledWith(
      expect.objectContaining({ grafanaDashboard: { ...grafanaDashboard, title: 'Edited' } }),
    );
    expect(getImportButton()).toBeTruthy();
  });

  it('hides the migration output once the default datasource option changes', () => {
    renderMigrated(<GrafanaFlow dashboard={grafanaDashboard} defaultProject="target" />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Use default datasource in Perses' }));
    expect(screen.queryByRole('button', { name: 'Import' })).toBeNull();
  });

  it('migrates with the inputs of the current dashboard', () => {
    const withInputs = (name: string): Record<string, unknown> => ({
      ...grafanaDashboard,
      __inputs: [{ name, value: `${name}-default` }],
    });
    const { rerender } = render(<GrafanaFlow dashboard={withInputs('first')} />);
    fireEvent.blur(screen.getByLabelText('first'), { target: { value: 'typed' } });
    fireEvent.click(getMigrateButton());
    expect(migrate).toHaveBeenLastCalledWith(expect.objectContaining({ input: { first: 'typed' } }));

    rerender(<GrafanaFlow dashboard={withInputs('second')} />);
    fireEvent.click(getMigrateButton());
    expect(migrate).toHaveBeenLastCalledWith(expect.objectContaining({ input: { second: 'second-default' } }));
  });

  it('disables the migration and the import while disabled', () => {
    const { rerender } = renderMigrated(<GrafanaFlow dashboard={grafanaDashboard} defaultProject="target" />);

    rerender(<GrafanaFlow dashboard={grafanaDashboard} defaultProject="target" disabled />);
    expect(getMigrateButton().disabled).toBe(true);
    expect(getImportButton().disabled).toBe(true);
  });
});
