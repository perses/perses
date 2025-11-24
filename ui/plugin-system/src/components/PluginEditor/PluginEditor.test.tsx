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
import { screen, waitFor } from '@testing-library/react';
import { ReactElement, useState } from 'react';
import { renderWithContext } from '../../test';
import { DefaultPluginKinds, PluginType } from '../../model';
import { PluginEditor } from './PluginEditor';
import { PluginEditorProps } from './plugin-editor-api';

type RenderComponentOptions = {
  pluginTypes?: PluginEditorProps['pluginTypes'];
  defaultPluginKinds?: DefaultPluginKinds;
  value?: PluginEditorProps['value'];
};

describe('PluginEditor', () => {
  const renderComponent: ({ pluginTypes, defaultPluginKinds, value }?: RenderComponentOptions) => {
    onChange: jest.Mocked<PluginEditorProps['onChange']>;
  } = ({ pluginTypes = ['Variable'], defaultPluginKinds, value }: RenderComponentOptions = {}) => {
    const testValue: PluginEditorProps['value'] = value || {
      selection: {
        type: 'Variable',
        kind: 'ErnieVariable1',
      },
      spec: { variableOption: 'Option1Value' },
    };

    // A test helper component that includes the state that's controlled from outside
    let onChange: jest.Mocked<PluginEditorProps['onChange']> = jest.fn();
    function TestHelperForm(): ReactElement {
      const [value, setValue] = useState(testValue);
      onChange = jest.fn((v) => setValue(v));

      return (
        <PluginEditor pluginTypes={pluginTypes} pluginKindLabel="Variable Type" value={value} onChange={onChange} />
      );
    }

    renderWithContext(<TestHelperForm />, undefined, { defaultPluginKinds });
    return { onChange };
  };

  // Opens the PluginKindSelect and waits for loading to finish (i.e. options to appear)
  const openPluginKind: () => Promise<HTMLElement[]> = async () => {
    const select = screen.getByLabelText('Variable Type');
    userEvent.click(select);
    const options = await screen.findAllByTestId('option');
    return options;
  };

  it('shows plugin kind and spec editor', async () => {
    renderComponent();

    const pluginKind = screen.getByLabelText('Variable Type');
    await waitFor(() => expect(pluginKind).toHaveTextContent('Ernie Variable'));
    const specEditor = await screen.findByLabelText('ErnieVariable editor');
    expect(specEditor).toHaveValue('Option1Value');
  });

  it('initializes kind and spec together', async () => {
    const { onChange } = renderComponent();

    // Switch to a new plugin kind
    await openPluginKind();
    const newPluginKind = screen.getByRole('option', { name: 'Ernie Variable 2' });
    userEvent.click(newPluginKind);

    // Wait for the editor of the other plugin
    const newEditor = await screen.findByLabelText('ErnieVariable2 editor');
    expect(newEditor).toBeInTheDocument();
    expect(newEditor).toHaveValue('');

    // Make sure onChange was only called once (i.e. initializes both kind and spec at the same time
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      selection: { type: 'Variable', kind: 'ErnieVariable2' },
      spec: { variableOption2: '' },
    });
  });

  it('remembers previous spec values', async () => {
    renderComponent();

    // Use the current editor to make a change to the spec value
    let editor = await screen.findByLabelText('ErnieVariable editor');
    userEvent.clear(editor);
    userEvent.type(editor, 'MyNewValue');

    // Switch to a new plugin kind
    await openPluginKind();
    const newPluginKind = screen.getByRole('option', { name: 'Ernie Variable 2' });
    userEvent.click(newPluginKind);

    // Wait for the other editor to appear, then switch back
    const newEditor = await screen.findByLabelText('ErnieVariable2 editor');
    expect(newEditor).toHaveValue('');
    await openPluginKind();
    const oldPluginKind = screen.getByRole('option', { name: 'Ernie Variable 1' });
    userEvent.click(oldPluginKind);

    // Make sure the editor from the first plugin appears and has our modified value from before the switch
    editor = await screen.findByLabelText('ErnieVariable editor');
    expect(editor).toHaveValue('MyNewValue');
  });

  describe('when defaultPluginKinds specified in plugin registry', () => {
    it('uses default kind when one is not provided', async () => {
      renderComponent({
        pluginTypes: ['Variable'],
        defaultPluginKinds: {
          TimeSeriesQuery: 'PrometheusTimeSeriesQuery',
          Variable: 'ErnieVariable1',
        },
        value: { selection: { type: 'Variable', kind: '' }, spec: {} },
      });

      // Wait for default panel kind to load.
      const pluginKind = screen.getByLabelText('Variable Type');
      await waitFor(() => expect(pluginKind).toHaveTextContent('Ernie Variable 1'));
    });

    it('does not use default when kind is provided', async () => {
      renderComponent({
        pluginTypes: ['Variable'],
        defaultPluginKinds: { Variable: 'ErnieVariable1', TimeSeriesQuery: 'PrometheusTimeSeriesQuery' },
        value: { selection: { type: 'Variable', kind: 'ErnieVariable2' }, spec: {} },
      });

      // Wait for specified panel kind to load.
      const pluginKind = screen.getByLabelText('Variable Type');
      await waitFor(() => expect(pluginKind).toHaveTextContent('Ernie Variable 2'));
    });
  });

  describe('Run Query Button', () => {
    describe('When withRunQueryButton is true', () => {
      ['TimeSeriesQuery', 'TraceQuery', 'ProfileQuery'].forEach((type) => {
        it(`should render the run query button for ${type}`, () => {
          const onChangeHandler = jest.fn();
          renderWithContext(
            <PluginEditor
              pluginTypes={[type] as unknown as PluginEditorProps['pluginTypes']}
              pluginKindLabel="Variable Type"
              withRunQueryButton
              value={{ selection: { type: type as PluginType, kind: '' }, spec: {} }}
              onChange={onChangeHandler}
            />
          );
          const queryButton = screen.getByTestId('run_query_button');
          expect(queryButton).toBeInTheDocument();
          userEvent.click(queryButton);
          expect(onChangeHandler).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
