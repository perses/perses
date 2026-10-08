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

import type { FolderResource } from '@perses-dev/client';
import type { TableColumnConfig } from '@perses-dev/components';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { useCallback } from 'react';
import { vi } from 'vitest';

import type { DashboardListRow } from './DashboardList';
import type { DashboardTreeTableRow } from './DashboardTreeList';
import DashboardTreeList from './DashboardTreeList';

interface MockTableProps {
  data: DashboardTreeTableRow[];
  columns: Array<TableColumnConfig<DashboardTreeTableRow>>;
  pagination: { pageIndex: number; pageSize: number };
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
}

// Only renders the actions cell of each row.
function MockTable({ data, columns, pagination, onPaginationChange }: MockTableProps): ReactElement {
  const showTenRows = useCallback((): void => onPaginationChange({ pageIndex: 0, pageSize: 10 }), [onPaginationChange]);
  const renderActionsCell = columns.find((column) => column.id === 'actions')?.cell;
  return (
    <>
      <span>Rows per page: {pagination.pageSize}</span>
      <button type="button" onClick={showTenRows}>
        Show 10 rows
      </button>
      {typeof renderActionsCell === 'function' &&
        data.map((row) => (
          <div key={row.name}>{renderActionsCell({ row: { original: row } } as never) as ReactNode}</div>
        ))}
    </>
  );
}

vi.mock('@perses-dev/components', () => ({
  Table: MockTable,
}));

vi.mock('../../context/Config', () => ({
  useDefaultRowsPerPage: (): number => 50,
  useIsReadonly: (): boolean => false,
}));

vi.mock('../../context/Authorization', () => ({
  GlobalProject: '*',
  useHasPermission: (): boolean => true,
}));

vi.mock('../../utils/browser-size', () => ({
  useIsMobileSize: (): boolean => false,
}));

const noopHandler = (): (() => void) => () => undefined;
const emptyFolderList: FolderResource[] = [];
const emptyDashboardsMap = new Map<string, Map<string, DashboardListRow>>();
const dashboardsMap = new Map([
  [
    'myproject',
    new Map<string, DashboardListRow>([
      [
        'mydashboard',
        {
          index: 0,
          project: 'myproject',
          name: 'mydashboard',
          displayName: 'My Dashboard',
          version: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
          tags: [],
        },
      ],
    ]),
  ],
]);

function renderDashboardTreeList(
  map: Map<string, Map<string, DashboardListRow>> = emptyDashboardsMap,
  duplicationDisabledReason?: string,
): void {
  render(
    <DashboardTreeList
      folderList={emptyFolderList}
      dashboardsMap={map}
      handleRenameButtonClick={noopHandler}
      handleDuplicateButtonClick={noopHandler}
      handleDeleteButtonClick={noopHandler}
      handleEditFolderButtonClick={noopHandler}
      handleAddFolderButtonClick={noopHandler}
      handleDeleteFolderButtonClick={noopHandler}
      duplicationDisabledReason={duplicationDisabledReason}
    />,
  );
}

describe('DashboardTreeList', () => {
  it('uses the configured default rows per page for its initial pagination', () => {
    renderDashboardTreeList();

    expect(screen.queryByText('Rows per page: 50')).not.toBeNull();
  });

  it('allows the user to change the rows per page after initialization', () => {
    renderDashboardTreeList();

    fireEvent.click(screen.getByRole('button', { name: 'Show 10 rows' }));

    expect(screen.queryByText('Rows per page: 10')).not.toBeNull();
  });

  it('enables the duplicate button when no disabled reason is given', () => {
    renderDashboardTreeList(dashboardsMap);

    expect(within(screen.getByLabelText('Duplicate')).getByRole('button').hasAttribute('disabled')).toBe(false);
  });

  it('disables the duplicate button and explains why in its tooltip', () => {
    const reason = "Missing 'create' permission in any project for 'Dashboard' kind";
    renderDashboardTreeList(dashboardsMap, reason);

    expect(screen.queryByLabelText('Duplicate')).toBeNull();
    expect(within(screen.getByLabelText(reason)).getByRole('button').hasAttribute('disabled')).toBe(true);
  });
});
