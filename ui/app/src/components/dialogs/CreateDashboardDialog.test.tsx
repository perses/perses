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

import type { ProjectResource } from '@perses-dev/client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

import type { SearchProjectResource } from '../../model/search-client';
import { CreateDashboardDialog } from './CreateDashboardDialog';

function MockDialog({ open, children }: { open: boolean; children?: ReactNode }): ReactElement | null {
  return open ? <div>{children}</div> : null;
}

function MockDialogSection({ children }: { children?: ReactNode }): ReactElement {
  return <div>{children}</div>;
}

vi.mock('@perses-dev/components', () => ({
  Dialog: Object.assign(MockDialog, {
    Header: MockDialogSection,
    Content: MockDialogSection,
    Actions: MockDialogSection,
  }),
  getResourceDisplayName: (resource: ProjectResource): string => resource.metadata.name,
}));

vi.mock('../../model/search-client', () => ({
  useSearchDashboards: (project?: string): { data: SearchProjectResource[]; isLoading: boolean; isError: boolean } => ({
    data: project === 'target' ? [{ metadata: { project: 'target', name: 'Existing' }, displayName: 'Existing' }] : [],
    isLoading: false,
    isError: false,
  }),
}));

// Only used by unrelated validation schemas, mocked to avoid loading the whole app context.
vi.mock('../../model/project-client', () => ({}));

const projects: ProjectResource[] = [
  { kind: 'Project', metadata: { name: 'source' }, spec: {} },
  { kind: 'Project', metadata: { name: 'target' }, spec: {} },
];

function renderDuplicateDialog(defaultProject: string, onSuccess: Mock = vi.fn()): void {
  render(
    <CreateDashboardDialog
      open={true}
      projects={projects}
      defaultProject={defaultProject}
      mode="duplicate"
      name="My Dashboard"
      onClose={vi.fn()}
      onSuccess={onSuccess}
      isEphemeralDashboardEnabled={false}
    />,
  );
}

function getProjectSelect(): HTMLElement {
  return screen.getByRole('combobox', { name: /Project name/ });
}

function selectProject(project: string): void {
  fireEvent.mouseDown(getProjectSelect());
  fireEvent.click(screen.getByRole('option', { name: project }));
}

function fillDashboardName(name: string): void {
  const nameInput = screen.getByRole('textbox', { name: /Dashboard Name/ });
  fireEvent.change(nameInput, { target: { value: name } });
  // Validation is triggered on blur
  fireEvent.blur(nameInput);
}

describe('CreateDashboardDialog', () => {
  it('preselects the default project', () => {
    renderDuplicateDialog('target');

    expect(getProjectSelect().textContent).toBe('target');
  });

  it('preselects the first project when the default one is not part of the list', () => {
    renderDuplicateDialog('read-only-project');

    expect(getProjectSelect().textContent).toBe('source');
  });

  it('duplicates the dashboard into the selected project', async () => {
    const onSuccess = vi.fn();
    renderDuplicateDialog('source', onSuccess);

    selectProject('target');
    fillDashboardName('Copy');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' }).hasAttribute('disabled')).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ project: 'target', dashboard: 'Copy', tags: [] }));
  });

  it('checks the dashboard name is not already used in the selected project', async () => {
    renderDuplicateDialog('source');

    fillDashboardName('Existing');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' }).hasAttribute('disabled')).toBe(false));

    selectProject('target');
    fireEvent.blur(screen.getByRole('textbox', { name: /Dashboard Name/ }));

    expect(await screen.findByText("Dashboard name 'Existing' already exists in 'target' project!")).not.toBeNull();
  });
});
