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

import { WindowHistoryAdapter } from 'use-query-params/adapters/window';
import { QueryParamProvider } from 'use-query-params';
import { StoryFn } from '@storybook/react';

export const WithQueryParams = (Story: StoryFn) => {
  return (
    <QueryParamProvider adapter={WindowHistoryAdapter}>
      <Story />
    </QueryParamProvider>
  );
};
