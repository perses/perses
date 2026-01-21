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
import { AnnotationDefinition, AnnotationDisplay, AnnotationSpec } from '../model';
import { PluginSchema, pluginSchema } from './plugin';

export const annotationDisplaySchema: z.ZodSchema<AnnotationDisplay> = z.object({
  name: z.string(),
  description: z.string().optional(),
  hidden: z.boolean().optional(),
});

export function buildAnnotationSpecSchema(pluginSchema: PluginSchema): z.ZodSchema<AnnotationSpec> {
  return z.object({
    display: annotationDisplaySchema,
    color: z.string().optional(),
    plugin: pluginSchema,
  });
}

export const annotationSpecSchema = z.object({
  display: annotationDisplaySchema,
  color: z.string().optional(),
  plugin: pluginSchema,
});

export const annotationDefinitionSchema: z.ZodSchema<AnnotationDefinition> = z.object({
  kind: z.literal('Annotation'),
  spec: annotationSpecSchema,
});

export function buildAnnotationDefinitionSchema(pluginSchema: PluginSchema): z.ZodSchema<AnnotationDefinition> {
  return z.object({
    kind: z.literal('Annotation'),
    spec: buildAnnotationSpecSchema(pluginSchema),
  });
}
