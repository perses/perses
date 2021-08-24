import {
  JsonObject,
  DurationString,
  UseVariableOptionsHook,
  VariableDefinition,
} from '@perses-ui/core';

export const IntervalKind = 'Inverval' as const;

type IntervalVariable = VariableDefinition<IntervalKind, IntervalOptions>;

type IntervalKind = typeof IntervalKind;

interface IntervalOptions extends JsonObject {
  values: DurationString[];
  auto?: {
    step_count: number;
    min_interval: DurationString;
  };
}

/**
 * Variable plugin for getting a list of variable options from a predefined
 * list of duration values.
 */
export function useIntervalValues(
  definition: IntervalVariable
): ReturnType<UseVariableOptionsHook<IntervalKind, IntervalOptions>> {
  // TODO: What about auto?
  const {
    options: { values },
  } = definition;
  return { loading: false, error: undefined, data: values };
}
