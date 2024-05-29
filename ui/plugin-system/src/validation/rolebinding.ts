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
import { nameSchema, metadataSchema, projectMetadataSchema } from './metadata';

export const subjectSchema = z.object({
  kind: z.enum(['User']),
  name: nameSchema,
});

export const roleBindingSpecSchema = z.object({
  role: nameSchema,
  subjects: z.array(subjectSchema).nonempty(),
});

export const roleBindingSchema = z.object({
  kind: z.literal('RoleBinding'),
  metadata: projectMetadataSchema,
  spec: roleBindingSpecSchema,
});

export const globalRoleBindingSchema = z.object({
  kind: z.literal('GlobalRoleBinding'),
  metadata: metadataSchema,
  spec: roleBindingSpecSchema,
});

export const roleBindingsEditorSchema = z.discriminatedUnion('kind', [roleBindingSchema, globalRoleBindingSchema]);

export type RoleBindingsEditorSchemaType = z.infer<typeof roleBindingsEditorSchema>;
