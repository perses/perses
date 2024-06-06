// Copyright 2024 The Perses Authors
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
import { Link, PanelDefinition, PanelDisplay, PanelEditorValues, PanelSpec, QueryDefinition } from '@perses-dev/core';
import { PluginSchema, pluginSchema } from './plugin';

export const panelDisplaySpec: z.ZodSchema<PanelDisplay> = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const querySpecSchema: z.ZodSchema<QueryDefinition> = z.object({
  kind: z.string().min(1),
  spec: z.object({
    plugin: pluginSchema,
  }),
});

export const linkSchema: z.ZodSchema<Link> = z.object({
  name: z.string().optional(),
  url: z.string().min(1),
  tooltip: z.string().optional(),
  renderVariables: z.boolean().optional(),
  targetBlank: z.boolean().optional(),
});

export const panelSpecSchema: z.ZodSchema<PanelSpec> = z.object({
  display: panelDisplaySpec,
  plugin: pluginSchema,
  queries: z.array(querySpecSchema).optional(),
  links: z.array(linkSchema).optional(),
});

export function buildPanelSpecSchema(pluginSchema: PluginSchema): z.ZodSchema<PanelSpec> {
  return z.object({
    display: panelDisplaySpec,
    plugin: pluginSchema,
    queries: z.array(querySpecSchema).optional(),
    links: z.array(linkSchema).optional(),
  });
}

export const panelDefinitionSchema: z.ZodSchema<PanelDefinition> = z.object({
  kind: z.literal('Panel'),
  spec: panelSpecSchema,
});

export function buildPanelDefinitionSchema(pluginSchema: PluginSchema): z.ZodSchema<PanelDefinition> {
  return z.object({
    kind: z.literal('Panel'),
    spec: buildPanelSpecSchema(pluginSchema),
  });
}

export const panelEditorSchema: z.ZodSchema<PanelEditorValues> = z.object({
  groupId: z.number(),
  panelDefinition: panelDefinitionSchema,
});

export function buildPanelEditorSchema(pluginSchema: PluginSchema): z.ZodSchema<PanelEditorValues> {
  return z.object({
    groupId: z.number(),
    panelDefinition: buildPanelDefinitionSchema(pluginSchema),
  });
}
