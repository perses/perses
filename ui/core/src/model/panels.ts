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

import { Definition, UnknownSpec } from './definitions';
import { QueryDefinition } from './query';

export interface Link {
  name?: string;
  url: string;
  tooltip?: string;
  renderVariables?: boolean;
  targetBlank?: boolean;
}

export interface PanelDisplay {
  name: string;
  description?: string;
}

export interface PanelDefinition<PluginSpec = UnknownSpec> extends Definition<PanelSpec<PluginSpec>> {
  kind: 'Panel';
}

export interface PanelSpec<PluginSpec = UnknownSpec> {
  display: PanelDisplay;
  plugin: Definition<PluginSpec>;
  queries?: QueryDefinition[];
  links?: Link[];
}

/**
 * A reference to a panel defined in the DashboardSpec.
 */
export interface PanelRef {
  $ref: `#/spec/panels/${string}`;
}

export type PanelGroupId = number;

/**
 * Panel values that can be edited in the panel editor.
 */
export interface PanelEditorValues {
  groupId: PanelGroupId;
  panelDefinition: PanelDefinition;
}

export interface ExportFormat {
  name: string;
  extension: string;
  mimeType: string;
}

export interface ExportData {
  format: ExportFormat;
  data: Blob;
  filename: string;
}

export interface DataExportCapability {
  getSupportedFormats(): ExportFormat[];
  exportData(format: ExportFormat, options?: ExportOptions): Promise<ExportData>;
}
export interface ExportOptions {
  title?: string;
  projectName?: string;
  customFilename?: string;
  includeMetadata?: boolean;
}

export const EXPORT_FORMATS = {
  CSV: { name: 'CSV', extension: 'csv', mimeType: 'text/csv' },
  JSON: { name: 'JSON', extension: 'json', mimeType: 'application/json' },
} as const;
