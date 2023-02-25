import type { Meta, StoryObj } from '@storybook/react';
import { DateTimeRangePicker } from './DateTimeRangePicker';

const meta: Meta<typeof DateTimeRangePicker> = {
  component: DateTimeRangePicker,
};

export default meta;

type Story = StoryObj<typeof DateTimeRangePicker>;

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
