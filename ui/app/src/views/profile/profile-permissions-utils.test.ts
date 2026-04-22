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

import { normalizePermissions, IFlatPermission } from './profile-permissions-utils';

describe('ProfilePermissionsUtils', () => {
  describe('With redundant actions and scopes', () => {
    it('should remove redundant actions', () => {
      const mockFlatPermissions: IFlatPermission[] = [
        {
          key: '*',
          permissions: [
            { actions: ['read', 'create'], scopes: ['*'] },
            { actions: ['update', 'delete', 'create', 'read'], scopes: ['Project', 'Dashboard'] },
          ],
        },
      ];

      const normalizedPermissions = normalizePermissions(mockFlatPermissions);

      expect(normalizedPermissions?.length).toBe(1);
      const { key, permissions } = normalizedPermissions[0] as IFlatPermission;

      expect(key).toBe('*');
      expect(permissions.length).toBe(2);
      expect(permissions[0]?.actions).toStrictEqual(['read', 'create']);
      expect(permissions[0]?.scopes).toStrictEqual(['*']);
      expect(permissions[1]?.actions).toStrictEqual(['update', 'delete']);
      expect(permissions[1]?.scopes).toStrictEqual(['Project', 'Dashboard']);
    });

    it('should remove redundant actions of multiple projects', () => {
      const mockFlatPermissions: IFlatPermission[] = [
        {
          key: '*',
          permissions: [
            { actions: ['read', 'create'], scopes: ['*'] },
            { actions: ['update', 'delete', 'create', 'read'], scopes: ['Project', 'Dashboard'] },
          ],
        },
        {
          key: 'project huge',
          permissions: [
            { actions: ['read', 'create', '*'], scopes: ['*'] },
            { actions: ['update', 'delete', 'create', 'read'], scopes: ['Project', 'Dashboard'] },
          ],
        },
      ];

      const normalizedPermissions = normalizePermissions(mockFlatPermissions);

      expect(normalizedPermissions?.length).toBe(2);
      const firstItem = normalizedPermissions[0] as IFlatPermission;
      const secondItem = normalizedPermissions[1] as IFlatPermission;

      expect(firstItem?.key).toBe('*');
      expect(firstItem?.permissions.length).toBe(2);
      expect(firstItem?.permissions[0]?.actions).toStrictEqual(['read', 'create']);
      expect(firstItem?.permissions[0]?.scopes).toStrictEqual(['*']);
      expect(firstItem?.permissions[1]?.actions).toStrictEqual(['update', 'delete']);
      expect(firstItem?.permissions[1]?.scopes).toStrictEqual(['Project', 'Dashboard']);

      expect(secondItem?.key).toBe('project huge');
      expect(secondItem?.permissions.length).toBe(1);
      expect(secondItem?.permissions[0]?.actions).toStrictEqual(['*']);
      expect(secondItem?.permissions[0]?.scopes).toStrictEqual(['*']);
    });
  });

  describe('Full permission grants override', () => {
    it('should only contain actions:*,scopes:*', () => {
      /* Here only last record should be rendered and others are redundant */
      const mockFlatPermissions: IFlatPermission[] = [
        {
          key: '*',
          permissions: [
            { actions: ['read', 'create'], scopes: ['*'] },
            { actions: ['update', 'delete', 'create', 'read'], scopes: ['Project', 'Dashboard'] },
            { actions: ['*'], scopes: ['*'] },
          ],
        },
      ];
      const normalizedPermissions = normalizePermissions(mockFlatPermissions);
      const { key, permissions } = normalizedPermissions[0] as IFlatPermission;
      expect(key).toBe('*');
      expect(permissions.length).toBe(1);
      expect(permissions[0]?.actions).toStrictEqual(['*']);
      expect(permissions[0]?.scopes).toStrictEqual(['*']);
    });

    it('should only contain actions:*,scopes:*', () => {
      const mockFlatPermissions: IFlatPermission[] = [
        {
          key: '*',
          permissions: [
            { actions: ['read', 'create', '*'], scopes: ['*'] },
            { actions: ['update', 'delete', 'create', 'read'], scopes: ['Project', 'Dashboard'] },
          ],
        },
      ];
      const normalizedPermissions = normalizePermissions(mockFlatPermissions);
      const { key, permissions } = normalizedPermissions[0] as IFlatPermission;
      expect(key).toBe('*');
      expect(permissions?.length).toBe(1);
      expect(permissions[0]?.actions).toStrictEqual(['*']);
      expect(permissions[0]?.scopes).toStrictEqual(['*']);
    });
  });

  describe('No all resources and actions ', () => {
    it('should NOT change the actions and scopes', () => {
      const mockFlatPermissions: IFlatPermission[] = [
        {
          key: 'huge project',
          permissions: [
            { actions: ['read', 'create'], scopes: ['Dashboard'] },
            { actions: ['update', 'create', 'read'], scopes: ['Project'] },
          ],
        },
      ];
      const normalizedPermissions = normalizePermissions(mockFlatPermissions);
      const { key, permissions } = normalizedPermissions[0] as IFlatPermission;
      expect(key).toBe('huge project');
      expect(permissions?.length).toBe(2);
      expect(permissions[0]?.actions).toStrictEqual(['read', 'create']);
      expect(permissions[0]?.scopes).toStrictEqual(['Dashboard']);
      expect(permissions[1]?.scopes).toStrictEqual(['Project']);
      expect(permissions[1]?.actions).toStrictEqual(['update', 'create', 'read']);
    });
  });
});
