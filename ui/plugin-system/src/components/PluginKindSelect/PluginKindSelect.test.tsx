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

import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithContext } from '../../test';
import { PluginKindSelect, PluginKindSelectProps } from './PluginKindSelect';

describe('PluginKindSelect', () => {
  const renderComponent = (props: PluginKindSelectProps) => {
    return renderWithContext(<PluginKindSelect {...props} />);
  };

  // Opens the select and waits for loading to finish (i.e. options to appear)
  const openSelect = async () => {
    const select = screen.getByRole('button');
    userEvent.click(select);
    const options = await screen.findAllByRole('option');
    return options;
  };

  it('displays the list of plugins for a plugin type', async () => {
    renderComponent({
      pluginType: 'Panel',
      value: '',
    });

    // Open the select and verify the list of options from the test plugin data
    const options = await openSelect();
    expect(options).toHaveLength(2);

    let option = screen.queryByRole('option', { name: 'Bert Panel 1' });
    expect(option).toBeInTheDocument();
    option = screen.queryByRole('option', { name: 'Bert Panel 2' });
    expect(option).toBeInTheDocument();
  });

  it('shows the correct selected value', async () => {
    renderComponent({
      pluginType: 'Variable',
      value: 'ErnieVariable1',
    });

    // Use findByRole to wait for loading to finish and selected value to appear
    const select = await screen.findByRole('button', { name: 'Ernie Variable 1' });
    expect(select).toBeInTheDocument();
  });

  it('can select new value', async () => {
    let onChangeValue: string | undefined = undefined;
    const onChange = jest.fn((e) => {
      onChangeValue = e.target.value;
    });
    renderComponent({
      pluginType: 'Variable',
      value: 'ErnieVariable1',
      onChange,
    });

    await openSelect();
    const newOption = screen.getByRole('option', { name: 'Bert Variable' });
    userEvent.click(newOption);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChangeValue).toBe('BertVariable');
  });
});
