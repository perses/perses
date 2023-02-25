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

import type { Meta, StoryObj } from '@storybook/react';
import { DateTimeRangePicker } from '@perses-dev/components';

const meta: Meta<typeof DateTimeRangePicker> = {
  component: DateTimeRangePicker,
};

export default meta;

type Story = StoryObj<typeof DateTimeRangePicker>;

/**
 * You can use this to select a date range!
 */
export const Primary: Story = {
  args: {
    value: {
      pastDuration: '6h',
      end: new Date(),
    },
    timeOptions: [
      { value: { pastDuration: '1h' }, display: 'Last 1 hour' },
      { value: { pastDuration: '6h' }, display: 'Last 6 hours' },
      { value: { pastDuration: '12h' }, display: 'Last 12 hours' },
      { value: { pastDuration: '24h' }, display: 'Last 1 day' },
      { value: { pastDuration: '7d' }, display: 'Last 7 days' },
      { value: { pastDuration: '14d' }, display: 'Last 14 days' },
    ],
  },
};
