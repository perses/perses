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

import { screen } from '@testing-library/react';
import { FormatOptions } from '@perses-dev/core';
import { setupUserEventAndRender } from '@perses-dev/components';
import { FormatControls } from './FormatControls';

describe('FormatControls', () => {
  const renderFormatControls = (value: FormatOptions, onChange = jest.fn()) => {
    return setupUserEventAndRender(
      <div>
        <FormatControls value={value} onChange={onChange} />
      </div>
    );
  };

  const getUnitSelector = () => {
    return screen.getByRole('combobox', { name: 'Unit' });
  };

  const getDecimalPlacesSelector = () => {
    return screen.getByRole('combobox', { name: 'Decimals' });
  };

  const getShortValuesSwitch = () => {
    return screen.getByRole('checkbox', { name: 'Short values' });
  };

  it('can change the unit by clicking', () => {
    const onChange = jest.fn();
    const { user } = renderFormatControls({ unit: 'minutes' }, onChange);

    const unitSelector = getUnitSelector();
    user.click(unitSelector);
    const decimalOption = screen.getByRole('combobox', {
      name: 'Decimals',
    });
    user.click(decimalOption);

    expect(onChange).toHaveBeenCalledWith({
      unit: 'decimals',
    });
  });

  it('can change the unit using a keyboard', () => {
    const onChange = jest.fn();
    const { user } = renderFormatControls({ unit: 'bytes' }, onChange);

    const unitSelector = getUnitSelector();
    user.tab();
    user.tab();
    expect(unitSelector).toHaveFocus();

    user.clear(unitSelector);
    user.keyboard('years');
    screen.getByRole('option', {
      name: 'Years',
    });

    user.keyboard('{arrowup}{enter}');

    expect(onChange).toHaveBeenCalledWith({
      unit: 'years',
    });
  });

  it('can change the decimal places by clicking', () => {
    const onChange = jest.fn();
    const { user } = renderFormatControls({ unit: 'decimal', decimalPlaces: 0, shortValues: true }, onChange);

    user.click(getDecimalPlacesSelector());
    const decimalPlacesOption = screen.getByRole('option', {
      name: 'Default',
    });
    user.click(decimalPlacesOption);

    expect(onChange).toHaveBeenCalledWith({
      unit: 'decimal',
      decimalPlaces: undefined,
      shortValues: true,
    });
  });

  it('can change the decimal places using a keyboard', () => {
    const onChange = jest.fn();
    const { user } = renderFormatControls({ unit: 'percent' }, onChange);

    const decimalPlacesSelector = getDecimalPlacesSelector();
    user.tab();
    user.tab();
    expect(decimalPlacesSelector).toHaveFocus();

    user.clear(decimalPlacesSelector);
    user.keyboard('3');
    screen.getByRole('option', {
      name: '3',
    });
    user.keyboard('{arrowup}{enter}');

    expect(onChange).toHaveBeenCalledWith({
      unit: 'percent',
      decimalPlaces: 3,
    });
  });

  it('can change shortValues by clicking', () => {
    const onChange = jest.fn();
    const { user } = renderFormatControls({ unit: 'decimal', decimalPlaces: 3, shortValues: true }, onChange);

    user.click(getShortValuesSwitch());

    expect(onChange).toHaveBeenCalledWith({
      unit: 'decimal',
      decimalPlaces: 3,
      shortValues: false,
    });
  });

  it('can change shortValues using a keyboard', () => {
    const onChange = jest.fn();
    const { user } = renderFormatControls({ unit: 'decimal', decimalPlaces: 0 }, onChange);

    user.tab();
    user.keyboard('{space}');

    expect(onChange).toHaveBeenCalledWith({
      unit: 'decimal',
      decimalPlaces: 0,
      shortValues: false,
    });
  });

  describe('with a time unit selected', () => {
    it('does not allow the user to set shortValues', () => {
      renderFormatControls({ unit: 'minutes' });
      expect(getShortValuesSwitch()).toBeDisabled();
    });
  });

  describe('with a percent unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderFormatControls({ unit: 'percent' });
      expect(getDecimalPlacesSelector()).toBeEnabled();
    });

    it('does not allow the user to set shortValues', () => {
      renderFormatControls({ unit: 'percent-decimal' });
      expect(getShortValuesSwitch()).toBeDisabled();
    });
  });

  describe('with a decimal unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderFormatControls({ unit: 'decimal' });
      expect(getDecimalPlacesSelector()).toBeEnabled();
    });

    it('allows the user to set shortValues', () => {
      renderFormatControls({ unit: 'decimal' });
      expect(getShortValuesSwitch()).toBeEnabled();
    });
  });

  describe('with a bytes unit selected', () => {
    it('allows the user to modify the decimal places', () => {
      renderFormatControls({ unit: 'bytes' });
      expect(getDecimalPlacesSelector()).toBeEnabled();
    });

    it('allows the user to set shortValues', () => {
      renderFormatControls({ unit: 'bytes' });
      expect(getShortValuesSwitch()).toBeEnabled();
    });
  });

  it('should not show an option for disabled units', () => {
    const onChange = jest.fn();
    const { user } = renderFormatControls({ unit: 'decimal' }, onChange);

    user.click(getUnitSelector());
    const percentShorthandOption = screen.queryByRole('option', {
      name: '%',
    });
    expect(percentShorthandOption).not.toBeInTheDocument();
  });
});
