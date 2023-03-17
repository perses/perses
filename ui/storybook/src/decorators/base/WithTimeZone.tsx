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

import { Decorator } from '@storybook/react';
import { TimeZoneProvider } from '@perses-dev/components';

/**
 * Sets the time zone based on a selection in the Storybook toolbar.
 */
export const WithTimeZone: Decorator = (Story, context) => {
  const globalTimeZone = context.globals.timeZone;
  const timeZone = typeof globalTimeZone === 'string' ? globalTimeZone : undefined;

  return (
    <TimeZoneProvider timeZone={timeZone}>
      <Story />
    </TimeZoneProvider>
  );
};
