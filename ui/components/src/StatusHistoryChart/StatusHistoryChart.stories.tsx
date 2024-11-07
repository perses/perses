import type { Meta, StoryObj } from '@storybook/react';
import { StatusHistoryChart, StatusHistoryChartProps, StatusHistoryData } from './StatusHistoryChart';

const DEFAULT_DATA: StatusHistoryData[] = [
  [0, 0, 1],
  [1, 0, 2],
  [2, 0, 3],
  [0, 1, 2],
  [1, 1, 3],
  [2, 1, 1],
];

const meta: Meta<typeof StatusHistoryChart> = {
  component: StatusHistoryChart,
  args: {
    height: 300,
    data: DEFAULT_DATA,
    xAxisCategories: [1677338340000, 1677338370000, 1677338400000],
    yAxisCategories: ['Category 1', 'Category 2'],
  },
  render: (args) => <StatusHistoryChartWrapper {...args} />,
};

export default meta;

type Story = StoryObj<typeof StatusHistoryChart>;

const StatusHistoryChartWrapper = (props: StatusHistoryChartProps) => {
  // This wrapper is needed or the status history chart does not size as expected.
  return (
    <div
      style={{
        height: props.height,
        width: '100%',
      }}
    >
      <StatusHistoryChart {...props} />
    </div>
  );
};

export const Primary: Story = {
  args: {},
};

export const WithLegend: Story = {
  args: {
    legend: {
      show: true,
      data: ['Status 1', 'Status 2', 'Status 3'],
    },
  },
};
