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

import { FolderResource } from '@perses-dev/core';
import { DashboardTreeTableRow } from '../components/DashboardList/DashboardTreeList';
import { DashboardListRow } from '../components/DashboardList/DashboardList';
import { buildTableRows, sortDashboardTableStringColumn } from './dashboardTableUtils';

describe('buildTableRows – no folders', () => {
  it('returns an empty array when both inputs are empty', () => {
    expect(buildTableRows([], new Map())).toEqual([]);
  });

  it('returns one flat row per dashboard when there are no folders', () => {
    const dashA: DashboardListRow = {
      index: 0,
      project: 'myproject',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
      tags: [],
    };
    const dashB: DashboardListRow = {
      index: 1,
      project: 'myproject',
      name: 'dash-b',
      displayName: 'dash-b',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
      tags: [],
    };
    const map = new Map([
      [
        'myproject',
        new Map([
          ['dash-a', dashA],
          ['dash-b', dashB],
        ]),
      ],
    ]);

    const rows = buildTableRows([], map);

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.name)).toEqual(expect.arrayContaining(['dash-a', 'dash-b']));
  });

  it('sets path to [] for loose dashboards', () => {
    const dash: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
      tags: [],
    };
    const map = new Map([['p', new Map([['dash-a', dash]])]]);

    const rows = buildTableRows([], map);

    expect(rows[0]!.path).toEqual([]);
  });

  it('uses displayName when present', () => {
    const dash: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'My Pretty Name',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const map = new Map([['p', new Map([['dash-a', dash]])]]);

    const rows = buildTableRows([], map);

    expect(rows[0]!.displayName).toBe('My Pretty Name');
  });

  it('uses name as displayName when displayName equals name', () => {
    const dash: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const map = new Map([['p', new Map([['dash-a', dash]])]]);

    const rows = buildTableRows([], map);

    expect(rows[0]!.displayName).toBe('dash-a');
  });

  it('populates createdAt and updatedAt as Date objects', () => {
    const dash: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
      tags: [],
    };
    const map = new Map([['p', new Map([['dash-a', dash]])]]);

    const rows = buildTableRows([], map);

    expect(rows[0]!.createdAt).toBeInstanceOf(Date);
    expect(rows[0]!.updatedAt).toBeInstanceOf(Date);
    expect(rows[0]!.createdAt?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('leaves createdAt / updatedAt undefined when timestamps are empty strings', () => {
    const dash: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const map = new Map([['p', new Map([['dash-a', dash]])]]);

    const rows = buildTableRows([], map);

    expect(rows[0]!.createdAt).toBeUndefined();
    expect(rows[0]!.updatedAt).toBeUndefined();
  });

  it('carries tags and version', () => {
    const dash: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 3,
      createdAt: '',
      updatedAt: '',
      tags: ['tag1', 'tag2'],
    };
    const map = new Map([['p', new Map([['dash-a', dash]])]]);

    const rows = buildTableRows([], map);

    expect(rows[0]!.tags).toEqual(['tag1', 'tag2']);
    expect(rows[0]!.version).toBe(3);
  });

  it('handles multiple projects independently', () => {
    const dashX: DashboardListRow = {
      index: 0,
      project: 'proj-x',
      name: 'dash-1',
      displayName: 'dash-1',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const dashY: DashboardListRow = {
      index: 0,
      project: 'proj-y',
      name: 'dash-2',
      displayName: 'dash-2',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const map = new Map([
      ['proj-x', new Map([['dash-1', dashX]])],
      ['proj-y', new Map([['dash-2', dashY]])],
    ]);

    const rows = buildTableRows([], map);

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.project)).toEqual(expect.arrayContaining(['proj-x', 'proj-y']));
  });
});

