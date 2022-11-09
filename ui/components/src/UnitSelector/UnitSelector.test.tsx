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
import { UnitOptions } from '../model';
import { UnitSelector } from './UnitSelector';

describe('UnitSelector', () => {
  const renderUnitSelector = (value: UnitOptions, onChange = jest.fn()) => {
    render(
      <div>
        <UnitSelector value={value} onChange={onChange} />
      </div>
    );
  };

  const getUnitSelector = () => {
    return screen.getByRole('combobox', { name: 'Units' });
  };

  const getDecimalSelector = () => {
    return screen.getByRole('combobox', { name: 'Decimal' });
  };

  const getAbbreviateSwitch = () => {
    return screen.getByRole('checkbox', { name: 'Abbreviate' });
  };

  it('can change the unit kind by clicking', () => {
    const onChange = jest.fn();
    renderUnitSelector({ kind: 'Minutes' }, onChange);

    const unitSelector = getUnitSelector();
    userEvent.click(unitSelector);
    const decimalOption = screen.getByRole('option', {
      name: 'Decimal',
    });
    userEvent.click(decimalOption);

    expect(onChange).toHaveBeenCalledWith({
      kind: 'Decimal',
    });
  });

  it('can change the unit kind using a keyboard', () => {
    const onChange = jest.fn();
    renderUnitSelector({ kind: 'Bytes' }, onChange);

    const unitSelector = getUnitSelector();
    // Note that this tab order can change depending on the type because the
    // abbreviate comes first and is disabled in some cases.
    userEvent.tab();
    expect(unitSelector).toHaveFocus();

    userEvent.clear(unitSelector);
    userEvent.keyboard('years');
    screen.getByRole('option', {
      name: 'Years',
    });

    userEvent.keyboard('{arrowup}{enter}');

    expect(onChange).toHaveBeenCalledWith({
      kind: 'Years',
    });
  });

  it('can change the decimal places by clicking', () => {
    const onChange = jest.fn();
    renderUnitSelector({ kind: 'Decimal', decimal_places: 0, abbreviate: true }, onChange);

    userEvent.click(getDecimalSelector());
    const decimalOption = screen.getByRole('option', {
      name: '1',
    });
    userEvent.click(decimalOption);

    expect(onChange).toHaveBeenCalledWith({
      kind: 'Decimal',
      decimal_places: 1,
      abbreviate: true,
    });
  });

  it('can change the decimal places using a keyboard', () => {
    const onChange = jest.fn();
    renderUnitSelector({ kind: 'Percent' }, onChange);

    const decimalSelector = getDecimalSelector();
    userEvent.tab();
    userEvent.tab();
    expect(decimalSelector).toHaveFocus();

    userEvent.clear(decimalSelector);
    userEvent.keyboard('3');
    screen.getByRole('option', {
      name: '3',
    });

    userEvent.keyboard('{arrowup}{enter}');

    expect(onChange).toHaveBeenCalledWith({
      kind: 'Percent',
      decimal_places: 3,
    });
  });

  it('can change abbreviate by clicking', () => {
    const onChange = jest.fn();
    renderUnitSelector({ kind: 'Decimal', decimal_places: 3, abbreviate: true }, onChange);

    userEvent.click(getAbbreviateSwitch());

    expect(onChange).toHaveBeenCalledWith({
      kind: 'Decimal',
      decimal_places: 3,
      abbreviate: false,
    });
  });

  it('can change abbreviate using a keyboard', () => {
    const onChange = jest.fn();
    renderUnitSelector({ kind: 'Decimal', decimal_places: 0 }, onChange);

    userEvent.tab();
    userEvent.keyboard('{space}');

    expect(onChange).toHaveBeenCalledWith({
      kind: 'Decimal',
      decimal_places: 0,
      abbreviate: true,
    });
  });

  describe('with a time unit selected', () => {
    it('does not allow the user to modify the decimal places', () => {
      renderUnitSelector({ kind: 'Hours' });
      expect(getDecimalSelector()).toBeDisabled();
    });

    it('does not allow the user to set abbreviate', () => {
      renderUnitSelector({ kind: 'Minutes' });
      expect(getAbbreviateSwitch()).toBeDisabled();
    });
  });

  describe('with a percent unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderUnitSelector({ kind: 'Percent' });
      expect(getDecimalSelector()).toBeEnabled();
    });

    it('does not allow the user to set abbreviate', () => {
      renderUnitSelector({ kind: 'PercentDecimal' });
      expect(getAbbreviateSwitch()).toBeDisabled();
    });
  });

  describe('with a decimal unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderUnitSelector({ kind: 'Decimal' });
      expect(getDecimalSelector()).toBeEnabled();
    });

    it('allows the user to set abbreviate', () => {
      renderUnitSelector({ kind: 'Decimal' });
      expect(getAbbreviateSwitch()).toBeEnabled();
    });
  });

  describe('with a bytes unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderUnitSelector({ kind: 'Bytes' });
      expect(getDecimalSelector()).toBeEnabled();
    });

    it('does not allow the user to set abbreviate', () => {
      renderUnitSelector({ kind: 'Bytes' });
      expect(getAbbreviateSwitch()).toBeDisabled();
    });
  });
});
