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

import { screen, render, getAllByRole } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OptionsEditorTabs, OptionsEditorTabsProps } from './OptionsEditorTabs';

describe('OptionsEditorTabs', () => {
  const mockTabs: OptionsEditorTabsProps['tabs'] = [
    {
      label: 'Query',
      content: <div>Edit query configuration</div>,
    },
    {
      label: 'Settings',
      content: <div>Edit settings configuration</div>,
    },
    {
      label: 'JSON',
      content: <div>JSON editor</div>,
    },
  ];
  const renderTabs = (otherTabs?: OptionsEditorTabsProps['tabs']) => {
    const tabs = otherTabs ?? mockTabs;
    render(<OptionsEditorTabs tabs={tabs} />);
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

  it('renders tabs in correct order', () => {
    renderTabs();

    const tabList = screen.getByRole('tablist');
    const tabs = getAllByRole(tabList, 'tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent('Query');
    expect(tabs[1]).toHaveTextContent('Settings');
    expect(tabs[2]).toHaveTextContent('JSON');
  });
});
