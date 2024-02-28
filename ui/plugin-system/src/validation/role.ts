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

import { z } from 'zod';
import { resourceIdValidationSchema } from './resource';

const permissionValidationSchema = z.object({
  // TODO: use SCOPE & ACTIONS constants
  actions: z.array(z.enum(['*', 'create', 'read', 'update', 'delete'])).nonempty('Must contains at least 1 action'),
  scopes: z
    .array(
      z.enum([
        '*',
        'Dashboard',
        'Datasource',
        'EphemeralDashboard',
        'Folder',
        'GlobalDatasource',
        'GlobalRole',
        'GlobalRoleBinding',
        'GlobalSecret',
        'GlobalVariable',
        'Project',
        'Role',
        'RoleBinding',
        'Secret',
        'User',
        'Variable',
      ])
    )
    .nonempty('Must contains at least 1 scope'), // TODO: limit project role
});

export const roleValidationSchema = z.object({
  kind: z.literal('Role'),
  metadata: z.object({
    name: resourceIdValidationSchema,
    project: resourceIdValidationSchema,
  }),
  spec: z.object({
    permissions: z.array(permissionValidationSchema),
  }),
});

export const globalRoleValidationSchema = z.object({
  kind: z.literal('GlobalRole'),
  metadata: z.object({
    name: resourceIdValidationSchema,
  }),
  spec: z.object({
    permissions: z.array(permissionValidationSchema),
  }),
});

export const rolesEditorValidationSchema = z.discriminatedUnion('kind', [
  roleValidationSchema,
  globalRoleValidationSchema,
]);

export type RolesEditorValidationType = z.infer<typeof rolesEditorValidationSchema>;
