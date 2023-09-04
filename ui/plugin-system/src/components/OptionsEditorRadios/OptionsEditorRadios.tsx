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

import { FormControl, FormControlLabel, Radio, RadioGroup, RadioGroupProps, Box } from '@mui/material';
import { ReactNode, useState } from 'react';
import { OptionsEditorTabPanel } from '../OptionsEditorTabPanel';

export type OptionsEditorRadio = {
  label: string;
  /**
   * Content rendered when the tab is active.
   */
  content: ReactNode;
};

export type OptionsEditorRadiosProps = {
  tabs: OptionsEditorRadio[];
  defaultTab: number;
  onModeChange: (value: number) => void;
  isReadonly?: boolean;
};

export const OptionsEditorRadios = (props: OptionsEditorRadiosProps) => {
  const { tabs, defaultTab, onModeChange, isReadonly } = props;
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleChange: RadioGroupProps['onChange'] = (_, value) => {
    const v = parseInt(value);
    setActiveTab(v);
    onModeChange(v);
  };

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: (theme) => theme.palette.divider }}>
        <FormControl>
          <RadioGroup
            row
            defaultValue={defaultTab}
            value={activeTab}
            onChange={handleChange}
            aria-labelledby="Configuration radio"
          >
            {tabs.map(({ label }, i) => {
              return <FormControlLabel disabled={isReadonly} key={label} value={i} control={<Radio />} label={label} />;
            })}
          </RadioGroup>
        </FormControl>
      </Box>
      {tabs.map(({ label, content }, i) => {
        return (
          <OptionsEditorTabPanel key={label} value={activeTab} index={i}>
            {content}
          </OptionsEditorTabPanel>
        );
      })}
    </>
  );
};
