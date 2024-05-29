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

import { createContext, ReactNode, useContext, useState } from 'react';
import { buildDatasourceDefinition, datasourceDefinitionSchema, DatasourceEditorSchema } from './datasource';
import { PluginSchema } from './plugin';

export interface ValidationSchemas {
  datasourcesEditorSchema: DatasourceEditorSchema;
  // variablesEditorSchema: VariablesEditorSchemaType;
  // panelEditorSchema: PanelEditorSchemaType;
  setDatasourcesEditorSchemaPlugin: (pluginSchema: PluginSchema) => void;
}

export const ValidationSchemasContext = createContext<ValidationSchemas | undefined>(undefined);

export function useValidationSchemas(): ValidationSchemas {
  const ctx = useContext(ValidationSchemasContext);
  if (ctx === undefined) {
    throw new Error('No ValidationSchemasContext found. Did you forget a Provider?');
  }
  return ctx;
}

interface ValidationProviderProps {
  children: ReactNode;
}

/*
 * Provide validation schemas for forms handling plugins (datasources, variables, panels).
 */
export function ValidationProvider({ children }: ValidationProviderProps) {
  const [datasourcesSchema, setDatasourcesEditorSchema] = useState<DatasourceEditorSchema>(datasourceDefinitionSchema);

  function setDatasourcesEditorSchemaPlugin(pluginSchema: PluginSchema) {
    setDatasourcesEditorSchema(buildDatasourceDefinition(pluginSchema));
  }

  return (
    <ValidationSchemasContext.Provider
      value={{ datasourcesEditorSchema: datasourcesSchema, setDatasourcesEditorSchemaPlugin }}
    >
      {children}
    </ValidationSchemasContext.Provider>
  );
}
