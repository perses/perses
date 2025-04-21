import { VariableStateMap } from './variables';

export function filterVariableStateMap(v: VariableStateMap, names?: string[]): VariableStateMap {
  if (!names) {
    return v;
  }
  return Object.fromEntries(Object.entries(v).filter(([name]) => names.includes(name)));
}

/**
 * Returns a serialized string of the current state of variable values.
 */
export function getVariableValuesKey(v: VariableStateMap): string {
  return Object.values(v)
    .map((v) => JSON.stringify(v.value))
    .join(',');
}
