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

import { act, fireEvent, render, screen } from '@testing-library/react';
import { RawFilterInput, RawFilterInputProps } from './FilterInputs';

describe('FilterInputs', () => {
  const renderInputs = ({
    value = { label: '', labelValues: [], operator: '=~' },
    labelOptions,
    labelValuesOptions,
    isLabelOptionsLoading,
    isLabelValuesOptionsLoading,
    onChange = () => {},
    onDelete = () => {},
  }: Partial<RawFilterInputProps>) => {
    render(
      <RawFilterInput
        value={value}
        labelOptions={labelOptions}
        labelValuesOptions={labelValuesOptions}
        isLabelOptionsLoading={isLabelOptionsLoading}
        isLabelValuesOptionsLoading={isLabelValuesOptionsLoading}
        onChange={onChange}
        onDelete={onDelete}
      />
    );
  };

  it('should set the label name with button confirmation', async () => {
    const onChange = jest.fn();
    renderInputs({ onChange });

    const input = screen.getByRole('combobox', { name: 'Label Name' });
    expect(input).toBeInTheDocument();
    act(() => {
      fireEvent.change(input, { target: { value: 'Test' } });
    });

    expect(onChange).not.toHaveBeenCalled();

    const validateLabelButton = screen.getByRole('button', { name: 'validate label name' });
    act(() => {
      fireEvent.click(validateLabelButton);
    });
    expect(onChange).toHaveBeenCalledWith({ label: 'Test', labelValues: [] });
  });

  it('should set the label name with key press Enter', async () => {
    const onChange = jest.fn();
    renderInputs({ onChange });

    const input = screen.getByRole('combobox', { name: 'Label Name' });
    expect(input).toBeInTheDocument();
    act(() => {
      fireEvent.change(input, { target: { value: 'Test' } });
    });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    });

    expect(onChange).toHaveBeenCalledWith({ label: 'Test', labelValues: [] });
  });

  it('should set the label values', async () => {
    const onChange = jest.fn();
    renderInputs({ value: { label: 'MySuperLabel', labelValues: ['test1'], operator: '=~' }, onChange });

    const input = screen.getByRole('combobox', { name: 'MySuperLabel' });
    expect(input).toBeInTheDocument();

    act(() => {
      fireEvent.change(input, { target: { value: 'test2' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    });

    expect(onChange).toHaveBeenCalledWith({ label: 'MySuperLabel', labelValues: ['test1', 'test2'] });
  });
});
