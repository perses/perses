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

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { z } from 'zod';
import { datasourceEditValidationSchema } from './datasource';
import { variableEditValidationSchema } from './variable';
import { panelEditorValidationSchema } from './panel';

export interface ValidationSchemas {
  datasourceEditorFormSchema: z.ZodObject<any>;
  panelEditorFormSchema: z.ZodObject<any>;
  variableEditorFormSchema: z.ZodObject<any>;
  setDatasourcePluginEditorFormSchema: (schema: z.ZodObject<any>) => void;
  setPanelPluginEditorFormSchema: (schema: z.ZodObject<any>) => void;
  setVariablePluginEditorFormSchema: (schema: z.ZodObject<any>) => void;
}

export const ValidationContext = createContext<ValidationSchemas | undefined>(undefined);

export function useValidationContext(): ValidationSchemas {
  const ctx = useContext(ValidationContext);
  if (ctx === undefined) {
    throw new Error('No ValidationContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function useValidation(): ValidationSchemas {
  return useValidationContext();
}

export interface ValidationProviderProps {
  initialDatasourceFormEditorSchema?: z.ZodObject<any>;
  initialPanelEditorFormSchema?: z.ZodObject<any>;
  initialVariableEditorFormSchema?: z.ZodObject<any>;
  children: ReactNode;
}

export function ValidationProvider({
  initialDatasourceFormEditorSchema,
  initialPanelEditorFormSchema,
  initialVariableEditorFormSchema,
  children,
}: ValidationProviderProps) {
  const [datasourceEditorFormSchema, setDatasourceEditorFormSchema] = useState<z.ZodObject<any>>(
    initialDatasourceFormEditorSchema ?? datasourceEditValidationSchema
  );
  const [panelEditorFormSchema, setPanelEditorFormSchema] = useState<z.ZodObject<any>>(
    initialPanelEditorFormSchema ?? panelEditorValidationSchema
  );
  const [variableEditorFormSchema, setVariableEditorFormSchema] = useState<z.ZodObject<any>>(
    initialVariableEditorFormSchema ?? variableEditValidationSchema
  );

  const setDatasourcePluginEditorFormSchema = useCallback(
    (pluginSchema: z.ZodObject<any>) =>
      setDatasourceEditorFormSchema(
        (initialDatasourceFormEditorSchema ?? datasourceEditValidationSchema).merge(pluginSchema)
      ),
    [initialDatasourceFormEditorSchema]
  );

  const setPanelPluginEditorFormSchema = useCallback(
    (pluginSchema: z.ZodObject<any>) =>
      setPanelEditorFormSchema((initialPanelEditorFormSchema ?? panelEditorValidationSchema).merge(pluginSchema)),
    [initialPanelEditorFormSchema]
  );

  const setVariablePluginEditorFormSchema = useCallback(
    (pluginSchema: z.ZodObject<any>) =>
      setVariableEditorFormSchema(
        (initialVariableEditorFormSchema ?? variableEditValidationSchema).merge(pluginSchema)
      ),
    [initialVariableEditorFormSchema]
  );

  const ctx = useMemo(() => {
    return {
      datasourceEditorFormSchema,
      panelEditorFormSchema,
      variableEditorFormSchema,
      setDatasourcePluginEditorFormSchema,
      setPanelPluginEditorFormSchema,
      setVariablePluginEditorFormSchema,
    };
  }, [
    datasourceEditorFormSchema,
    panelEditorFormSchema,
    setDatasourcePluginEditorFormSchema,
    setPanelPluginEditorFormSchema,
    setVariablePluginEditorFormSchema,
    variableEditorFormSchema,
  ]);

  return <ValidationContext.Provider value={ctx}>{children}</ValidationContext.Provider>;
}
