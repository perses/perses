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
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';

import { FolderTree } from './FolderTree';
import type { ResolvedPath } from './model';

const rootUrl = '/projects/mahmoud/folders/root';

const monitoring: FolderItem = {
  kind: 'Folder',
  name: 'monitoring',
  items: [{ kind: 'Dashboard', name: 'Monitor Dashboard' }],
};

const deep: FolderItem = {
  kind: 'Folder',
  name: 'deep',
  items: [monitoring, { kind: 'Dashboard', name: 'Deep Dashboard' }],
};

const shallow: FolderItem = {
  kind: 'Folder',
  name: 'shallow',
  items: [{ kind: 'Dashboard', name: 'Shallow Dashboard' }],
};

const rootFolder = {
  metadata: { name: 'root', project: 'mahmoud' },
  spec: {
    items: [deep, shallow, { kind: 'Folder', name: 'empty' }, { kind: 'Dashboard', name: 'Root Dashboard' }],
  },
} as FolderResource;

interface TreeHarnessProps {
  folder?: FolderResource;
  expandedPaths?: ReadonlySet<string>;
  targetPath?: ResolvedPath;
  toggleFolder?: (url: string) => void;
}

function Pathname(): ReactElement {
  const { pathname } = useLocation();
  return <span data-testid="pathname">{pathname}</span>;
}

function TreeHarness({
  folder = rootFolder,
  expandedPaths = new Set<string>(),
  targetPath,
  toggleFolder = () => undefined,
}: TreeHarnessProps): ReactElement {
  return (
    <>
      <FolderTree
        folder={folder}
        projectName="mahmoud"
        targetPath={targetPath}
        isPathExpanded={(url: string): boolean => expandedPaths.has(url)}
        toggleFolder={toggleFolder}
      />
      <Pathname />
    </>
  );
}

