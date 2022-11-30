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
import { useState } from 'react';
import { renderWithContext } from '../../test';
import { PluginEditor } from './PluginEditor';
import { PluginEditorProps } from './plugin-editor-api';

type RenderComponentOptions = {
  pluginType?: PluginEditorProps['pluginType'];
  defaultPanelKind?: string;
  value?: PluginEditorProps['value'];
};

describe('PluginEditor', () => {
  const renderComponent = ({ pluginType = 'Panel', defaultPanelKind, value }: RenderComponentOptions = {}) => {
    const testValue: PluginEditorProps['value'] = value || { kind: 'BertPanel1', spec: { option1: 'Option1Value' } };

    // A test helper component that includes the state that's controlled from outside
    let onChange: jest.Mocked<PluginEditorProps['onChange']> = jest.fn();
    function TestHelperForm() {
      const [value, setValue] = useState(testValue);
      onChange = jest.fn((v) => setValue(v));

      return <PluginEditor pluginType={pluginType} pluginKindLabel="Panel Type" value={value} onChange={onChange} />;
    }

    renderWithContext(<TestHelperForm />, undefined, { defaultPanelKind: defaultPanelKind });
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

    // Wait for the editor of the other plugin
    const newEditor = await screen.findByLabelText('BertPanel2 editor');
    expect(newEditor).toBeInTheDocument();
    expect(newEditor).toHaveValue('');

    // Make sure onChange was only called once (i.e. initializes both kind and spec at the same time
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ kind: 'BertPanel2', spec: { option2: '' } });
  });

  it('remembers previous spec values', async () => {
    renderComponent();

    // Use the current editor to make a change to the spec value
    let editor = await screen.findByLabelText('BertPanel1 editor');
    userEvent.clear(editor);
    userEvent.type(editor, 'MyNewValue');

    // Switch to a new plugin kind
    await openPluginKind();
    const newPluginKind = screen.getByRole('option', { name: 'Bert Panel 2' });
    userEvent.click(newPluginKind);

    // Wait for the other editor to appear, then switch back
    const newEditor = await screen.findByLabelText('BertPanel2 editor');
    expect(newEditor).toHaveValue('');
    await openPluginKind();
    const oldPluginKind = screen.getByRole('option', { name: 'Bert Panel 1' });
    userEvent.click(oldPluginKind);

    // Make sure the editor from the first plugin appears and has our modified value from before the switch
    editor = await screen.findByLabelText('BertPanel1 editor');
    expect(editor).toHaveValue('MyNewValue');
  });

  describe('when defaultPanelKind specified in plugin registry', () => {
    it('uses default kind when one is not provided', async () => {
      renderComponent({ pluginType: 'Panel', defaultPanelKind: 'BertPanel2', value: { kind: '', spec: {} } });

      // Wait for default panel kind to load.
      const pluginKind = screen.getByRole('button', { name: 'Panel Type' });
      await waitFor(() => expect(pluginKind).toHaveTextContent('Bert Panel 2'));
    });

    it('does not use default when kind is provided', async () => {
      renderComponent({ pluginType: 'Panel', defaultPanelKind: 'BertPanel2' });

      // Wait for specified panel kind to load.
      const pluginKind = screen.getByRole('button', { name: 'Panel Type' });
      await waitFor(() => expect(pluginKind).toHaveTextContent('Bert Panel 1'));
    });
  });
});
