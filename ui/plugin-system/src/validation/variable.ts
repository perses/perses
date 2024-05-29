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
import { projectMetadataSchema } from './metadata';
import { pluginSchema } from './plugin';

export const variableEditorValidationSchema = z.object({
  name: z
    .string()
    .min(1, 'Required')
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
    allowAllValue: z.boolean(),
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

export const variableDisplaySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  hidden: z.boolean(),
});

export const variableListSpecSchema = z.object({
  display: variableDisplaySchema.optional(),
  defaultValue: z.string().or(z.array(z.string())).optional(),
  allowAllValue: z.boolean(),
  allowMultiple: z.boolean(),
  customAllValue: z.string().optional(),
  capturingRegexp: z.string().optional(),
  sort: z
    .enum([
      'none',
      'alphabetical-asc',
      'alphabetical-desc',
      'numerical-asc',
      'numerical-desc',
      'alphabetical-ci-asc',
      'alphabetical-ci-desc',
    ])
    .optional(),
  plugin: pluginSchema,
});

export const variableListSchema = z.object({
  kind: z.literal('ListVariable'),
  spec: variableListSpecSchema,
});

export const variableTextSpecSchema = z.object({
  display: variableDisplaySchema.optional(),
  value: z.string().min(1),
  constant: z.boolean().optional(),
});

export const variableTextSchema = z.object({
  kind: z.literal('TextVariable'),
  spec: variableTextSpecSchema,
});

export const variableSpecSchema = z.discriminatedUnion('kind', [variableTextSchema, variableListSchema]);

export const variableSchema = z.object({
  kind: z.literal('Variable'),
  metadata: projectMetadataSchema,
  spec: variableSpecSchema,
});

export const globalVariableSchema = z.object({
  kind: z.literal('GlobalVariable'),
  metadata: projectMetadataSchema,
  spec: variableSpecSchema,
});

export const variablesEditorSchema = z.discriminatedUnion('kind', [variableSchema, globalVariableSchema]);

export type VariablesEditorSchemaType = z.infer<typeof variablesEditorSchema>;

export const variableDefinitionSchema = z.object({
  name: z.string().min(1),
  spec: variableSpecSchema,
});
