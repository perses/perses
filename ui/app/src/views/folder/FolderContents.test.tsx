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

import type { FolderItem } from '@perses-dev/client';
import type { TableColumnConfig } from '@perses-dev/components';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';

import { FolderContents } from './FolderContents';

interface MockTableProps {
  data: FolderItem[];
  columns: Array<TableColumnConfig<FolderItem>>;
}

function MockTable({ data, columns }: MockTableProps): ReactElement {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.id}>{typeof column.header === 'string' ? column.header : column.id}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={`${item.kind}/${item.name}`}>
            {columns.map((column) => (
              <td key={column.id}>
                {typeof column.cell === 'function'
                  ? (column.cell({ row: { original: item } } as never) as ReactNode)
                  : String((item as unknown as Record<string, unknown>)[String(column.accessorKey)] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

vi.mock('@perses-dev/components', () => ({
  Table: MockTable,
}));

const projectName = 'mahmoud';
const rootUrl = '/projects/mahmoud/folders/root';

const makeFolder = (name: string, items: FolderItem[] = []): FolderItem => ({
  kind: 'Folder',
  name,
  items,
});

const makeDashboard = (name: string): FolderItem => ({
  kind: 'Dashboard',
  name,
});

const defaultItems: FolderItem[] = [
  makeFolder('Monitoring', [makeDashboard('Nested Dashboard')]),
  makeDashboard('Cluster Overview'),
];

function LocationIndicator(): ReactElement {
  const location = useLocation();

  return <span data-testid="pathname">{location.pathname}</span>;
}

interface RenderOptions {
  items?: FolderItem[];
  folderName?: string;
  folderUrl?: string;
  projectName?: string;
}

function renderContents({
  items = defaultItems,
  folderName = 'root',
  folderUrl = rootUrl,
  projectName = 'mahmoud',
}: RenderOptions = {}): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[rootUrl]}>
      <FolderContents items={items} folderName={folderName} folderUrl={folderUrl} projectName={projectName} />
      <LocationIndicator />
    </MemoryRouter>,
  );
}

describe('FolderContents', () => {
  it('renders immediate folders and dashboards', () => {
    renderContents();

    expect(screen.getByRole('link', { name: 'Monitoring' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Cluster Overview' })).toBeTruthy();
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Type')).toBeTruthy();
  });

  it('does not render nested descendants', () => {
    renderContents();

    expect(screen.getByText('Monitoring')).toBeTruthy();
    expect(screen.queryByText('Nested Dashboard')).toBeNull();
  });

  it('navigates to the correct folder URL', async () => {
    renderContents();

    await userEvent.click(screen.getByRole('link', { name: 'Monitoring' }));

    expect(screen.getByTestId('pathname').textContent).toBe('/projects/mahmoud/folders/root/Monitoring');
  });

  it('navigates to the correct dashboard URL', async () => {
    renderContents();

    await userEvent.click(screen.getByRole('link', { name: 'Cluster Overview' }));

    expect(screen.getByTestId('pathname').textContent).toBe('/projects/mahmoud/dashboards/Cluster%20Overview');
  });

  it('displays an empty state for folders without items', () => {
    renderContents({ items: [] });

    expect(screen.getByText('This folder is empty')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('displays the selected folder name', () => {
    renderContents({ folderName: 'Kubernetes' });

    expect(screen.getByRole('heading', { name: 'Kubernetes' })).toBeTruthy();
  });

  it('counts only immediate items', () => {
    renderContents();

    expect(screen.getByText('2 items')).toBeTruthy();
  });

  it('renders the correct type for folders and dashboards', () => {
    renderContents();

    expect(screen.getByText('Folder')).toBeTruthy();
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  it('encodes special characters in navigation URLs', () => {
    renderContents({
      items: [makeFolder('SRE & Ops'), makeDashboard('CPU / RAM')],
    });

    expect(screen.getByRole('link', { name: 'SRE & Ops' }).getAttribute('href')).toBe(
      '/projects/mahmoud/folders/root/SRE%20%26%20Ops',
    );

    expect(screen.getByRole('link', { name: 'CPU / RAM' }).getAttribute('href')).toBe(
      '/projects/mahmoud/dashboards/CPU%20%2F%20RAM',
    );
  });

  it('builds folder links relative to the selected folder', () => {
    const items = [makeFolder('child')];

    const { rerender } = render(
      <MemoryRouter>
        <FolderContents items={items} folderName="root" folderUrl={rootUrl} projectName={projectName} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'child' }).getAttribute('href')).toBe(
      '/projects/mahmoud/folders/root/child',
    );

    rerender(
      <MemoryRouter>
        <FolderContents items={items} folderName="deep" folderUrl={`${rootUrl}/deep`} projectName={projectName} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'child' }).getAttribute('href')).toBe(
      '/projects/mahmoud/folders/root/deep/child',
    );
  });
});
