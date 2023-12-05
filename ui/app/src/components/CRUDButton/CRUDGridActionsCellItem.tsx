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

import { Tooltip } from '@mui/material';
import { Action, Scope } from '@perses-dev/core';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { useIsReadonly } from '../../context/Config';
import { GlobalProject, useHasPermission } from '../../context/Authorization';

interface CRUDGridActionsCellItemProps {
  icon: JSX.Element;
  label: string;
  action?: Action;
  scope?: Scope;
  project?: string;
  onClick: () => void;
}

/*
 * CRUDGridActionsCellItem is an alias of MUI GridActionsCellItem, that will add a Tooltip with a reason if the button need to be disabled.
 * If action, scope and project are provided, it will check if the user has the permission to execute the action.
 */
export function CRUDGridActionsCellItem({
  icon,
  label,
  action,
  scope,
  project,
  onClick,
}: CRUDGridActionsCellItemProps) {
  const isReadonly = useIsReadonly();
  const hasPermission = useHasPermission(action ?? '*', project ?? GlobalProject, scope ?? '*');

  if (isReadonly) {
    return (
      <Tooltip title="Resource managed via code only" placement="top">
        <span>
          <GridActionsCellItem icon={icon} label={label} disabled />
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
          <GridActionsCellItem icon={icon} label={label} disabled />
        </span>
      </Tooltip>
    );
  }

  return <GridActionsCellItem icon={icon} label={label} onClick={onClick} />;
}
