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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnitOptions } from '@perses-dev/core';
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
    return screen.getByRole('combobox', { name: 'Unit' });
  };

  const getDecimalPlacesSelector = () => {
    return screen.getByRole('combobox', { name: 'Decimals' });
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
    userEvent.tab();
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
    renderUnitSelector({ kind: 'Decimal', decimalPlaces: 0, abbreviate: true }, onChange);

    userEvent.click(getDecimalPlacesSelector());
    const decimalPlacesOption = screen.getByRole('option', {
      name: 'Default',
    });
    userEvent.click(decimalPlacesOption);

    expect(onChange).toHaveBeenCalledWith({
      kind: 'Decimal',
      decimalPlaces: undefined,
      abbreviate: true,
    });
  });

  it('can change the decimal places using a keyboard', () => {
    const onChange = jest.fn();
    renderUnitSelector({ kind: 'Percent' }, onChange);

    const decimalPlacesSelector = getDecimalPlacesSelector();
    userEvent.tab();
    userEvent.tab();
    expect(decimalPlacesSelector).toHaveFocus();

    userEvent.clear(decimalPlacesSelector);
    userEvent.keyboard('3');
    screen.getByRole('option', {
      name: '3',
    });
    userEvent.keyboard('{arrowup}{enter}');

    expect(onChange).toHaveBeenCalledWith({
      kind: 'Percent',
      decimalPlaces: 3,
    });
  });

  it('can change abbreviate by clicking', () => {
    const onChange = jest.fn();
    renderUnitSelector({ kind: 'Decimal', decimalPlaces: 3, abbreviate: true }, onChange);

    userEvent.click(getAbbreviateSwitch());

    expect(onChange).toHaveBeenCalledWith({
      kind: 'Decimal',
      decimalPlaces: 3,
      abbreviate: false,
    });
  });

  it('can change abbreviate using a keyboard', () => {
    const onChange = jest.fn();
    renderUnitSelector({ kind: 'Decimal', decimalPlaces: 0 }, onChange);

    userEvent.tab();
    userEvent.keyboard('{space}');

    expect(onChange).toHaveBeenCalledWith({
      kind: 'Decimal',
      decimalPlaces: 0,
      abbreviate: false,
    });
  });

  describe('with a time unit selected', () => {
    it('does not allow the user to set abbreviate', () => {
      renderUnitSelector({ kind: 'Minutes' });
      expect(getAbbreviateSwitch()).toBeDisabled();
    });
  });

  describe('with a percent unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderUnitSelector({ kind: 'Percent' });
      expect(getDecimalPlacesSelector()).toBeEnabled();
    });

    it('does not allow the user to set abbreviate', () => {
      renderUnitSelector({ kind: 'PercentDecimal' });
      expect(getAbbreviateSwitch()).toBeDisabled();
    });
  });

  describe('with a decimal unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderUnitSelector({ kind: 'Decimal' });
      expect(getDecimalPlacesSelector()).toBeEnabled();
    });

    it('allows the user to set abbreviate', () => {
      renderUnitSelector({ kind: 'Decimal' });
      expect(getAbbreviateSwitch()).toBeEnabled();
    });
  });

  describe('with a bytes unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderUnitSelector({ kind: 'Bytes' });
      expect(getDecimalPlacesSelector()).toBeEnabled();
    });

    it('allows the user to set abbreviate', () => {
      renderUnitSelector({ kind: 'Bytes' });
      expect(getAbbreviateSwitch()).toBeEnabled();
    });
  });

  it('should not show an option for disabled units', () => {
    const onChange = jest.fn();
    renderUnitSelector({ kind: 'Decimal' }, onChange);

    userEvent.click(getUnitSelector());
    const percentShorthandOption = screen.queryByRole('option', {
      name: '%',
    });
    expect(percentShorthandOption).not.toBeInTheDocument();
  });
});
