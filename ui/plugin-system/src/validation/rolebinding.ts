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
import { resourceIdValidationSchema } from '@perses-dev/plugin-system';

const subjectValidationSchema = z.object({
  kind: z.enum(['User']),
  name: resourceIdValidationSchema,
});

const roleBindingValidationSchema = z.object({
  kind: z.literal('RoleBinding'),
  metadata: z.object({
    name: resourceIdValidationSchema,
    project: resourceIdValidationSchema,
  }),
  spec: z.object({
    role: resourceIdValidationSchema,
    subjects: z.array(subjectValidationSchema).nonempty(),
  }),
});

const globalRoleBindingValidationSchema = z.object({
  kind: z.literal('GlobalRoleBinding'),
  metadata: z.object({
    name: resourceIdValidationSchema,
  }),
  spec: z.object({
    role: resourceIdValidationSchema,
    subjects: z.array(subjectValidationSchema),
  }),
});

export const roleBindingsEditorValidationSchema = z.discriminatedUnion('kind', [
  roleBindingValidationSchema,
  globalRoleBindingValidationSchema,
]);

export type RoleBindingsEditorValidationType = z.infer<typeof roleBindingsEditorValidationSchema>;
