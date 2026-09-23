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
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { vi } from 'vitest';

import type { DashboardListRow } from './DashboardList';
import DashboardTreeList from './DashboardTreeList';

interface MockTableProps {
  pagination: { pageIndex: number; pageSize: number };
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
}

function MockTable({ pagination, onPaginationChange }: MockTableProps): ReactElement {
  const showTenRows = useCallback((): void => onPaginationChange({ pageIndex: 0, pageSize: 10 }), [onPaginationChange]);
  return (
    <>
      <span>Rows per page: {pagination.pageSize}</span>
      <button type="button" onClick={showTenRows}>
        Show 10 rows
      </button>
    </>
  );
}

vi.mock('@perses-dev/components', () => ({
  Table: MockTable,
}));

vi.mock('../../context/Config', () => ({
  useDefaultRowsPerPage: (): number => 50,
}));

vi.mock('../../utils/browser-size', () => ({
  useIsMobileSize: (): boolean => false,
}));

const noopHandler = (): (() => void) => () => undefined;
const emptyFolderList: FolderResource[] = [];
const emptyDashboardsMap = new Map<string, Map<string, DashboardListRow>>();

function renderDashboardTreeList(): void {
  render(
    <DashboardTreeList
      folderList={emptyFolderList}
      dashboardsMap={emptyDashboardsMap}
      handleRenameButtonClick={noopHandler}
      handleDuplicateButtonClick={noopHandler}
      handleDeleteButtonClick={noopHandler}
      handleEditFolderButtonClick={noopHandler}
      handleAddFolderButtonClick={noopHandler}
      handleDeleteFolderButtonClick={noopHandler}
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
});
