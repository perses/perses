import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Legend, LegendProps } from './Legend';

const meta: Meta<typeof Legend> = {
  component: Legend,
  render: (args) => <LegendWrapper {...args} />,
  args: {
    height: 100,
    width: 600,
    options: { position: 'Bottom' },
    data: [
      {
        id: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
        label: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
        isSelected: false,
        color: 'hsla(158782136,50%,50%,0.8)',
        onClick: action('onClickItem'),
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof Legend>;

const LegendWrapper = (props: LegendProps) => {
  const wrapperHeight = props.height + 100;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: wrapperHeight,
      }}
    >
      <Legend {...props} />
    </div>
  );
};

export const Primary: Story = {};

/**
 * The legend can be positioned at the bottom.
 */
export const Bottom: Story = {
  args: {
    options: {
      position: 'Bottom',
    },
  },
};

/**
 * The legend can be positioned at the right.
 */
export const Right: Story = {
  args: {
    options: {
      position: 'Right',
    },
  },
};
