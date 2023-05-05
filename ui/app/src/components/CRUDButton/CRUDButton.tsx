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

import { Button, Tooltip } from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { ButtonPropsColorOverrides, ButtonPropsVariantOverrides } from '@mui/material/Button/Button';
import { useIsReadonly } from '../../model/config-client';

interface CRUDButtonProps {
  text: string;
  variant?: OverridableStringUnion<'text' | 'outlined' | 'contained', ButtonPropsVariantOverrides>;
  color?: OverridableStringUnion<
    'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
    ButtonPropsColorOverrides
  >;
  disabled?: boolean;
  onClick: () => void;
}

export function CRUDButton(props: CRUDButtonProps) {
  const { text, variant, color, disabled, onClick } = props;
  const isReadonly = useIsReadonly();

  return (
    <Tooltip title="Resource managed via code only" placement="top">
      <span>
        <Button
          variant={variant}
          color={color}
          size="small"
          sx={{ textTransform: 'uppercase' }}
          onClick={onClick}
          disabled={disabled || isReadonly}
        >
          {text}
        </Button>
      </span>
    </Tooltip>
  );
}
