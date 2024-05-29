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
import { metadataSchema, projectMetadataSchema } from './metadata';

export const permissionSchema = z.object({
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

export const roleSpecSchema = z.object({
  permissions: z.array(permissionSchema),
});

export const roleSchema = z.object({
  kind: z.literal('Role'),
  metadata: projectMetadataSchema,
  spec: roleSpecSchema,
});

export const globalRoleSchema = z.object({
  kind: z.literal('GlobalRole'),
  metadata: metadataSchema,
  spec: roleSpecSchema,
});

export const rolesEditorSchema = z.discriminatedUnion('kind', [roleSchema, globalRoleSchema]);

export type RolesEditorSchemaType = z.infer<typeof rolesEditorSchema>;
