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

export const variableEditorValidationSchema = z.object({
  name: z
    .string()
    .nonempty('Required')
    .regex(/^\w+$/, 'Must only contains alphanumerical characters and underscores')
    .refine((val) => !val.startsWith('__'), '__ prefix is reserved to builtin variables'),
  title: z.string().optional(),
  description: z.string().optional(),
  kind: z.enum(['TextVariable', 'ListVariable', 'BuiltinVariable']),
  textVariableFields: z.object({
    value: z.string(),
    constant: z.boolean(),
  }),
  listVariableFields: z.object({
    allowMultiple: z.boolean(),
    allowAll: z.boolean(),
    customAllValue: z.string().optional(),
    capturingRegexp: z.string().optional(),
    sort: z.string().optional(),
    plugin: z.object({
      kind: z.string(),
      spec: z.object({}),
    }),
  }),
});

export type VariableEditorValidationType = z.infer<typeof variableEditorValidationSchema>;
