// Copyright 2024 The Perses Authors
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

import { render, screen, fireEvent } from '@testing-library/react';
import { TableOptions } from '@perses-dev/panels-plugin';
import { TableColumnsEditor } from './TableColumnsEditor';

function renderTableColumnsEditor(value: TableOptions, onChange = jest.fn()): void {
  render(<TableColumnsEditor value={value} onChange={onChange} />);
}

describe('TableColumnsEditor', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('can add a new column settings', () => {
    const onChange = jest.fn();
    renderTableColumnsEditor({ columnSettings: [] }, onChange);
    const addColumnButton = screen.getByRole('button', { name: /Add Column Settings/i });
    fireEvent.click(addColumnButton);
    expect(onChange).toHaveBeenCalledWith({ columnSettings: [{ name: 'column_0' }] });
  });

  it('can enable column custom width', () => {
    const onChange = jest.fn();
    renderTableColumnsEditor({ columnSettings: [{ name: 'column_0' }] }, onChange);

    // Expand the column settings editor for column_0
    const collapseIcon = screen.getByTestId('column-toggle#column_0');
    fireEvent.click(collapseIcon);
    const customWidthSwitch = screen.getByRole('checkbox', { name: /Custom width/i });
    fireEvent.click(customWidthSwitch);
    expect(onChange).toHaveBeenCalledWith({ columnSettings: [{ name: 'column_0', width: 100 }] });
  });

  it('can rename a column', () => {
    const onChange = jest.fn();
    renderTableColumnsEditor({ columnSettings: [{ name: 'column_0' }] }, onChange);

    // Expand the column settings editor for column_0
    const collapseIcon = screen.getByTestId('column-toggle#column_0');
    fireEvent.click(collapseIcon);

    const nameInput = screen.getByRole('textbox', { name: /Name/i });
    fireEvent.change(nameInput, { target: { value: 'MySuperName' } });
    jest.advanceTimersByTime(500);
    expect(onChange).toHaveBeenCalledWith({ columnSettings: [{ name: 'MySuperName' }] });
  });
});
