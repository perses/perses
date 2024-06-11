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
import {
  ListVariableDefinition,
  ListVariableSpec,
  TextVariableDefinition,
  TextVariableSpec,
  Variable,
  VariableDefinition,
  VariableDisplay,
} from '../model';
import { projectMetadataSchema } from './metadata';
import { PluginSchema, pluginSchema } from './plugin';

export const variableDisplaySchema: z.ZodSchema<VariableDisplay> = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  hidden: z.boolean().optional(),
});

export const variableListSpecSchema: z.ZodSchema<ListVariableSpec> = z.object({
  name: z.string().min(1),
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

export function buildVariableListSpecSchema(pluginSchema: PluginSchema): z.ZodSchema<ListVariableSpec> {
  return z.object({
    name: z.string().min(1),
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
}

export const variableListSchema = z.object({
  kind: z.literal('ListVariable'),
  spec: variableListSpecSchema,
});

export function buildVariableListSchema(pluginSchema: PluginSchema): typeof variableListSchema {
  return z.object({
    kind: z.literal('ListVariable'),
    spec: buildVariableListSpecSchema(pluginSchema),
  });
}

export const variableTextSpecSchema: z.ZodSchema<TextVariableSpec> = z.object({
  name: z.string().min(1),
  display: variableDisplaySchema.optional(),
  value: z.string().min(1),
  constant: z.boolean().optional(),
});

export const variableTextSchema = z.object({
  kind: z.literal('TextVariable'),
  spec: variableTextSpecSchema,
});

export const variableSpecSchema: z.ZodSchema<TextVariableDefinition | ListVariableDefinition> = z.discriminatedUnion(
  'kind',
  [variableTextSchema, variableListSchema]
);

export function buildVariableSpecSchema(pluginSchema: PluginSchema): z.ZodSchema<VariableDefinition> {
  return z.union([variableTextSchema, buildVariableListSchema(pluginSchema)]);
}

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

export const variablesSchema: z.ZodSchema<Variable> = z.discriminatedUnion('kind', [
  variableSchema,
  globalVariableSchema,
]);

export const variableDefinitionSchema: z.ZodSchema<VariableDefinition> = variableSpecSchema;

export function buildVariableDefinitionSchema(pluginSchema: PluginSchema): z.ZodSchema<VariableDefinition> {
  return z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('ListVariable'),
      spec: buildVariableListSpecSchema(pluginSchema),
    }),
    z.object({
      kind: z.literal('TextVariable'),
      spec: variableTextSpecSchema,
    }),
  ]);
}
