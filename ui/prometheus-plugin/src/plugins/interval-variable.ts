// Copyright 2021 The Perses Authors
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

import { JsonObject, DurationString, UseVariableOptionsHook, VariableDefinition } from '@perses-ui/core';

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
