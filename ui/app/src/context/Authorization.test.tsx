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

import type { Permission } from '@perses-dev/client';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

const { authState } = vi.hoisted(() => ({
  authState: {
    enabled: true,
    username: 'user',
    userPermissions: {} as Record<string, Permission[]>,
  },
}));

vi.mock('../model/auth/auth-client', () => ({
  useUsername: (): string => authState.username,
}));

vi.mock('../model/user-client', () => ({
  useUserPermissions: (): { data: Record<string, Permission[]> } => ({
    data: authState.userPermissions,
  }),
}));

vi.mock('../model/project-client', () => ({
  useProjectList: (): { data: unknown[] } => ({ data: [] }),
}));

vi.mock('../model/fetch', () => ({
  enableRefreshFetch: (): void => undefined,
}));

vi.mock('./Config', () => ({
  useIsAuthEnabled: (): boolean => authState.enabled,
  useIsDelegatedAuthnProviderEnabled: (): boolean => true,
}));

import { AuthorizationProvider, useHasPermission, useHasPermissionInAnyProject } from './Authorization';

function PermissionProbe(): ReactElement {
  const hasGlobalDatasourceRead = useHasPermission('read', '*', 'GlobalDatasource');
  const hasDashboardReadAnywhere = useHasPermissionInAnyProject('read', 'Dashboard');
  return (
    <>
      <div>global-datasource:{String(hasGlobalDatasourceRead)}</div>
      <div>dashboard-any:{String(hasDashboardReadAnywhere)}</div>
    </>
  );
}

function renderProbe(): void {
  render(
    <AuthorizationProvider>
      <PermissionProbe />
    </AuthorizationProvider>,
  );
}

describe('useHasPermissionInAnyProject', () => {
  beforeEach(() => {
    authState.enabled = true;
    authState.username = 'user';
    authState.userPermissions = {};
  });

  it('returns true when authorization is disabled', () => {
    authState.enabled = false;
    renderProbe();
    expect(screen.getByText('dashboard-any:true')).toBeInTheDocument();
  });

  it('returns false when the user has no matching permission', () => {
    authState.userPermissions = {
      demo: [{ actions: ['read'], scopes: ['Project'] }],
    };
    renderProbe();
    expect(screen.getByText('dashboard-any:false')).toBeInTheDocument();
  });

  it('returns true when a project-scoped permission matches', () => {
    authState.userPermissions = {
      demo: [{ actions: ['read'], scopes: ['Dashboard'] }],
    };
    renderProbe();
    expect(screen.getByText('dashboard-any:true')).toBeInTheDocument();
  });

  it('returns true when a global permission matches', () => {
    authState.userPermissions = {
      '*': [{ actions: ['read'], scopes: ['Dashboard'] }],
    };
    renderProbe();
    expect(screen.getByText('dashboard-any:true')).toBeInTheDocument();
  });
});

describe('useHasPermission for global resources', () => {
  beforeEach(() => {
    authState.enabled = true;
    authState.username = 'user';
    authState.userPermissions = {};
  });

  it('does not treat project-scoped permissions as global datasource access', () => {
    authState.userPermissions = {
      demo: [{ actions: ['read'], scopes: ['Datasource'] }],
    };
    renderProbe();
    expect(screen.getByText('global-datasource:false')).toBeInTheDocument();
  });

  it('returns true when the user has global datasource read permission', () => {
    authState.userPermissions = {
      '*': [{ actions: ['read'], scopes: ['GlobalDatasource'] }],
    };
    renderProbe();
    expect(screen.getByText('global-datasource:true')).toBeInTheDocument();
  });
});
