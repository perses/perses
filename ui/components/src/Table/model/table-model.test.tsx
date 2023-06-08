// Copyright 2023 The Perses Authors
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

import { createTheme } from '@mui/material';
import { TableColumnConfig, getTableCellLayout, persesColumnsToTanstackColumns } from './table-model';

const mockMuiTheme = createTheme({});

describe('getTableCellLayout', () => {
  describe.each(['compact', 'standard'] as const)('gets layout for %s density', (density) => {
    test.each([
      { name: 'first column', opts: { isFirstColumn: true } },
      { name: 'center column', opts: {} },
      { name: 'last column', opts: { isLastColumn: true } },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ])(`in $name`, ({ name, opts }) => {
      expect(getTableCellLayout(mockMuiTheme, density, opts)).toMatchSnapshot();
    });
  });
});

type MockTableData = {
  id: string;
  label: string;
  value: number;
};

describe('persesColumnToTanstackColumn', () => {
  test('maps "auto" width to all zero `size` values', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        width: 'auto',
      },
    ];
    const tanstackColumns = persesColumnsToTanstackColumns(persesColumns);
    expect(tanstackColumns[0]).toEqual(
      expect.objectContaining({
        size: 0,
        minSize: 0,
        maxSize: 0,
      })
    );
  });

  test('persists numeric width value as `size`', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        width: 100,
      },
    ];
    const tanstackColumns = persesColumnsToTanstackColumns(persesColumns);
    expect(tanstackColumns[0]).toEqual(
      expect.objectContaining({
        size: 100,
      })
    );
  });

  test('maps `align` prop to associated `meta` property`', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        align: 'center',
      },
    ];
    const tanstackColumns = persesColumnsToTanstackColumns(persesColumns);
    expect(tanstackColumns[0]).toEqual(
      expect.objectContaining({
        meta: {
          align: 'center',
        },
      })
    );
  });

  test('transforms perses columns to tanstack columns', () => {
    const persesColumns: Array<TableColumnConfig<MockTableData>> = [
      {
        accessorKey: 'label',
        header: 'Name',
        width: 'auto',
        align: 'right',
      },
      {
        accessorKey: 'value',
        header: 'Count',
        width: 120,
        cell: (data) => <strong>{data.getValue()}</strong>,
      },
    ];
    expect(persesColumnsToTanstackColumns(persesColumns)).toMatchSnapshot();
  });
});
