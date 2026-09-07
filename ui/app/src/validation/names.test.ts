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

import { renderHook } from '@testing-library/react';

import { createDashboardDialogValidationSchema, useDashboardValidationSchema } from './dashboard';
import { useEphemeralDashboardValidationSchema } from './ephemeraldashboard';
import { useAddFolderValidationSchema, useFolderValidationSchema } from './folder';
import { useProjectValidationSchema } from './project';

vi.mock('../model/project-client', () => ({
  useProjectList: vi.fn(() => ({ data: [{ metadata: { name: 'Existing_project' } }] })),
}));
vi.mock('../model/dashboard-client', () => ({
  useDashboardList: vi.fn(() => ({ data: [{ metadata: { project: 'test', name: 'existing_dashboard' } }] })),
}));
vi.mock('../model/folder-client', () => ({
  useFolderList: vi.fn(() => ({ data: [{ metadata: { project: 'test', name: 'existing_folder' } }] })),
}));
vi.mock('../model/ephemeral-dashboard-client', () => ({
  useEphemeralDashboardList: vi.fn(() => ({
    data: [{ metadata: { project: 'test', name: 'Existing_dashboard' }, spec: { ttl: '1h' } }],
  })),
}));

it('preserves the project duplicate-name error', () => {
  const { result } = renderHook(() => useProjectValidationSchema());
  expect(result.current.safeParse({ projectName: 'Existing project' }).error?.issues).toEqual([
    expect.objectContaining({ path: ['projectName'], message: "Project name 'Existing project' already exists!" }),
  ]);
  expect(result.current.safeParse({ projectName: 'New project' }).success).toBe(true);
});

it('preserves the dashboard duplicate-name error', () => {
  const { result } = renderHook(() => useDashboardValidationSchema('test'));
  expect(
    result.current.schema?.safeParse({ projectName: 'test', dashboardName: 'Existing dashboard' }).error?.issues,
  ).toEqual([
    expect.objectContaining({
      path: ['dashboardName'],
      message: "Dashboard name 'Existing dashboard' already exists in 'test' project!",
    }),
  ]);
});

it('preserves the folder duplicate-name error', () => {
  const { result } = renderHook(() => useFolderValidationSchema('test'));
  expect(result.current.schema?.safeParse({ name: 'Existing folder', selectedDashboards: [] }).error?.issues).toEqual([
    expect.objectContaining({
      path: ['name'],
      message: "Folder name 'Existing folder' already exists in 'test' project!",
    }),
  ]);
});

it('rejects duplicate sibling folders regardless of case', () => {
  const { result } = renderHook(() => useAddFolderValidationSchema([{ kind: 'Folder', name: 'Existing' }], []));
  expect(result.current.safeParse({ name: 'EXISTING', selectedDashboards: [] }).error?.issues).toEqual([
    expect.objectContaining({ path: ['name'], message: "A folder named 'EXISTING' already exists at this level!" }),
  ]);
});

it('preserves the ephemeral dashboard duplicate-name error', () => {
  const { result } = renderHook(() => useEphemeralDashboardValidationSchema('test'));
  expect(
    result.current.safeParse({ projectName: 'test', dashboardName: 'Existing dashboard', ttl: '1h' }).error?.issues,
  ).toEqual([
    expect.objectContaining({
      path: ['dashboardName'],
      message: "Ephemeral Dashboard name 'Existing dashboard' already exists in 'test' project!",
    }),
  ]);
});

it('defaults omitted tags and normalizes submitted tags', () => {
  const values = { projectName: 'test', dashboardName: 'New dashboard' };
  expect(createDashboardDialogValidationSchema.parse(values).tags).toEqual([]);
  expect(createDashboardDialogValidationSchema.parse({ ...values, tags: [' team ', 'team'] }).tags).toEqual(['team']);
});
