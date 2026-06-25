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

import { FolderItem } from '@perses-dev/client';
import {
  collectDashboards,
  getSubFolderDeepCopy,
  getSubFolderRef,
  insertSubFolder,
  replaceSubFolder,
  withoutSubFolder,
} from './folderUtils';

function makeTree(): FolderItem[] {
  return [
    {
      kind: 'Folder',
      name: 'A',
      items: [
        {
          kind: 'Folder',
          name: 'B',
          items: [{ kind: 'Folder', name: 'C' }],
        },
        { kind: 'Folder', name: 'D' },
      ],
    },
    { kind: 'Folder', name: 'E' },
  ];
}

describe('collectDashboards', () => {
  it('returns an empty array for a folder with no items', () => {
    const folder: FolderItem = { kind: 'Folder', name: 'Empty' };
    expect(collectDashboards(folder.items)).toEqual([]);
  });

  it('returns an empty array for a folder with an empty items array', () => {
    const folder: FolderItem = { kind: 'Folder', name: 'Empty', items: [] };
    expect(collectDashboards(folder.items)).toEqual([]);
  });

  it('returns direct dashboard names', () => {
    const folder: FolderItem = {
      kind: 'Folder',
      name: 'A',
      items: [
        { kind: 'Dashboard', name: 'dash-1' },
        { kind: 'Dashboard', name: 'dash-2' },
      ],
    };
    expect(collectDashboards(folder.items)).toEqual(['dash-1', 'dash-2']);
  });

  it('collects dashboards from nested sub-folders', () => {
    const folder: FolderItem = {
      kind: 'Folder',
      name: 'A',
      items: [
        { kind: 'Dashboard', name: 'dash-1' },
        {
          kind: 'Folder',
          name: 'B',
          items: [{ kind: 'Dashboard', name: 'dash-2' }],
        },
      ],
    };
    expect(collectDashboards(folder.items)).toEqual(['dash-1', 'dash-2']);
  });

  it('collects dashboards from deeply nested sub-folders', () => {
    const folder: FolderItem = {
      kind: 'Folder',
      name: 'A',
      items: [
        {
          kind: 'Folder',
          name: 'B',
          items: [
            {
              kind: 'Folder',
              name: 'C',
              items: [{ kind: 'Dashboard', name: 'dash-deep' }],
            },
          ],
        },
      ],
    };
    expect(collectDashboards(folder.items)).toEqual(['dash-deep']);
  });

  it('collects all dashboards across multiple sub-folders', () => {
    const folder: FolderItem = {
      kind: 'Folder',
      name: 'Root',
      items: [
        { kind: 'Dashboard', name: 'dash-root' },
        {
          kind: 'Folder',
          name: 'A',
          items: [{ kind: 'Dashboard', name: 'dash-a' }],
        },
        {
          kind: 'Folder',
          name: 'B',
          items: [
            { kind: 'Dashboard', name: 'dash-b1' },
            { kind: 'Dashboard', name: 'dash-b2' },
          ],
        },
      ],
    };
    expect(collectDashboards(folder.items)).toEqual(['dash-root', 'dash-a', 'dash-b1', 'dash-b2']);
  });

  it('ignores sub-folders that contain no dashboards', () => {
    const folder: FolderItem = {
      kind: 'Folder',
      name: 'A',
      items: [
        { kind: 'Folder', name: 'Empty' },
        { kind: 'Dashboard', name: 'dash-1' },
      ],
    };
    expect(collectDashboards(folder.items)).toEqual(['dash-1']);
  });

  it('does not recurse into sub-folders when deep is false', () => {
    const folder: FolderItem = {
      kind: 'Folder',
      name: 'A',
      items: [
        { kind: 'Dashboard', name: 'dash-1' },
        {
          kind: 'Folder',
          name: 'B',
          items: [{ kind: 'Dashboard', name: 'dash-2' }],
        },
      ],
    };
    expect(collectDashboards(folder.items, false)).toEqual(['dash-1']);
  });

  it('returns an empty array when deep is false and there are no direct dashboards', () => {
    const folder: FolderItem = {
      kind: 'Folder',
      name: 'A',
      items: [
        {
          kind: 'Folder',
          name: 'B',
          items: [{ kind: 'Dashboard', name: 'dash-2' }],
        },
      ],
    };
    expect(collectDashboards(folder.items, false)).toEqual([]);
  });

  it('filters dashboards by name', () => {
    const folder: FolderItem = {
      kind: 'Folder',
      name: 'A',
      items: [
        { kind: 'Dashboard', name: 'prod-1' },
        { kind: 'Dashboard', name: 'dev-1' },
        {
          kind: 'Folder',
          name: 'B',
          items: [{ kind: 'Dashboard', name: 'prod-2' }],
        },
      ],
    };
    expect(collectDashboards(folder.items, true, (name) => name.startsWith('prod'))).toEqual(['prod-1', 'prod-2']);
  });

  it('returns an empty array when filter matches nothing', () => {
    const folder: FolderItem = {
      kind: 'Folder',
      name: 'A',
      items: [
        { kind: 'Dashboard', name: 'dash-1' },
        { kind: 'Dashboard', name: 'dash-2' },
      ],
    };
    expect(collectDashboards(folder.items, true, () => false)).toEqual([]);
  });

  it('combines deep=false with a filter', () => {
    const folder: FolderItem = {
      kind: 'Folder',
      name: 'A',
      items: [
        { kind: 'Dashboard', name: 'prod-1' },
        { kind: 'Dashboard', name: 'dev-1' },
        {
          kind: 'Folder',
          name: 'B',
          items: [{ kind: 'Dashboard', name: 'prod-2' }],
        },
      ],
    };
    expect(collectDashboards(folder.items, false, (name) => name.startsWith('prod'))).toEqual(['prod-1']);
  });

  it('does not mutate the input', () => {
    const folder: FolderItem = {
      kind: 'Folder',
      name: 'A',
      items: [{ kind: 'Dashboard', name: 'dash-1' }],
    };
    const itemsBefore = [...(folder.items ?? [])];
    collectDashboards(folder.items);
    expect(folder.items).toEqual(itemsBefore);
  });
});

