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

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { z } from 'zod';
import { datasourceEditValidationSchema } from './datasource';
import { variableEditValidationSchema } from './variable';
import { panelEditorValidationSchema } from './panel';

export interface ValidationSchemas {
  datasourceEditorFormSchema: z.Schema;
  panelEditorFormSchema: z.Schema;
  variableEditorFormSchema: z.Schema;
  setDatasourceEditorFormSchema: (schema: z.Schema) => void;
  setPanelEditorFormSchema: (schema: z.Schema) => void;
  setVariableEditorFormSchema: (schema: z.Schema) => void;
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
  initialDatasourceFormEditorSchema?: z.Schema;
  initialPanelEditorFormSchema?: z.Schema;
  initialVariableEditorFormSchema?: z.Schema;
  children: ReactNode;
}

export function ValidationProvider({
  initialDatasourceFormEditorSchema,
  initialPanelEditorFormSchema,
  initialVariableEditorFormSchema,
  children,
}: ValidationProviderProps) {
  const [datasourceEditorFormSchema, setDatasourceEditorFormSchema] = useState<z.Schema>(
    initialDatasourceFormEditorSchema ?? datasourceEditValidationSchema
  );
  const [panelEditorFormSchema, setPanelEditorFormSchema] = useState<z.Schema>(
    initialPanelEditorFormSchema ?? panelEditorValidationSchema
  );
  const [variableEditorFormSchema, setVariableEditorFormSchema] = useState<z.Schema>(
    initialVariableEditorFormSchema ?? variableEditValidationSchema
  );

  const ctx = useMemo(() => {
    return {
      datasourceEditorFormSchema,
      panelEditorFormSchema,
      variableEditorFormSchema,
      setDatasourceEditorFormSchema,
      setPanelEditorFormSchema,
      setVariableEditorFormSchema,
    };
  }, [datasourceEditorFormSchema, panelEditorFormSchema, variableEditorFormSchema]);

  return <ValidationContext.Provider value={ctx}>{children}</ValidationContext.Provider>;
}
