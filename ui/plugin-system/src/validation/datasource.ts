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
import { Datasource, DatasourceDefinition, DatasourceSpec } from '@perses-dev/core';
import { metadataSchema, projectMetadataSchema } from './metadata';
import { PluginSchema, pluginSchema } from './plugin';
import { displaySchema } from './display';

export const datasourceSpecSchema: z.ZodSchema<DatasourceSpec> = z.object({
  display: displaySchema.optional(),
  default: z.boolean(),
  plugin: pluginSchema,
});

export function buildDatasourceSpecSchema(pluginSchema: PluginSchema): z.ZodSchema<DatasourceSpec> {
  return z.object({
    display: displaySchema.optional(),
    default: z.boolean(),
    plugin: pluginSchema,
  });
}

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

// TODO: fix
export const datasourcesSchema: z.Schema<Datasource> = z.discriminatedUnion('kind', [
  datasourceSchema,
  globalDatasourceSchema,
]);

export const datasourceDefinitionSchema: z.Schema<DatasourceDefinition> = z.object({
  name: z.string().min(1),
  spec: datasourceSpecSchema,
});

export function buildDatasourceDefinitionSchema(pluginSchema: PluginSchema): z.Schema<DatasourceDefinition> {
  return z.object({
    name: z.string().min(1),
    spec: buildDatasourceSpecSchema(pluginSchema),
  });
}
