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

import type { Action, Permission, ProjectResource, Scope, StatusError } from '@perses-dev/client';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { useUsername } from '../model/auth/auth-client';
import { enableRefreshFetch } from '../model/fetch';
import { useProjectList } from '../model/project-client';
import { useUserPermissions } from '../model/user-client';
import { useIsDelegatedAuthnProviderEnabled, useIsAuthEnabled } from './Config';

// Used as placeholder for checking Global permissions
export const GlobalProject = '*';

// Kubernetes/delegated auth does not emit Project scope entries. Backend project
// access is derived from read on Dashboard, Datasource, or Secret in a namespace
// (see internal/api/authorization/k8s/k8s.go checkNamespaceAccess). Native RBAC
// still uses the Project scope, so include it here as well.
const PROJECT_READ_SCOPES: Scope[] = ['Project', 'Dashboard', 'Datasource', 'Secret'];

interface AuthorizationContext {
  enabled: boolean;
  username: string;
  userPermissions: Record<string, Permission[]>;
  isPermissionsLoading: boolean;
  permissionsError: StatusError | undefined;
}

const AuthorizationContext = createContext<AuthorizationContext | undefined>(undefined);

// Provide RBAC helpers for checking current user permissions
export function AuthorizationProvider(props: { children: ReactNode }): ReactElement {
  const enabled = useIsAuthEnabled();
  const isdelegatedAuthnProviderEnabled = useIsDelegatedAuthnProviderEnabled();
  if (enabled && !isdelegatedAuthnProviderEnabled) {
    // Will refresh the access token if it has expired when fetching data
    enableRefreshFetch();
  }

  const username = useUsername();
  const { data, error, isFetching, isLoading } = useUserPermissions(username);
  const contextValue: AuthorizationContext = useMemo(() => {
    const hasUsername = Boolean(username);
    return {
      enabled,
      username,
      userPermissions: data ?? {},
      // TanStack Query v4 reports isLoading while a disabled query is idle.
      // Require isFetching so an empty username is not treated as loading.
      isPermissionsLoading: enabled && hasUsername && isLoading && isFetching,
      permissionsError: enabled && hasUsername ? (error ?? undefined) : undefined,
    };
  }, [data, enabled, error, isFetching, isLoading, username]);

  return <AuthorizationContext.Provider value={contextValue}>{props.children}</AuthorizationContext.Provider>;
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
      permissionListHasPermission(userPermissions[project.metadata.name] ?? [], 'create', 'Dashboard'),
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

/*
 * useHasPermissionInAnyProject is a helper for knowing if a user can perform an action on a scope
 * in any project, including global (`*`) permissions.
 * It's only a check client-side, easily bypassable.
 * It will always return true if the authorization is disabled.
 */
export function useHasPermissionInAnyProject(action: Action, scope: Scope): boolean {
  const { enabled, username, userPermissions } = useAuthorizationContext();

  if (!enabled) {
    return true;
  }

  if (!username) {
    return false;
  }

  return Object.values(userPermissions).some((permissions) => permissionListHasPermission(permissions, action, scope));
}

/*
 * useCanReadAnyProject is true when the user can list at least one project.
 * Native RBAC grants this via the Project scope. Kubernetes/delegated auth
 * derives it from Dashboard, Datasource, or Secret read in any namespace.
 */
export function useCanReadAnyProject(): boolean {
  const { enabled, username, userPermissions } = useAuthorizationContext();

  if (!enabled) {
    return true;
  }

  if (!username) {
    return false;
  }

  return Object.values(userPermissions).some((permissions) =>
    PROJECT_READ_SCOPES.some((scope) => permissionListHasPermission(permissions, 'read', scope)),
  );
}

/*
 * usePermissionsQueryStatus exposes loading/error for the permissions request
 * so callers can distinguish "still loading" and "request failed" from an
 * empty permission map.
 */
export function usePermissionsQueryStatus(): { isLoading: boolean; error: StatusError | undefined } {
  const { isPermissionsLoading, permissionsError } = useAuthorizationContext();
  return { isLoading: isPermissionsLoading, error: permissionsError };
}

function permissionListHasPermission(permissions: Permission[], requestAction: Action, requestScope: Scope): boolean {
  return permissions.some(
    (permission) =>
      permission.actions.some((action) => action === requestAction || action === '*') &&
      permission.scopes.some((scope) => scope === requestScope || scope === '*'),
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