describe('withoutSubFolder', () => {
  it('removes a root-level folder', () => {
    const result = withoutSubFolder(makeTree(), ['E']);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.name).toBe('A');
  });

  it('removes a direct child folder', () => {
    const result = withoutSubFolder(makeTree(), ['A', 'D']);
    const a = result.find((s) => s.name === 'A')!;
    expect(a.items).toHaveLength(1);
    expect(a.items!.at(0)?.name).toBe('B');
  });

  it('removes a deeply nested folder', () => {
    const result = withoutSubFolder(makeTree(), ['A', 'B', 'C']);
    const a = result.find((s) => s.name === 'A')!;
    const b = a.items!.find((s) => s.name === 'B')!;
    expect(b.items).toHaveLength(0);
  });

  it('does not mutate the original items', () => {
    const original = makeTree();
    withoutSubFolder(original, ['A', 'D']);
    const a = original.find((s) => s.name === 'A')!;
    expect(a.items).toHaveLength(2);
  });

  it('throws when path is empty', () => {
    expect(() => withoutSubFolder(makeTree(), [])).toThrow('path must not be empty');
  });

  it('throws when root-level folder is not found', () => {
    expect(() => withoutSubFolder(makeTree(), ['Z'])).toThrow('Folder "Z" not found');
  });

  it('throws when an intermediate folder is not found', () => {
    expect(() => withoutSubFolder(makeTree(), ['A', 'Z'])).toThrow('Folder "Z" not found');
  });

  it('throws when an intermediate folder has no children', () => {
    expect(() => withoutSubFolder(makeTree(), ['A', 'D', 'X'])).toThrow('Folder "D" has no children');
  });

  it('preserves sibling folders and their children', () => {
    const result = withoutSubFolder(makeTree(), ['A', 'B']);
    const a = result.find((s) => s.name === 'A')!;
    expect(a.items).toHaveLength(1);
    expect(a.items!.at(0)?.name).toBe('D');
    expect(result.find((s) => s.name === 'E')).toBeDefined();
  });

  it('returns an empty array when the only root folder is removed', () => {
    const single: FolderItem[] = [{ kind: 'Folder', name: 'Solo' }];
    expect(withoutSubFolder(single, ['Solo'])).toEqual([]);
  });
});