describe('buildTableRows – flat folders', () => {
  it('returns a single folder row that contains its dashboard children', () => {
    const dashA: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const dashB: DashboardListRow = {
      index: 1,
      project: 'p',
      name: 'dash-b',
      displayName: 'dash-b',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'my-folder', project: 'p', version: 1 },
      spec: [
        { kind: 'Dashboard', name: 'dash-a' },
        { kind: 'Dashboard', name: 'dash-b' },
      ],
    };
    const map = new Map([
      [
        'p',
        new Map([
          ['dash-a', dashA],
          ['dash-b', dashB],
        ]),
      ],
    ]);

    const rows = buildTableRows([folder], map);

    expect(rows).toHaveLength(1);
    expect(rows[0]!.kind).toBe('Folder');
    expect(rows[0]!.children).toHaveLength(2);
  });

  it('sets the correct path on a folder row', () => {
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'my-folder', project: 'p', version: 1 },
      spec: [],
    };

    const rows = buildTableRows([folder], new Map());

    expect(rows[0]!.path).toEqual([]);
  });

  it('sets the correct path on dashboard children inside a folder', () => {
    const dash: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'my-folder', project: 'p', version: 1 },
      spec: [{ kind: 'Dashboard', name: 'dash-a' }],
    };
    const map = new Map([['p', new Map([['dash-a', dash]])]]);

    const rows = buildTableRows([folder], map);

    expect(rows[0]!.children![0]!.path).toEqual(['my-folder']);
  });

  it('uses folder metadata.name as displayName when no display spec is set', () => {
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'my-folder', project: 'p', version: 1 },
      spec: [],
    };

    const rows = buildTableRows([folder], new Map());

    expect(rows[0]!.displayName).toBe('my-folder');
  });

  it('dashboards not referenced by any folder appear as loose rows', () => {
    const inFolder: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'in-folder',
      displayName: 'in-folder',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const loose: DashboardListRow = {
      index: 1,
      project: 'p',
      name: 'loose',
      displayName: 'loose',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'f', project: 'p', version: 1 },
      spec: [{ kind: 'Dashboard', name: 'in-folder' }],
    };
    const map = new Map([
      [
        'p',
        new Map([
          ['in-folder', inFolder],
          ['loose', loose],
        ]),
      ],
    ]);

    const rows = buildTableRows([folder], map);

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.name)).toEqual(expect.arrayContaining(['f', 'loose']));
  });

  it('does not include a dashboard both inside a folder and as a loose row', () => {
    const dash: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'f', project: 'p', version: 1 },
      spec: [{ kind: 'Dashboard', name: 'dash-a' }],
    };
    const map = new Map([['p', new Map([['dash-a', dash]])]]);

    const rows = buildTableRows([folder], map);

    expect(rows).toHaveLength(1);
    expect(rows[0]!.kind).toBe('Folder');
  });

  it('skips a Dashboard entry in folder spec when the dashboard is not in the map', () => {
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'f', project: 'p', version: 1 },
      spec: [{ kind: 'Dashboard', name: 'missing' }],
    };

    const rows = buildTableRows([folder], new Map());

    expect(rows[0]!.children).toHaveLength(0);
  });

  it('a folder referencing no dashboards produces an empty children array', () => {
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'empty-folder', project: 'p', version: 1 },
      spec: [],
    };

    const rows = buildTableRows([folder], new Map());

    expect(rows[0]!.children).toHaveLength(0);
  });

  it('carries folder version from metadata', () => {
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'f', project: 'p', version: 7 },
      spec: [],
    };

    const rows = buildTableRows([folder], new Map());

    expect(rows[0]!.version).toBe(7);
  });
});

// --- nested folders ----------------------------------------------------------

describe('buildTableRows – nested folders', () => {
  it('produces a two-level hierarchy', () => {
    const dash: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const outer: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'outer', project: 'p', version: 1 },
      spec: [
        {
          kind: 'Folder',
          name: 'inner',
          spec: [{ kind: 'Dashboard', name: 'dash-a' }],
        },
      ],
    };
    const map = new Map([['p', new Map([['dash-a', dash]])]]);

    const rows = buildTableRows([outer], map);

    expect(rows).toHaveLength(1);
    const outerRow = rows[0]!;
    expect(outerRow.children).toHaveLength(1);
    const innerRow = outerRow.children![0]!;
    expect(innerRow.kind).toBe('Folder');
    expect(innerRow.children).toHaveLength(1);
    expect(innerRow.children![0]!.name).toBe('dash-a');
  });

  it('builds the correct path for deeply nested dashboards', () => {
    const dash: DashboardListRow = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const top: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'top', project: 'p', version: 1 },
      spec: [
        {
          kind: 'Folder',
          name: 'mid',
          spec: [
            {
              kind: 'Folder',
              name: 'deep',
              spec: [{ kind: 'Dashboard', name: 'dash-a' }],
            },
          ],
        },
      ],
    };
    const map = new Map([['p', new Map([['dash-a', dash]])]]);

    const rows = buildTableRows([top], map);

    const dashRow = rows[0]!.children![0]!.children![0]!.children![0]!;
    expect(dashRow.path).toEqual(['top', 'mid', 'deep']);
  });

  it('a nested folder with no spec produces undefined children', () => {
    const outer: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'outer', project: 'p', version: 1 },
      spec: [{ kind: 'Folder', name: 'inner' }],
    };

    const rows = buildTableRows([outer], new Map());

    expect(rows[0]!.children![0]!.children).toBeUndefined();
  });

  it('throws on an unknown kind in folder spec', () => {
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'f', project: 'p', version: 1 },
      spec: [{ kind: 'Unknown', name: 'x' }] as unknown as FolderResource['spec'],
    };

    expect(() => buildTableRows([folder], new Map())).toThrow('Unknown kind: Unknown');
  });
});

