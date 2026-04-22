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

import { Action, Scope } from '@perses-dev/core';

export interface IFlatPermission {
  key: string;
  permissions: Array<{
    actions: Action[];
    scopes: Scope[];
  }>;
}

/**
 * Normalizes flat permissions by removing redundant actions and scopes.
 * It ensures that permissions are represented in a way that avoids duplication
 * @param flatPermissions
 * @returns
 */
export const normalizePermissions = (flatPermissions: IFlatPermission[]): IFlatPermission[] => {
  /* 
    Avoid mutate the original array and return a cloned version 
    There might be a feature to toggle views of Raw and normalized data
  */
  const clonedFlatPermissions: IFlatPermission[] = JSON.parse(JSON.stringify(flatPermissions));

  const redundantActions: Set<string> = new Set();
  const redundantScopes: Set<string> = new Set();
  const fullGrantItems: Set<string> = new Set();

  /* Avoid mutate the original array and return a cloned version */
  clonedFlatPermissions.forEach((item) => {
    item.permissions.forEach((p, pIndex) => {
      /* This is a full grant permission which overrides everything else */
      if (fullGrantItems.has(item.key) || (p.actions.includes('*') && p.scopes.includes('*'))) {
        if (!fullGrantItems.has(item.key)) {
          fullGrantItems.add(`${item.key}`);
        }
      } else {
        /* 
        This block finds redundant actions 
        Redundant actions should not be rendered for individual scopes
        Because they are already covered by the '*' scope
        Example: {actions:['read'], scopes:['*']},{actions:['delete','read'], scopes:['project']}
        read->project should NOT bre rendered. delete->project still should be rendered
        */
        if (p.scopes.includes('*')) {
          p.actions.forEach((a) => {
            redundantActions.add(`${item.key}-${pIndex}-${a}`);
          });
        }

        /*
        This block finds redundant scopes
        Redundant scopes should not be rendered for individual actions
        Because they are already covered by the '*' action
        Example: {actions:['*'], scopes:['project']},{actions:['read'], scopes:['dashboard','project']}
        read->project should NOT be rendered. read->dashboard should be rendered
        */
        if (p.actions.includes('*')) {
          p.scopes.forEach((s) => {
            redundantScopes.add(`${item.key}-${pIndex}-${s}`);
          });
        }
      }
    });
  });

  /*
    The found redundant actions should be removed    
  */
  redundantActions.forEach((ra) => {
    const [key, permissionIndex, extraAction] = ra.split('-');
    clonedFlatPermissions
      .find((pf) => pf.key === key)
      ?.permissions?.forEach((p, pIndex) => {
        if (pIndex !== Number(permissionIndex)) {
          p.actions = p.actions.filter((action) => action !== extraAction);
        }
      });
  });

  /*
    The found redundant scopes should be removed    
  */
  redundantScopes.forEach((rs) => {
    const [key, permissionIndex, extraScope] = rs.split('-');
    clonedFlatPermissions
      .find((pf) => pf.key === key)
      ?.permissions?.forEach((p, pIndex) => {
        if (pIndex !== Number(permissionIndex)) {
          p.scopes = p.scopes.filter((scope) => scope !== extraScope);
        }
      });
  });

  /*
    Finally full grant permission should override everything and add one single record *,*
  */

  fullGrantItems.forEach((itemKey) => {
    const clonedFlatPermission = clonedFlatPermissions.find((cfp) => cfp.key === itemKey);
    if (clonedFlatPermission) {
      clonedFlatPermission.permissions = [{ scopes: ['*'], actions: ['*'] }];
    }
  });

  return clonedFlatPermissions;
};