describe('getSubFolderDeepCopy', () => {
  it('returns a root-level folder', () => {
    const result = getSubFolderDeepCopy(makeTree(), ['A']);
    expect(result.name).toBe('A');
    expect(result.kind).toBe('Folder');
  });

  it('returns a direct child folder', () => {
    const result = getSubFolderDeepCopy(makeTree(), ['A', 'B']);
    expect(result.name).toBe('B');
  });

  it('returns a deeply nested folder', () => {
    const result = getSubFolderDeepCopy(makeTree(), ['A', 'B', 'C']);
    expect(result.name).toBe('C');
  });

  it('returns a deep copy, not a reference', () => {
    const original = makeTree();
    const copy = getSubFolderDeepCopy(original, ['A', 'B']);
    (copy as { name: string }).name = 'MUTATED';
    const a = original.find((s) => s.name === 'A')!;
    expect(a.items!.find((s) => s.name === 'B')).toBeDefined();
  });

  it('throws when path is empty', () => {
    expect(() => getSubFolderDeepCopy(makeTree(), [])).toThrow('path must not be empty');
  });

  it('throws when a root-level folder is not found', () => {
    expect(() => getSubFolderDeepCopy(makeTree(), ['Z'])).toThrow('Folder "Z" not found');
  });

  it('throws when an intermediate folder is not found', () => {
    expect(() => getSubFolderDeepCopy(makeTree(), ['A', 'Z'])).toThrow('Folder "Z" not found');
  });

  it('throws when an intermediate folder has no children', () => {
    expect(() => getSubFolderDeepCopy(makeTree(), ['A', 'D', 'X'])).toThrow('Folder "D" has no children');
  });

  it('includes the children of the returned node', () => {
    const result = getSubFolderDeepCopy(makeTree(), ['A']);
    expect(result.items).toHaveLength(2);
    expect(result.items!.map((s) => s.name)).toEqual(['B', 'D']);
  });
});

describe('getSubFolderRef', () => {
  it('returns a root-level folder', () => {
    const result = getSubFolderRef(makeTree(), ['A']);
    expect(result.name).toBe('A');
    expect(result.kind).toBe('Folder');
  });

  it('returns a direct child folder', () => {
    const result = getSubFolderRef(makeTree(), ['A', 'B']);
    expect(result.name).toBe('B');
  });

  it('returns a deeply nested folder', () => {
    const result = getSubFolderRef(makeTree(), ['A', 'B', 'C']);
    expect(result.name).toBe('C');
  });

  it('returns a live reference, not a copy', () => {
    const original = makeTree();
    const ref = getSubFolderRef(original, ['A', 'B']);
    (ref as { name: string }).name = 'MUTATED';
    const a = original.find((s) => s.name === 'A')!;
    expect(a.items!.find((s) => s.name === 'MUTATED')).toBeDefined();
  });

  it('throws when path is empty', () => {
    expect(() => getSubFolderRef(makeTree(), [])).toThrow('path must not be empty');
  });

  it('throws when a root-level folder is not found', () => {
    expect(() => getSubFolderRef(makeTree(), ['Z'])).toThrow('Folder "Z" not found');
  });

  it('throws when an intermediate folder is not found', () => {
    expect(() => getSubFolderRef(makeTree(), ['A', 'Z'])).toThrow('Folder "Z" not found');
  });

  it('throws when an intermediate folder has no children', () => {
    expect(() => getSubFolderRef(makeTree(), ['A', 'D', 'X'])).toThrow('Folder "D" has no children');
  });

  it('includes the children of the returned node', () => {
    const result = getSubFolderRef(makeTree(), ['A']);
    expect(result.items).toHaveLength(2);
    expect(result.items!.map((s) => s.name)).toEqual(['B', 'D']);
  });
});

