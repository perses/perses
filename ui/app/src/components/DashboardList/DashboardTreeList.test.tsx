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

import { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardTreeList from './DashboardTreeList';

jest.mock('@perses-dev/components', () => ({
  Table: ({
    pagination,
    onPaginationChange,
  }: {
    pagination: { pageIndex: number; pageSize: number };
    onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
  }): ReactElement => (
    <>
      <span data-testid="page-size">{pagination.pageSize}</span>
      <button onClick={() => onPaginationChange({ pageIndex: 0, pageSize: 10 })}>Show 10 rows</button>
    </>
  ),
}));

jest.mock('../../context/Config', () => ({
  useDefaultRowsPerPage: (): number => 50,
}));

jest.mock('../../utils/browser-size', () => ({
  useIsMobileSize: (): boolean => false,
}));

const noopHandler = (): (() => void) => () => undefined;

function renderDashboardTreeList(): void {
  render(
    <DashboardTreeList
      folderList={[]}
      dashboardsMap={new Map()}
      handleRenameButtonClick={noopHandler}
      handleDuplicateButtonClick={noopHandler}
      handleDeleteButtonClick={noopHandler}
      handleEditFolderButtonClick={noopHandler}
      handleAddFolderButtonClick={noopHandler}
      handleDeleteFolderButtonClick={noopHandler}
    />
  );
}

describe('DashboardTreeList', () => {
  it('uses the configured default rows per page for its initial pagination', () => {
    renderDashboardTreeList();

    expect(screen.getByTestId('page-size')).toHaveTextContent('50');
  });

  it('allows the user to change the rows per page after initialization', () => {
    renderDashboardTreeList();

    fireEvent.click(screen.getByRole('button', { name: 'Show 10 rows' }));

    expect(screen.getByTestId('page-size')).toHaveTextContent('10');
  });
});
