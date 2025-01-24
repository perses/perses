// Copyright 2025 The Perses Authors
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

import { TextField } from '@mui/material';
import { OptionsEditorControl } from '@perses-dev/components';
import { FC } from 'react';

export interface MetricLabelInputProps {
  value?: string;
  onChange: (metricLabel?: string) => void;
}

export const MetricLabelInput: FC<MetricLabelInputProps> = ({ value, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = event.target.value;
    onChange(newValue || undefined);
  };

  return (
    <OptionsEditorControl
      label="Metric label"
      description="Specify label to display"
      control={<TextField fullWidth name="Metric label" value={value || ''} onChange={handleChange} />}
    />
  );
};
