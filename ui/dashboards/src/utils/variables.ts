import { useTemplateVariableValues, parseTemplateVariables, replaceTemplateVariables } from '@perses-dev/plugin-system';

// Convinience hook for replacing template variables in a string
export function useReplaceVariablesInString(str: string | null): string | null {
  const variablesInString = str ? parseTemplateVariables(str) : [];
  const variableValues = useTemplateVariableValues(variablesInString);
  if (!str) return null;
  return replaceTemplateVariables(str, variableValues);
}