describe('replaceSubFolder', () => {
  const newNode: FolderItem = { kind: 'Folder', name: 'NEW' };

  it('replaces a root-level folder', () => {
    const result = replaceSubFolder(makeTree(), ['E'], newNode);
    expect(result.find((s) => s.name === 'E')).toBeUndefined();
    expect(result.find((s) => s.name === 'NEW')).toBeDefined();
    expect(result).toHaveLength(2);
  });

  it('replaces a direct child folder', () => {
    const result = replaceSubFolder(makeTree(), ['A', 'D'], newNode);
    const a = result.find((s) => s.name === 'A')!;
    expect(a.items!.find((s) => s.name === 'D')).toBeUndefined();
    expect(a.items!.find((s) => s.name === 'NEW')).toBeDefined();
  });

  it('replaces a deeply nested folder', () => {
    const result = replaceSubFolder(makeTree(), ['A', 'B', 'C'], newNode);
    const a = result.find((s) => s.name === 'A')!;
    const b = a.items!.find((s) => s.name === 'B')!;
    expect(b.items!.find((s) => s.name === 'C')).toBeUndefined();
    expect(b.items!.find((s) => s.name === 'NEW')).toBeDefined();
  });

  it('does not mutate the original items', () => {
    const original = makeTree();
    replaceSubFolder(original, ['A', 'D'], newNode);
    const a = original.find((s) => s.name === 'A')!;
    expect(a.items!.find((s) => s.name === 'D')).toBeDefined();
    expect(a.items!.find((s) => s.name === 'NEW')).toBeUndefined();
  });

  it('preserves the position of the replaced node', () => {
    // B is index 0, D is index 1 under A
    const result = replaceSubFolder(makeTree(), ['A', 'B'], newNode);
    const a = result.find((s) => s.name === 'A')!;
    expect(a.items!.at(0)?.name).toBe('NEW');
    expect(a.items!.at(1)?.name).toBe('D');
  });

  it('preserves sibling folders and their children', () => {
    const result = replaceSubFolder(makeTree(), ['A', 'D'], newNode);
    const a = result.find((s) => s.name === 'A')!;
    const b = a.items!.find((s) => s.name === 'B')!;
    expect(b.items).toHaveLength(1);
    expect(b.items!.at(0)?.name).toBe('C');
    expect(result.find((s) => s.name === 'E')).toBeDefined();
  });

  it('throws when path is empty', () => {
    expect(() => replaceSubFolder(makeTree(), [], newNode)).toThrow('path must not be empty');
  });

  it('throws when a root-level folder is not found', () => {
    expect(() => replaceSubFolder(makeTree(), ['Z'], newNode)).toThrow('Folder "Z" not found');
  });

  it('throws when an intermediate folder is not found', () => {
    expect(() => replaceSubFolder(makeTree(), ['A', 'Z'], newNode)).toThrow('Folder "Z" not found');
  });

  it('throws when an intermediate folder has no children', () => {
    expect(() => replaceSubFolder(makeTree(), ['A', 'D', 'X'], newNode)).toThrow('Folder "D" has no children');
  });
});

describe('insertSubFolder', () => {
  const newFolder: FolderItem = { kind: 'Folder', name: 'NEW' };

  it('inserts at the root level when parentPath is empty', () => {
    const result = insertSubFolder(makeTree(), [], newFolder);
    expect(result).toHaveLength(3);
    expect(result.at(2)?.name).toBe('NEW');
  });

  it('inserts as a child of a root-level folder', () => {
    const result = insertSubFolder(makeTree(), ['A'], newFolder);
    const a = result.find((s) => s.name === 'A')!;
    expect(a.items).toHaveLength(3);
    expect(a.items!.at(2)?.name).toBe('NEW');
  });

  it('inserts as a child of a deeply nested folder', () => {
    const result = insertSubFolder(makeTree(), ['A', 'B'], newFolder);
    const a = result.find((s) => s.name === 'A')!;
    const b = a.items!.find((s) => s.name === 'B')!;
    expect(b.items).toHaveLength(2);
    expect(b.items!.at(1)?.name).toBe('NEW');
  });

  it('inserts into a folder that currently has no items', () => {
    const result = insertSubFolder(makeTree(), ['E'], newFolder);
    const e = result.find((s) => s.name === 'E')!;
    expect(e.items).toHaveLength(1);
    expect(e.items!.at(0)?.name).toBe('NEW');
  });

  it('does not mutate the original items', () => {
    const original = makeTree();
    insertSubFolder(original, ['A'], newFolder);
    const a = original.find((s) => s.name === 'A')!;
    expect(a.items).toHaveLength(2);
  });

  it('preserves existing siblings', () => {
    const result = insertSubFolder(makeTree(), ['A'], newFolder);
    const a = result.find((s) => s.name === 'A')!;
    expect(a.items!.map((s) => s.name)).toEqual(['B', 'D', 'NEW']);
  });

  it('throws when a folder with the same name already exists', () => {
    expect(() => insertSubFolder(makeTree(), ['A'], { kind: 'Folder', name: 'B' })).toThrow(
      'Folder "B" already exists'
    );
  });

  it('throws when an intermediate folder is not found', () => {
    expect(() => insertSubFolder(makeTree(), ['Z'], newFolder)).toThrow();
  });

  it('throws when an intermediate segment has no children', () => {
    expect(() => insertSubFolder(makeTree(), ['A', 'D', 'X'], newFolder)).toThrow('Folder "D" has no children');
  });
});
