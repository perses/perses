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

import { IconButton, IconButtonProps, Tooltip } from '@mui/material';
import { ReactElement } from 'react';
import { CRUDAction, CRUDActionProps } from './CRUDAction';

export interface CRUDIconButtonProps extends Omit<IconButtonProps, 'action'>, Omit<CRUDActionProps, 'render'> {
  label: string;
}

/**
 * Wraps MUI IconButton with optional permission checks. Shows a Tooltip (from `label`) when enabled;
 * omits it when disabled due to insufficient permissions.
 */
export function CRUDIconButton({
  children,
  action,
  scope,
  project,
  color,
  onClick,
  disabled,
  label,
  ...props
}: CRUDIconButtonProps): ReactElement {
  return (
    <CRUDAction
      action={action}
      scope={scope}
      project={project}
      render={(actionDisabled) => {
        return actionDisabled ? (
          <IconButton color={color} size="small" sx={{ padding: 0 }} onClick={onClick} disabled {...props}>
            {children}
          </IconButton>
        ) : (
          <Tooltip title={label} placement="top">
            <span>
              <IconButton
                color={color}
                size="small"
                sx={{ padding: 0 }}
                onClick={onClick}
                disabled={disabled}
                {...props}
              >
                {children}
              </IconButton>
            </span>
          </Tooltip>
        );
      }}
    />
  );
}
