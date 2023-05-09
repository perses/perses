import { ListVariableDefinition, VariableDefinition } from '@perses-dev/core';
import { VariableStateMap } from '@perses-dev/plugin-system';

/*
 * Check whether saved variable definitions are out of date with current default list values in Zustand store
 */
export function updateVariableDefaultValues(
  savedVariables: VariableDefinition[],
  currentVariableState: VariableStateMap
) {
  let isSelectedVariablesUpdated = false;
  const newVariables: VariableDefinition[] = [...savedVariables];
  savedVariables.forEach((variable, index) => {
    if (variable.kind === 'ListVariable') {
      const currentVariable = currentVariableState[variable.spec.name];
      if (currentVariable?.default_value !== undefined) {
        const newVariable: ListVariableDefinition = {
          kind: 'ListVariable',
          spec: { ...variable.spec, default_value: currentVariable.default_value },
        };
        newVariables.splice(index, 1, newVariable);
        isSelectedVariablesUpdated = true;
      }
    }
  });
  return { newVariables, isSelectedVariablesUpdated };
}
