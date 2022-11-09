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

import { Tab, TabProps, Tabs, TabsProps, Box } from '@mui/material';
import { useState } from 'react';
import { TabPanel } from './TabPanel';

interface BaseTabConfig {
  /**
   * Content rendered when the tab is active.
   */
  content: React.ReactNode;
}

interface OtherTabConfig extends BaseTabConfig {
  id: string;
  label: TabProps['label'];
}

type CommonTabId = 'query' | 'settings' | 'json';

/**
 * Common tabs that are frequently used in the options editor across multiple
 * plugins. The label and display order of these tabs is not configurable to
 * avoid user experience inconsistencies across plugins.
 */
type CommonTabs = { [property in CommonTabId]?: BaseTabConfig };

/**
 * Custom tabs specified for a given plugin. They are displayed after common
 * tabs.
 */
type OtherTabs = {
  other?: OtherTabConfig[];
};

export type OptionsEditorTabsProps = {
  tabs: CommonTabs & OtherTabs;
};

// Configuration of the order and labeling for tabs across plugins to enforce a
// consistent UX.
const TAB_CONFIG = [
  { id: 'query', label: 'Query' },
  { id: 'settings', label: 'Settings' },

  // Custom tabs go between the visual common tabs and the raw JSON editor.
  'other',

  { id: 'json', label: 'JSON' },
] as const;

export const OptionsEditorTabs = ({ tabs }: OptionsEditorTabsProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleChange: TabsProps['onChange'] = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Normalize the common tabs that are managed via constants in this file
  // and custom tabs that bring their own config into a consistent shape for
  // rendering.
  const normalizedTabs = TAB_CONFIG.reduce((combinedTabs, tabConfig) => {
    // Custom tabs
    if (tabConfig === 'other') {
      const otherTabs = tabs?.other || [];
      return [...combinedTabs, ...otherTabs];
    }

    // Common tabs
    const commonTab = tabs[tabConfig.id];
    if (commonTab) {
      return [
        ...combinedTabs,
        {
          ...tabConfig,
          ...commonTab,
        },
      ];
    }

    return combinedTabs;
  }, [] as OtherTabConfig[]);

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'grey.300' }}>
        <Tabs value={activeTab} onChange={handleChange} aria-label="Panel configuration tabs">
          {normalizedTabs.map(({ id, label }, i) => {
            return (
              <Tab
                key={id}
                label={label}
                id={`options-editor-tab-${i}`}
                aria-controls={`options-editor-tabpanel-${i}`}
              />
            );
          })}
        </Tabs>
      </Box>
      {normalizedTabs.map(({ id, content }, i) => {
        return (
          <TabPanel key={id} value={activeTab} index={i}>
            {content}
          </TabPanel>
        );
      })}
    </>
  );
};
