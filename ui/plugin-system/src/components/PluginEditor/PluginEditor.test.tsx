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

import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { renderWithContext } from '../../test';
import { PluginEditor } from './PluginEditor';
import { PluginEditorProps } from './plugin-editor-api';

describe('PluginEditor', () => {
  const renderComponent = () => {
    const onChange: jest.Mocked<PluginEditorProps['onChange']> = jest.fn();
    renderWithContext(
      <PluginEditor
        pluginType="Panel"
        pluginKindLabel="Panel Type"
        value={{ kind: 'BertPanel1', spec: { option1: 'Option1Value' } }}
        onChange={onChange}
      />
    );
    return { onChange };
  };

  // Opens the PluginKindSelect and waits for loading to finish (i.e. options to appear)
  const openPluginKind = async () => {
    const select = screen.getByRole('button', { name: 'Panel Type' });
    userEvent.click(select);
    const options = await screen.findAllByRole('option');
    return options;
  };

  it('shows plugin kind and spec editor', async () => {
    renderComponent();

    const pluginKind = screen.getByRole('button', { name: 'Panel Type' });
    await waitFor(() => expect(pluginKind).toHaveTextContent('Bert Panel 1'));
    const specEditor = await screen.findByLabelText('BertPanel1 editor');
    expect(specEditor).toHaveValue('Option1Value');
  });

  it('initializes kind and spec together', async () => {
    const { onChange } = renderComponent();

    // Switch to a new plugin kind
    await openPluginKind();
    const newPluginKind = screen.getByRole('option', { name: 'Bert Panel 2' });
    userEvent.click(newPluginKind);

    // Make sure onChange was only called once (i.e. initializes both kind and spec at the same time)
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
    });
    expect(onChange).toHaveBeenCalledWith({ kind: 'BertPanel2', spec: { option2: '' } });
  });
});
