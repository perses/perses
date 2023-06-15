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
import { LegendSpecOptions } from '../../model';
import { LegendOptionsEditor } from './LegendOptionsEditor';

describe('LegendOptionsEditor', () => {
  const renderLegendOptionsEditor = (value?: LegendSpecOptions, onChange = jest.fn()) => {
    render(
      <div>
        <LegendOptionsEditor value={value} onChange={onChange} />
      </div>
    );
  };

  const getLegendShowSwitch = () => {
    return screen.getByRole('checkbox', { name: 'Show' });
  };

  const getLegendPositionSelector = () => {
    return screen.getByRole('combobox', { name: 'Position' });
  };

  const getLegendModeSelector = () => {
    return screen.getByRole('combobox', { name: 'Mode' });
  };

  const getLegendValuesSelector = () => {
    return screen.getByRole('combobox', { name: 'Values' });
  };

  it('can change legend visibility by clicking', () => {
    const onChange = jest.fn();
    renderLegendOptionsEditor(undefined, onChange);
    expect(getLegendPositionSelector()).toBeDisabled();
    userEvent.click(getLegendShowSwitch());
    expect(onChange).toHaveBeenCalledWith({ position: 'Bottom' });
  });

  it('should allow changing legend position', () => {
    const onChange = jest.fn();
    renderLegendOptionsEditor({ position: 'Bottom' }, onChange);
    expect(getLegendPositionSelector()).toBeEnabled();
    userEvent.click(getLegendPositionSelector());
    const positionRightOption = screen.getByRole('option', {
      name: 'Right',
    });
    userEvent.click(positionRightOption);
    expect(onChange).toHaveBeenCalledWith({ position: 'Right' });
  });

  it('should allow changing legend mode', () => {
    const onChange = jest.fn();
    renderLegendOptionsEditor({ position: 'Bottom', mode: 'List' }, onChange);
    expect(getLegendModeSelector()).toBeEnabled();
    userEvent.click(getLegendModeSelector());
    const tableModeOption = screen.getByRole('option', {
      name: 'Table',
    });
    userEvent.click(tableModeOption);
    expect(onChange).toHaveBeenCalledWith({ position: 'Bottom', mode: 'Table' });
  });

  it('should allow setting a legend value', () => {
    const onChange = jest.fn();
    renderLegendOptionsEditor({ position: 'Bottom', mode: 'Table' }, onChange);
    expect(getLegendValuesSelector()).toBeEnabled();
    userEvent.click(getLegendValuesSelector());
    const totalValueOption = screen.getByRole('option', {
      name: /Sum/,
    });
    userEvent.click(totalValueOption);
    expect(onChange).toHaveBeenCalledWith({ position: 'Bottom', mode: 'Table', values: ['Sum'] });
  });

  it('should allow adding a legend value', () => {
    const onChange = jest.fn();
    renderLegendOptionsEditor({ position: 'Bottom', mode: 'Table', values: ['Sum'] }, onChange);
    expect(getLegendValuesSelector()).toBeEnabled();
    userEvent.click(getLegendValuesSelector());
    const minValueOption = screen.getByRole('option', {
      name: /Min/,
    });
    userEvent.click(minValueOption);
    expect(onChange).toHaveBeenCalledWith({ position: 'Bottom', mode: 'Table', values: ['Sum', 'Min'] });
  });

  it('should allow removing a legend value', () => {
    const onChange = jest.fn();
    renderLegendOptionsEditor({ position: 'Bottom', mode: 'Table', values: ['Sum', 'Min'] }, onChange);
    expect(getLegendValuesSelector()).toBeEnabled();
    userEvent.click(getLegendValuesSelector());
    const totalValueOption = screen.getByRole('option', {
      name: /Sum/,
    });
    userEvent.click(totalValueOption);
    expect(onChange).toHaveBeenCalledWith({ position: 'Bottom', mode: 'Table', values: ['Min'] });
  });

  describe('when legend mode is "list"', () => {
    test('legend values should be disabled', () => {
      const onChange = jest.fn();
      renderLegendOptionsEditor({ position: 'Bottom', mode: 'List' }, onChange);
      expect(getLegendValuesSelector()).toBeDisabled();
    });
  });

  describe('when legend mode is "list"', () => {
    test('legend values should be enabled', () => {
      const onChange = jest.fn();
      renderLegendOptionsEditor({ position: 'Bottom', mode: 'Table' }, onChange);
      expect(getLegendValuesSelector()).toBeEnabled();
    });
  });
});
