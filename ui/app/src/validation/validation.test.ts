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

import { zodResolver } from '@hookform/resolvers/zod';
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { createDashboardDialogValidationSchema, useDashboardValidationSchema } from './dashboard';
import { useEphemeralDashboardValidationSchema } from './ephemeraldashboard';
import { useAddFolderValidationSchema, useFolderValidationSchema } from './folder';
import { useProjectValidationSchema } from './project';

vi.mock('../model/project-client', () => ({
  useProjectList: vi.fn().mockReturnValue({ data: [{ metadata: { name: 'My_Project' } }] }),
}));
vi.mock('../model/dashboard-client', () => ({
  useDashboardList: vi.fn().mockReturnValue({
    data: [{ metadata: { name: 'My_Dashboard', project: 'my-project' } }],
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('../model/ephemeral-dashboard-client', () => ({
  useEphemeralDashboardList: vi.fn().mockReturnValue({
    data: [{ metadata: { name: 'My_Dashboard', project: 'my-project' }, spec: { ttl: '1h' } }],
  }),
}));
vi.mock('../model/folder-client', () => ({
  useFolderList: vi.fn().mockReturnValue({
    data: [{ metadata: { name: 'my_folder', project: 'my-project' } }],
    isLoading: false,
    isError: false,
  }),
}));

describe('resource validation', () => {
  it('reports duplicate project names on the project field', () => {
    const { result } = renderHook(() => useProjectValidationSchema());
    const parsed = result.current.safeParse({ projectName: 'My Project' });
    expect(parsed.error?.issues).toEqual([
      {
        code: 'custom',
        message: "Project name 'My Project' already exists!",
        path: ['projectName'],
      },
    ]);
    expect(result.current.safeParse({ projectName: 'New Project' }).success).toBe(true);
  });

  it('checks dashboard names within the selected project', () => {
    const { result } = renderHook(() => useDashboardValidationSchema('my-project'));
    const input = { projectName: 'my-project', dashboardName: 'My Dashboard' };
    const parsed = result.current.schema?.safeParse(input);
    expect(parsed?.error?.issues).toEqual([
      {
        code: 'custom',
        message: "Dashboard name 'My Dashboard' already exists in 'my-project' project!",
        path: ['dashboardName'],
      },
    ]);
    expect(result.current.schema?.safeParse({ ...input, projectName: 'another-project' }).success).toBe(true);
  });

  it('includes the TTL when checking ephemeral dashboard names', () => {
    const { result } = renderHook(() => useEphemeralDashboardValidationSchema('my-project'));
    const input = { projectName: 'my-project', dashboardName: 'My Dashboard', ttl: '1h' };
    expect(result.current.safeParse(input).error?.issues).toEqual([
      {
        code: 'custom',
        message: "Ephemeral Dashboard name 'My Dashboard' already exists in 'my-project' project!",
        path: ['dashboardName'],
      },
    ]);
    expect(result.current.safeParse({ ...input, ttl: '2h' }).success).toBe(true);
    expect(result.current.safeParse({ ...input, ttl: 'invalid' }).success).toBe(false);
  });

  it('reports duplicate folder names on the name field', () => {
    const { result } = renderHook(() => useFolderValidationSchema('my-project'));
    expect(result.current.schema?.safeParse({ name: 'My Folder', selectedDashboards: [] }).error?.issues).toEqual([
      {
        code: 'custom',
        message: "Folder name 'My Folder' already exists in 'my-project' project!",
        path: ['name'],
      },
    ]);
    expect(result.current.schema?.safeParse({ name: 'New Folder', selectedDashboards: [] }).success).toBe(true);
  });

  it('checks sub-folder names against siblings without case sensitivity', () => {
    const { result } = renderHook(() =>
      useAddFolderValidationSchema(
        [{ kind: 'Folder', name: 'Parent', items: [{ kind: 'Folder', name: 'Existing' }] }],
        ['Parent'],
      ),
    );
    expect(result.current.safeParse({ name: 'existing', selectedDashboards: [] }).error?.issues).toEqual([
      {
        code: 'custom',
        message: "A folder named 'existing' already exists at this level!",
        path: ['name'],
      },
    ]);
    expect(result.current.safeParse({ name: 'Parent', selectedDashboards: [] }).success).toBe(true);
  });

  it('passes defaulted and normalized tags through the form resolver', async () => {
    const resolver = zodResolver(createDashboardDialogValidationSchema);
    const options = { fields: {}, shouldUseNativeValidation: false };
    const input = { projectName: 'my-project', dashboardName: 'New Dashboard' };
    await expect(resolver(input, undefined, options)).resolves.toEqual({
      errors: {},
      values: { ...input, tags: [] },
    });
    await expect(resolver({ ...input, tags: [' production ', 'production'] }, undefined, options)).resolves.toEqual({
      errors: {},
      values: { ...input, tags: ['production'] },
    });
  });

  it('preserves field errors through the form resolver', async () => {
    const { result } = renderHook(() => useProjectValidationSchema());
    const resolver = zodResolver(result.current);
    const parsed = await resolver({ projectName: 'My Project' }, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    });
    expect(parsed.values).toEqual({});
    expect(parsed.errors).toMatchObject({
      projectName: { type: 'custom', message: "Project name 'My Project' already exists!" },
    });
  });
});
