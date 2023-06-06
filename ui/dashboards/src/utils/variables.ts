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

import { useTemplateVariableValues, parseTemplateVariables, replaceTemplateVariables } from '@perses-dev/plugin-system';

// Convinience hook for replacing template variables in a string
export function useReplaceVariablesInString(str: string | null): string | null {
  const variablesInString = str ? parseTemplateVariables(str) : [];
  const variableValues = useTemplateVariableValues(variablesInString);
  if (!str) return null;
  return replaceTemplateVariables(str, variableValues);
}
