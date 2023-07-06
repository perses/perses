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

import { Checkbox, CheckboxProps, alpha } from '@mui/material';
import { TableDensity } from './model/table-model';

export interface TableCheckboxProps extends Pick<CheckboxProps, 'checked' | 'indeterminate' | 'onChange'> {
  color?: string;
  density: TableDensity;
}

export function TableCheckbox({ color, density, ...otherProps }: TableCheckboxProps) {
  const isCompact = density === 'compact';

  return (
    <Checkbox
      size={isCompact ? 'small' : 'medium'}
      {...otherProps}
      // Disable ripple and set background color below because of some issues
      // with re-rendering with the keyboard interactions that causes the ripple
      // animation to stutter.
      focusRipple={false}
      // Tab index is handled by the overall keyboard interactions for the table
      // to avoid trapping a keyboard user in a table by requiring them to tab
      // through every single checkbox.
      tabIndex={-1}
      sx={{
        color: color,

        padding: (theme) => theme.spacing(isCompact ? 0.25 : 0.5),

        // Centering.
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',

        '&.Mui-checked': {
          color: color,
        },

        '&.Mui-focusVisible': {
          background: color ? alpha(color, 0.5) : undefined,
        },

        '& .MuiSvgIcon-root': { fontSize: isCompact ? 16 : 18 },
      }}
    />
  );
}
