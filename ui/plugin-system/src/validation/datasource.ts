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
import { metadataSchema, nameSchema, projectMetadataSchema } from './metadata';
import { PluginSchema, pluginSchema, PluginSchemaType } from './plugin';
import { displaySchema } from './display';

export const datasourceEditValidationSchema = z.object({
  name: nameSchema,
  title: z.string().optional(), // display name
  description: z.string().optional(),
  default: z.boolean(),
});

export type DatasourceEditValidationType = z.infer<typeof datasourceEditValidationSchema>;

export const datasourceSpecSchema = z.object({
  display: displaySchema.optional(),
  default: z.boolean(),
  plugin: pluginSchema,
});

export const datasourceSchema = z.object({
  kind: z.literal('Datasource'),
  metadata: projectMetadataSchema,
  spec: datasourceSpecSchema,
});

export const globalDatasourceSchema = z.object({
  kind: z.literal('GlobalDatasource'),
  metadata: metadataSchema,
  spec: datasourceSpecSchema,
});

export const datasourceDefinitionSchema = z.object({
  name: z.string().min(1),
  spec: datasourceSpecSchema,
});
export type DatasourceEditorSchema = typeof datasourceDefinitionSchema;
export type DatasourceEditorSchemaType = z.infer<DatasourceEditorSchema>;

export const datasourcesSchema = z.discriminatedUnion('kind', [datasourceSchema, globalDatasourceSchema]);
export type DatasourcesSchema = typeof datasourcesSchema;

function buildDatasourceSpec(pluginSchema: PluginSchema): typeof datasourceSpecSchema {
  return z.object({
    display: displaySchema.optional(),
    default: z.boolean(),
    plugin: pluginSchema,
  });
}

function buildDatasource(pluginSchema: PluginSchema): typeof datasourceSchema {
  return z.object({
    kind: z.literal('Datasource'),
    metadata: projectMetadataSchema,
    spec: buildDatasourceSpec(pluginSchema),
  });
}

function buildGlobalDatasource(pluginSchema: PluginSchema): typeof globalDatasourceSchema {
  return z.object({
    kind: z.literal('GlobalDatasource'),
    metadata: metadataSchema,
    spec: buildDatasourceSpec(pluginSchema),
  });
}

export function buildDatasources(pluginSchema: PluginSchema): DatasourcesSchema {
  return z.discriminatedUnion('kind', [buildDatasource(pluginSchema), buildGlobalDatasource(pluginSchema)]);
}

export function buildDatasourceDefinition(pluginSchema: PluginSchema): DatasourceEditorSchema {
  return z.object({
    name: z.string().min(1),
    spec: buildDatasourceSpec(pluginSchema),
  });
}
