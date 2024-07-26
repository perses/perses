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
import { SortOption } from './SortSelector';

export interface SortSelectorButtonsProps extends Omit<ButtonGroupProps, 'onChange'> {
  value?: SortOption;
  onChange: (sort?: SortOption) => void;
}

export function SortSelectorButtons({ onChange, value, ...props }: SortSelectorButtonsProps) {
  const handleSortChange = (sort?: SortOption) => {
    onChange(sort);
  };

  return (
    <ButtonGroup aria-label="Sort" sx={{ margin: 1 }} {...props}>
      <Button onClick={() => handleSortChange(undefined)} variant={value === undefined ? 'contained' : 'outlined'}>
        None
      </Button>
      <Button onClick={() => handleSortChange('asc')} variant={value === 'asc' ? 'contained' : 'outlined'}>
        Ascending
      </Button>
      <Button onClick={() => handleSortChange('desc')} variant={value === 'desc' ? 'contained' : 'outlined'}>
        Descending
      </Button>
    </ButtonGroup>
  );
}
