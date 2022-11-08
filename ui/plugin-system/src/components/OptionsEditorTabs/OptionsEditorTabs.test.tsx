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

import { screen, render, getAllByRole } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OptionsEditorTabs, OptionsEditorTabsProps } from './OptionsEditorTabs';

describe('OptionsEditorTabs', () => {
  const renderTabs = (otherTabs?: OptionsEditorTabsProps['tabs']['other']) => {
    render(
      <OptionsEditorTabs
        tabs={{
          query: {
            content: <div>Edit query configuration</div>,
          },
          settings: {
            content: <div>Edit settings configuration</div>,
          },
          json: {
            content: <div>JSON editor</div>,
          },
          other: otherTabs,
        }}
      />
    );
  };

  const renderCustomTabs = () => {
    renderTabs([
      {
        id: 'tableCols',
        label: 'Table columns',
        content: <div>custom table column</div>,
      },
      {
        id: 'tableOpts',
        label: 'Table options',
        content: <div>custom table options</div>,
      },
    ]);
  };

  it('renders all specified tabs in a tab list', () => {
    renderTabs();

    const tabList = screen.getByRole('tablist');
    const tabs = getAllByRole(tabList, 'tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent('Query');
    expect(tabs[1]).toHaveTextContent('Settings');
    expect(tabs[2]).toHaveTextContent('JSON');
  });

  it('defaults to selecting the first tab', () => {
    renderTabs();

    const activeTab = screen.getByRole('tab', {
      selected: true,
    });
    expect(activeTab).toHaveTextContent('Query');

    const activeTabPanel = screen.getByRole('tabpanel');
    expect(activeTabPanel).toHaveTextContent('query configuration');
  });

  it('switches selected tab on click', () => {
    renderTabs();
    const jsonTab = screen.getByRole('tab', { name: 'JSON' });
    userEvent.click(jsonTab);

    const activeTab = screen.getByRole('tab', {
      selected: true,
    });
    expect(activeTab).toBe(jsonTab);

    const activeTabPanel = screen.getByRole('tabpanel');
    expect(activeTabPanel).toHaveTextContent('JSON editor');
  });

  it('switches selected tab on keyboard interactions', () => {
    renderTabs();
    const vizTab = screen.getByRole('tab', { name: 'Settings' });
    userEvent.tab();
    userEvent.keyboard('{arrowright}{space}');

    const activeTab = screen.getByRole('tab', {
      selected: true,
    });
    expect(activeTab).toBe(vizTab);

    const activeTabPanel = screen.getByRole('tabpanel');
    expect(activeTabPanel).toHaveTextContent('settings configuration');
  });

  it('renders custom tabs between visual tabs and json editor', () => {
    renderCustomTabs();

    const tabList = screen.getByRole('tablist');
    const tabs = getAllByRole(tabList, 'tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveTextContent('Query');
    expect(tabs[1]).toHaveTextContent('Settings');
    expect(tabs[2]).toHaveTextContent('Table column');
    expect(tabs[3]).toHaveTextContent('Table options');
    expect(tabs[4]).toHaveTextContent('JSON');
  });

  it('shows the correct content when selecting a custom tab', () => {
    renderCustomTabs();

    const tableColTab = screen.getByRole('tab', { name: 'Table columns' });
    userEvent.click(tableColTab);

    const activeTab = screen.getByRole('tab', {
      selected: true,
    });
    expect(activeTab).toBe(tableColTab);

    const activeTabPanel = screen.getByRole('tabpanel');
    expect(activeTabPanel).toHaveTextContent('custom table column');
  });

  it('only renders common tabs that are specified', () => {
    render(
      <OptionsEditorTabs
        tabs={{
          settings: {
            content: <div>settings are alone</div>,
          },
          json: {
            content: <div>JSON is at the end</div>,
          },
          other: [
            {
              id: 'custom',
              label: 'Another tab',
              content: <div>another tab content</div>,
            },
          ],
        }}
      />
    );
    const tabList = screen.getByRole('tablist');
    const tabs = getAllByRole(tabList, 'tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent('Settings');
    expect(tabs[1]).toHaveTextContent('Another tab');
    expect(tabs[2]).toHaveTextContent('JSON');
  });
});
