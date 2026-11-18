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

import type { FolderItem, FolderResource } from '@perses-dev/client';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Link, MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { vi } from 'vitest';

import { FolderBrowser } from './FolderBrowser';

const rootUrl = '/projects/mahmoud/folders/root';

vi.mock('./FolderContents', () => ({
  FolderContents: ({ items, folderUrl }: { items: FolderItem[]; folderUrl: string }): ReactElement => (
    <div data-testid="folder-contents">
      {items
        .filter((item) => item.kind === 'Folder')
        .map((item) => (
          <Link key={item.name} to={`${folderUrl}/${encodeURIComponent(item.name)}`}>
            {item.name}
          </Link>
        ))}
    </div>
  ),
}));

const deep: FolderItem = {
  kind: 'Folder',
  name: 'deep',
  items: [{ kind: 'Dashboard', name: 'Deep Dashboard' }],
};

const shallow: FolderItem = {
  kind: 'Folder',
  name: 'shallow',
  items: [{ kind: 'Dashboard', name: 'Shallow Dashboard' }],
};

const folder = {
  metadata: { name: 'root', project: 'mahmoud' },
  spec: { items: [deep, shallow] },
} as FolderResource;

function TestRoute(): ReactElement {
  const { '*': nestedPath } = useParams();
  const location = useLocation();

  const selected = [deep, shallow].find((item) => item.name === nestedPath);

  return (
    <>
      <FolderBrowser folder={folder} projectName="mahmoud" resolvedPath={selected ? { path: [selected] } : undefined} />
      <span data-testid="pathname">{location.pathname}</span>
    </>
  );
}

describe('FolderBrowser', () => {
  it('preserves expanded branches across navigation and allows manual collapse', () => {
    render(
      <MemoryRouter initialEntries={[rootUrl]}>
        <Routes>
          <Route path="/projects/:projectName/folders/:rootFolder/*" element={<TestRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Deep Dashboard' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Shallow Dashboard' })).toBeNull();

    fireEvent.click(within(screen.getByTestId('folder-contents')).getByRole('link', { name: 'deep' }));

    expect(screen.getByTestId('pathname').textContent).toBe(`${rootUrl}/deep`);
    expect(screen.getByRole('link', { name: 'Deep Dashboard' })).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: 'root' }));

    fireEvent.click(within(screen.getByTestId('folder-contents')).getByRole('link', { name: 'shallow' }));

    expect(screen.getByTestId('pathname').textContent).toBe(`${rootUrl}/shallow`);

    expect(screen.getByRole('link', { name: 'Deep Dashboard' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Shallow Dashboard' })).toBeTruthy();

    const deepRow = screen.getByRole('link', { name: 'deep' }).parentElement!;

    fireEvent.click(within(deepRow).getByRole('button', { name: 'Collapse folder' }));

    expect(screen.queryByRole('link', { name: 'Deep Dashboard' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Shallow Dashboard' })).toBeTruthy();
  });
});
