// Copyright 2022 The Perses Authors
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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalculationType } from '../../model/calculations';
import { CalculationSelector } from './CalculationSelector';

describe('CalculationSelector', () => {
  const renderCalculationSelector = (value: CalculationType, onChange = jest.fn()) => {
    render(
      <div>
        <CalculationSelector value={value} onChange={onChange} />
      </div>
    );
  };

  const getCalculationSelector = () => {
    return screen.getByRole('combobox', { name: 'Calculation' });
  };

  it('can change the calculation by clicking', () => {
    const onChange = jest.fn();
    renderCalculationSelector('Last', onChange);

    const calcSelector = getCalculationSelector();
    userEvent.click(calcSelector);
    const sumOption = screen.getByRole('option', {
      name: 'Sum',
    });
    userEvent.click(sumOption);

    expect(onChange).toHaveBeenCalledWith('Sum');
  });

  it('can change the calculation using a keyboard', () => {
    const onChange = jest.fn();
    renderCalculationSelector('First', onChange);

    const calcSelector = getCalculationSelector();
    userEvent.tab();
    expect(calcSelector).toHaveFocus();

    userEvent.clear(calcSelector);
    userEvent.keyboard('first');
    screen.getByRole('option', {
      name: 'First',
    });

    userEvent.keyboard('{arrowup}{enter}');

    expect(onChange).toHaveBeenCalledWith('First');
  });
});
