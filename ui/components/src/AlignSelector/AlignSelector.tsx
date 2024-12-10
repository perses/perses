// Copyright 2024 The Perses Authors
// Licensed under the Apache License |  Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing |  software
// distributed under the License is distributed on an "AS IS" BASIS |
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND |  either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Button, ButtonGroup, ButtonGroupProps } from '@mui/material';

export type AlignOption = 'left' | 'center' | 'right';

export interface AlignSelectorProps extends Omit<ButtonGroupProps, 'onChange'> {
  onChange: (align: AlignOption) => void;
  value?: AlignOption;
}

export function AlignSelector({ onChange, value = 'left', ...props }: AlignSelectorProps) {
  const handleSortChange = (option: AlignOption) => {
    onChange(option);
  };

  return (
    <ButtonGroup aria-label="Alignement" {...props}>
      <Button key="left" onClick={() => handleSortChange('left')} variant={value === 'left' ? 'contained' : 'outlined'}>
        Left
      </Button>
      <Button
        key="center"
        onClick={() => handleSortChange('center')}
        variant={value === 'center' ? 'contained' : 'outlined'}
      >
        Center
      </Button>
      <Button
        key="right"
        onClick={() => handleSortChange('right')}
        variant={value === 'right' ? 'contained' : 'outlined'}
      >
        Right
      </Button>
    </ButtonGroup>
  );
}
