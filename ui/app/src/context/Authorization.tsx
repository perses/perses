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

import React, { createContext, ReactElement, ReactNode, useContext, useMemo } from 'react';
import { Action, Permission, ProjectResource, Scope } from '@perses-dev/core';
import { useAuthToken } from '../model/auth-client';
import { useUserPermissions } from '../model/user-client';
import { useProjectList } from '../model/project-client';
import { enableRefreshFetch } from '../model/fetch';
import { useIsAuthEnabled } from './Config';

// Used as placeholder for checking Global permissions
export const GlobalProject = '*';

interface AuthorizationContext {
  enabled: boolean;
  username: string;
  userPermissions: Record<string, Permission[]>;
}

const AuthorizationContext = createContext<AuthorizationContext | undefined>(undefined);

// Provide RBAC helpers for checking current user permissions
export function AuthorizationProvider(props: { children: ReactNode }): ReactElement {
  const enabled = useIsAuthEnabled();
  if (enabled) {
    // Will refresh the access token if it has expired when fetching data
    enableRefreshFetch();
  }

  const { data: decodedToken } = useAuthToken();
  const username = decodedToken?.sub || '';
  const { data } = useUserPermissions(username);
  const userPermissions: Record<string, Permission[]> = useMemo(() => {
    if (!data) {
      return {};
    }
    return data;
  }, [data]);

  return (
    <AuthorizationContext.Provider value={{ enabled, username, userPermissions }}>
      {props.children}
    </AuthorizationContext.Provider>
  );
}

export function useAuthorizationContext(): AuthorizationContext {
  const ctx = useContext(AuthorizationContext);
  if (ctx === undefined) {
    throw new Error('No AuthorizationContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function useDashboardCreateAllowedProjects(): ProjectResource[] {
  const { enabled, userPermissions } = useAuthorizationContext();
  const { data } = useProjectList();
  if (!enabled) {
    return data ?? [];
  }

  return (data ?? []).filter(
    (project) =>
      permissionListHasPermission(userPermissions[GlobalProject] ?? [], 'create', 'Dashboard') ||
      permissionListHasPermission(userPermissions[project.metadata.name] ?? [], 'create', 'Dashboard')
  );
}

/*
 * useHasPermission is a helper for knowing if a user has the permission to perform an action
 * It's only a check client-side, easily bypassable.
 * It will always return true if the authorization is disabled
 */
export function useHasPermission(action: Action, project: string, scope: Scope): boolean {
  const { enabled, username, userPermissions } = useAuthorizationContext();

  // Authorization not enabled
  if (!enabled) {
    return true;
  }

  // User not logged in
  if (!username) {
    return false;
  }

  // Checking global perm first
  if (project !== GlobalProject) {
    if (permissionListHasPermission(userPermissions[GlobalProject] ?? [], action, scope)) {
      return true;
    }
  }

  // Checking project perm
  return permissionListHasPermission(userPermissions[project] ?? [], action, scope);
}

function permissionListHasPermission(permissions: Permission[], requestAction: Action, requestScope: Scope): boolean {
  return permissions.some(
    (permission) =>
      permission.actions.some((action) => action === requestAction || action === '*') &&
      permission.scopes.some((scope) => scope === requestScope || scope === '*')
  );
}

/*
 * useHasPartialPermission is a helper for knowing if a user has the permission to perform at least one action
 * It's only a check client-side, easily bypassable.
 * It will always return true if the authorization is disabled
 */
export function useHasPartialPermission(actions: Action[], project: string, scopes: Scope[]): boolean {
  const { enabled, username, userPermissions } = useAuthorizationContext();

  // Authorization not enabled
  if (!enabled) {
    return true;
  }

  // User not logged in
  if (!username) {
    return false;
  }

  for (const action of actions) {
    for (const scope of scopes) {
      // Checking global perm first
      if (project !== GlobalProject) {
        if (permissionListHasPermission(userPermissions[GlobalProject] ?? [], action, scope)) {
          return true;
        }
      }

      // Checking project perm
      if (permissionListHasPermission(userPermissions[project] ?? [], action, scope)) {
        return true;
      }
    }
  }
  return false;
}
