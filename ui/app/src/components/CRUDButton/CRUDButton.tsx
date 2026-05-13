// Copyright The Perses Authors
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

import { Button, ButtonProps } from '@mui/material';
import { ReactElement } from 'react';
import { useIsMobileSize } from '../../utils/browser-size';
import { CRUDAction, CRUDActionProps } from './CRUDAction';

export interface CRUDButtonProps extends Omit<ButtonProps, 'action'>, Omit<CRUDActionProps, 'render'> {}

/**
 * CRUDButton is an alias of MUI Button, that will add a Tooltip with a reason if the button need to be disabled.
 * If action, scope and project are provided, it will check if the user has the permission to execute the action.
 */
export function CRUDButton({
  children,
  action,
  scope,
  project,
  variant,
  color,
  disabled,
  onClick,
  ...props
}: CRUDButtonProps): ReactElement {
  const isMobileSize = useIsMobileSize();

  return (
    <CRUDAction
      action={action}
      scope={scope}
      project={project}
      render={(actionDisabled) => (
        <Button
          variant={variant}
          color={color}
          size="small"
          sx={{ textTransform: 'uppercase', paddingX: isMobileSize ? 1 : undefined }}
          onClick={onClick}
          disabled={actionDisabled || disabled}
          {...props}
        >
          {children}
        </Button>
      )}
    />
  );
}
