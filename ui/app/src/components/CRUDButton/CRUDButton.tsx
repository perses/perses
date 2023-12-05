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

import { Button, ButtonProps, Tooltip } from '@mui/material';
import { Action, Scope } from '@perses-dev/core';
import { useIsReadonly } from '../../context/Config';
import { GlobalProject, useHasPermission } from '../../context/Authorization';

interface CRUDButtonProps extends Omit<ButtonProps, 'action'> {
  text: string;
  action?: Action;
  scope?: Scope;
  project?: string;
}

/*
 * CRUDButton is an alias of MUI Button, that will add a Tooltip with a reason if the button need to be disabled.
 * If action, scope and project are provided, it will check if the user has the permission to execute the action.
 */
export function CRUDButton(props: CRUDButtonProps) {
  const { text, action, scope, project, variant, color, disabled, onClick } = props;
  const isReadonly = useIsReadonly();
  const hasPermission = useHasPermission(action ?? '*', project ?? GlobalProject, scope ?? '*');

  if (isReadonly) {
    return (
      <Tooltip title="Resource managed via code only" placement="top">
        <span>
          <Button
            variant={variant}
            color={color}
            size="small"
            sx={{ textTransform: 'uppercase' }}
            onClick={onClick}
            disabled
          >
            {text}
          </Button>
        </span>
      </Tooltip>
    );
  }

  if (!hasPermission && action && scope && project) {
    const errorMessage =
      project === GlobalProject
        ? `Missing '${action}' global permission for '${scope}' kind`
        : `Missing '${action}' permission in '${project}' project for '${scope}' kind`;

    return (
      <Tooltip title={errorMessage} placement="top">
        <span>
          <Button
            variant={variant}
            color={color}
            size="small"
            sx={{ textTransform: 'uppercase' }}
            onClick={onClick}
            disabled
          >
            {text}
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Button
      variant={variant}
      color={color}
      size="small"
      sx={{ textTransform: 'uppercase' }}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </Button>
  );
}
