import type { Meta, StoryObj } from '@storybook/react';
import { YAxisLabel, YAxisLabelProps } from '@perses-dev/components';

const meta: Meta<typeof YAxisLabel> = {
  component: YAxisLabel,
  render: (args) => <YAxisLabelWrapper {...args} />,
};

export default meta;

type Story = StoryObj<typeof YAxisLabel>;

const YAxisLabelWrapper = (props: YAxisLabelProps) => {
  return (
    <div
      style={{
        height: props.height,
      }}
    >
      <YAxisLabel {...props} />
    </div>
  );
};

export const Primary: Story = {
  args: {
    name: 'Time',
    height: 100,
  },
};