describe('buildTableRows – multiple projects', () => {
  it('places dashboards in the correct project folder', () => {
    const dashA: DashboardListRow = {
      index: 0,
      project: 'proj-a',
      name: 'dash-1',
      displayName: 'dash-1',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const dashB: DashboardListRow = {
      index: 0,
      project: 'proj-b',
      name: 'dash-2',
      displayName: 'dash-2',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const folderA: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'f-a', project: 'proj-a', version: 1 },
      spec: [{ kind: 'Dashboard', name: 'dash-1' }],
    };
    const folderB: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'f-b', project: 'proj-b', version: 1 },
      spec: [{ kind: 'Dashboard', name: 'dash-2' }],
    };
    const map = new Map([
      ['proj-a', new Map([['dash-1', dashA]])],
      ['proj-b', new Map([['dash-2', dashB]])],
    ]);

    const rows = buildTableRows([folderA, folderB], map);

    expect(rows).toHaveLength(2);
    const rowA = rows.find((r) => r.project === 'proj-a')!;
    const rowB = rows.find((r) => r.project === 'proj-b')!;
    expect(rowA.children![0]!.name).toBe('dash-1');
    expect(rowB.children![0]!.name).toBe('dash-2');
  });

  it('does not leak dashboards between projects', () => {
    const dashA: DashboardListRow = {
      index: 0,
      project: 'proj-a',
      name: 'same-name',
      displayName: 'same-name',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const dashB: DashboardListRow = {
      index: 0,
      project: 'proj-b',
      name: 'same-name',
      displayName: 'same-name',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const folderA: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'f-a', project: 'proj-a', version: 1 },
      spec: [{ kind: 'Dashboard', name: 'same-name' }],
    };
    const map = new Map([
      ['proj-a', new Map([['same-name', dashA]])],
      ['proj-b', new Map([['same-name', dashB]])],
    ]);

    const rows = buildTableRows([folderA], map);

    expect(rows).toHaveLength(2);
    const folderRow = rows.find((r) => r.kind === 'Folder')!;
    expect(folderRow.project).toBe('proj-a');
    const looseRow = rows.find((r) => r.kind === 'Dashboard')!;
    expect(looseRow.project).toBe('proj-b');
  });

  it('emits an empty children list for a folder whose project has no dashboards in the map', () => {
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'f', project: 'ghost-project', version: 1 },
      spec: [{ kind: 'Dashboard', name: 'anything' }],
    };

    const rows = buildTableRows([folder], new Map());

    expect(rows[0]!.children).toHaveLength(0);
  });
});

describe('buildTableRows – idempotency', () => {
  it('does not mutate the original dashboardsMap', () => {
    const dash: DashboardListRow & { inFolder?: boolean } = {
      index: 0,
      project: 'p',
      name: 'dash-a',
      displayName: 'dash-a',
      version: 1,
      createdAt: '',
      updatedAt: '',
      tags: [],
    };
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: { name: 'f', project: 'p', version: 1 },
      spec: [{ kind: 'Dashboard', name: 'dash-a' }],
    };
    const map = new Map([['p', new Map([['dash-a', dash]])]]);

    buildTableRows([folder], map);

    // The original object must not have been mutated (no inFolder property)
    expect(map.get('p')?.get('dash-a')).toEqual(dash);
    expect(map.get('p')?.get('dash-a')?.inFolder).toBeUndefined();
  });
});

