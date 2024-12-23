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

import { Chip, ChipProps } from '@mui/material';
import { ReactElement } from 'react';

export function MetricChip({ label, ...props }: ChipProps): ReactElement {
  if (label === 'gauge') {
    return <Chip label={label} color="success" {...props} />;
  }
  if (label === 'counter') {
    return <Chip label={label} color="primary" {...props} />;
  }
  if (label === 'histogram') {
    return <Chip label={label} color="warning" {...props} />;
  }
  if (label === 'summary') {
    return <Chip label={label} color="secondary" {...props} />;
  }

  return <Chip label={label} sx={{ fontStyle: label === 'unknown' ? 'italic' : 'initial' }} {...props} />;
}