describe('FolderTree', () => {
  it('shows the root and immediate items but hides descendants of collapsed folders', () => {
    render(
      <MemoryRouter initialEntries={[rootUrl]}>
        <TreeHarness />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'root' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'deep' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'shallow' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Root Dashboard' })).toBeTruthy();

    expect(screen.queryByRole('link', { name: 'monitoring' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Deep Dashboard' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Shallow Dashboard' })).toBeNull();
  });

  it('renders the active path when the parent supplies its expanded URLs', () => {
    render(
      <MemoryRouter>
        <TreeHarness
          targetPath={{ path: [deep, monitoring] }}
          expandedPaths={new Set([`${rootUrl}/deep`, `${rootUrl}/deep/monitoring`])}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'monitoring' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Deep Dashboard' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Monitor Dashboard' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Shallow Dashboard' })).toBeNull();

    expect(screen.getAllByRole('button', { name: 'Collapse folder' })).toHaveLength(2);
  });

  it('delegates chevron clicks to the parent and renders new controlled expansion props', () => {
    const toggleFolder = vi.fn();

    const view = (expandedPaths: ReadonlySet<string>): ReactElement => (
      <MemoryRouter>
        <TreeHarness expandedPaths={expandedPaths} toggleFolder={toggleFolder} />
      </MemoryRouter>
    );

    const { rerender } = render(view(new Set()));

    const deepRow = screen.getByRole('link', {
      name: 'deep',
    }).parentElement!;

    fireEvent.click(within(deepRow).getByRole('button', { name: 'Expand folder' }));

    expect(toggleFolder).toHaveBeenCalledWith(`${rootUrl}/deep`);

    // Clicking does not change controlled state until the parent updates props.
    expect(screen.queryByRole('link', { name: 'Deep Dashboard' })).toBeNull();

    rerender(view(new Set([`${rootUrl}/deep`])));

    expect(screen.getByRole('link', { name: 'Deep Dashboard' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Shallow Dashboard' })).toBeNull();

    fireEvent.click(within(deepRow).getByRole('button', { name: 'Collapse folder' }));

    expect(toggleFolder).toHaveBeenLastCalledWith(`${rootUrl}/deep`);

    rerender(view(new Set()));

    expect(screen.queryByRole('link', { name: 'Deep Dashboard' })).toBeNull();
  });

  it('keeps a sibling branch open when the parent collapses another branch', () => {
    const view = (expandedPaths: ReadonlySet<string>): ReactElement => (
      <MemoryRouter>
        <TreeHarness expandedPaths={expandedPaths} />
      </MemoryRouter>
    );

    const { rerender } = render(view(new Set([`${rootUrl}/deep`, `${rootUrl}/shallow`])));

    expect(screen.getByRole('link', { name: 'Deep Dashboard' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Shallow Dashboard' })).toBeTruthy();

    rerender(view(new Set([`${rootUrl}/shallow`])));

    expect(screen.queryByRole('link', { name: 'Deep Dashboard' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Shallow Dashboard' })).toBeTruthy();
  });

  it('preserves previously expanded branches when the selected path changes', () => {
    const view = (targetPath: ResolvedPath, expandedPaths: ReadonlySet<string>): ReactElement => (
      <MemoryRouter>
        <TreeHarness targetPath={targetPath} expandedPaths={expandedPaths} />
      </MemoryRouter>
    );

    const { rerender } = render(view({ path: [deep] }, new Set([`${rootUrl}/deep`])));

    expect(screen.getByRole('link', { name: 'Deep Dashboard' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Shallow Dashboard' })).toBeNull();

    rerender(view({ path: [shallow] }, new Set([`${rootUrl}/deep`, `${rootUrl}/shallow`])));

    expect(screen.getByRole('link', { name: 'Deep Dashboard' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Shallow Dashboard' })).toBeTruthy();
  });

  it('builds absolute root, nested-folder, and dashboard links', () => {
    render(
      <MemoryRouter initialEntries={[rootUrl]}>
        <TreeHarness expandedPaths={new Set([`${rootUrl}/deep`])} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'root' }).getAttribute('href')).toBe(rootUrl);

    expect(screen.getByRole('link', { name: 'monitoring' }).getAttribute('href')).toBe(`${rootUrl}/deep/monitoring`);

    expect(screen.getByRole('link', { name: 'Deep Dashboard' }).getAttribute('href')).toBe(
      '/projects/mahmoud/dashboards/Deep%20Dashboard',
    );
  });

  it('navigates on folder-name click without toggling expansion', () => {
    const toggleFolder = vi.fn();

    render(
      <MemoryRouter initialEntries={[rootUrl]}>
        <TreeHarness toggleFolder={toggleFolder} expandedPaths={new Set([`${rootUrl}/deep`])} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'monitoring' }));

    expect(screen.getByTestId('pathname').textContent).toBe(`${rootUrl}/deep/monitoring`);

    expect(toggleFolder).not.toHaveBeenCalled();
  });

  it('does not render a chevron for an empty folder or a dashboard', () => {
    render(
      <MemoryRouter>
        <TreeHarness />
      </MemoryRouter>,
    );

    const emptyRow = screen.getByRole('link', {
      name: 'empty',
    }).parentElement!;

    const dashboardRow = screen.getByRole('link', {
      name: 'Root Dashboard',
    }).parentElement!;

    expect(within(emptyRow).queryByRole('button')).toBeNull();
    expect(within(dashboardRow).queryByRole('button')).toBeNull();
  });

  it('distinguishes same-named folders by their full paths', () => {
    const left: FolderItem = {
      kind: 'Folder',
      name: 'alpha',
      items: [
        {
          kind: 'Folder',
          name: 'shared',
          items: [{ kind: 'Dashboard', name: 'Alpha Only' }],
        },
      ],
    };

    const right: FolderItem = {
      kind: 'Folder',
      name: 'beta',
      items: [
        {
          kind: 'Folder',
          name: 'shared',
          items: [{ kind: 'Dashboard', name: 'Beta Only' }],
        },
      ],
    };

    const folder = {
      metadata: { name: 'root', project: 'mahmoud' },
      spec: { items: [left, right] },
    } as FolderResource;

    render(
      <MemoryRouter>
        <TreeHarness
          folder={folder}
          expandedPaths={new Set([`${rootUrl}/alpha`, `${rootUrl}/beta`, `${rootUrl}/alpha/shared`])}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link', { name: 'shared' })).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Alpha Only' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Beta Only' })).toBeNull();

    expect(screen.getAllByRole('link', { name: 'shared' }).map((link) => link.getAttribute('href'))).toEqual([
      `${rootUrl}/alpha/shared`,
      `${rootUrl}/beta/shared`,
    ]);
  });
});