const row = (
  kind: DashboardTreeTableRow['kind'],
  displayName: string,
  project = 'p'
): { original: DashboardTreeTableRow } => ({
  original: { kind, displayName, project, name: displayName.toLowerCase(), path: [] },
});

describe('sortDashboardTableStringColumn', () => {
  describe('field: displayName – ascending (isDesc = false)', () => {
    it('places Folder before Dashboard', () => {
      expect(
        sortDashboardTableStringColumn(row('Folder', 'ab'), row('Dashboard', 'ab'), 'displayName', false)
      ).toBeLessThan(0);
    });

    it('places Dashboard after Folder', () => {
      expect(
        sortDashboardTableStringColumn(row('Dashboard', 'a'), row('Folder', 'a'), 'displayName', false)
      ).toBeGreaterThan(0);
    });

    it('sorts two Folders alphabetically', () => {
      expect(
        sortDashboardTableStringColumn(row('Folder', 'Alpha'), row('Folder', 'Beta'), 'displayName', false)
      ).toBeLessThan(0);
      expect(
        sortDashboardTableStringColumn(row('Folder', 'Beta'), row('Folder', 'Alpha'), 'displayName', false)
      ).toBeGreaterThan(0);
    });

    it('sorts two Dashboards alphabetically', () => {
      expect(
        sortDashboardTableStringColumn(row('Dashboard', 'Alpha'), row('Dashboard', 'Beta'), 'displayName', false)
      ).toBeLessThan(0);
      expect(
        sortDashboardTableStringColumn(row('Dashboard', 'Beta'), row('Dashboard', 'Alpha'), 'displayName', false)
      ).toBeGreaterThan(0);
    });

    it('returns 0 for same kind and same displayName', () => {
      expect(
        sortDashboardTableStringColumn(row('Dashboard', 'Same'), row('Dashboard', 'Same'), 'displayName', false)
      ).toBe(0);
      expect(sortDashboardTableStringColumn(row('Folder', 'Same'), row('Folder', 'Same'), 'displayName', false)).toBe(
        0
      );
    });
  });

  describe('field: displayName – descending (isDesc = true)', () => {
    it('returns a positive value for Folder vs Dashboard (folder on top)', () => {
      expect(
        sortDashboardTableStringColumn(row('Folder', 'a'), row('Dashboard', 'a'), 'displayName', true)
      ).toBeGreaterThan(0);
    });

    it('returns a negative value for Dashboard vs Folder (folder on top)', () => {
      expect(
        sortDashboardTableStringColumn(row('Dashboard', 'a'), row('Folder', 'a'), 'displayName', true)
      ).toBeLessThan(0);
    });

    it('sorts two Folders alphabetically', () => {
      expect(
        sortDashboardTableStringColumn(row('Folder', 'Alpha'), row('Folder', 'Beta'), 'displayName', true)
      ).toBeLessThan(0);
    });

    it('sorts two Dashboards alphabetically', () => {
      expect(
        sortDashboardTableStringColumn(row('Dashboard', 'Alpha'), row('Dashboard', 'Beta'), 'displayName', true)
      ).toBeLessThan(0);
    });
  });

  describe('field: project', () => {
    it('places Folder before Dashboard regardless of project name', () => {
      expect(
        sortDashboardTableStringColumn(row('Folder', 'x', 'proj-a'), row('Dashboard', 'x', 'proj-b'), 'project', false)
      ).toBeLessThan(0);
    });

    it('sorts two rows of the same kind by project alphabetically', () => {
      expect(
        sortDashboardTableStringColumn(row('Dashboard', 'x', 'alpha'), row('Dashboard', 'x', 'beta'), 'project', false)
      ).toBeLessThan(0);
      expect(
        sortDashboardTableStringColumn(row('Dashboard', 'x', 'beta'), row('Dashboard', 'x', 'alpha'), 'project', false)
      ).toBeGreaterThan(0);
    });

    it('keeps folders on top when descending by project', () => {
      expect(
        sortDashboardTableStringColumn(row('Folder', 'x', 'proj-a'), row('Dashboard', 'x', 'proj-b'), 'project', true)
      ).toBeGreaterThan(0);
    });
  });
});
