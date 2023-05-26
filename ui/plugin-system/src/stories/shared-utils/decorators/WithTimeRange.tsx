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

import { StoryFn, StoryContext } from '@storybook/react';
import { TimeRangeProvider, TimeRangeProviderProps } from '@perses-dev/plugin-system';

declare module '@storybook/react' {
  interface Parameters {
    withTimeRange?: WithTimeRangeParameter;
  }
}

export type WithTimeRangeParameter = {
  props: Partial<TimeRangeProviderProps>;
};

// Type guard because storybook types parameters as `any`
function isWithTimeRangeParameter(parameter: unknown | WithTimeRangeParameter): parameter is WithTimeRangeParameter {
  return !!parameter && typeof parameter === 'object' && 'props' in parameter;
}

export const WithTimeRange = (Story: StoryFn, context: StoryContext<unknown>) => {
  const initParameter = context.parameters.withTimeRange;
  const parameter = isWithTimeRangeParameter(initParameter) ? initParameter : undefined;
  const props = parameter?.props;

  return (
    <TimeRangeProvider initialTimeRange={{ pastDuration: '1h' }} {...props}>
      <Story />
    </TimeRangeProvider>
  );
};
