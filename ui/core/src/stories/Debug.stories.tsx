import type { Meta, StoryObj } from '@storybook/react';
import * as allExports from '..';

const Debug = () => {
  return (
    <ul>
      {Object.keys(allExports).map((item) => {
        return <li key={item}>{item}</li>;
      })}
    </ul>
  );
};

const meta: Meta<typeof Debug> = {
  component: Debug,
};

export default meta;

type Story = StoryObj<typeof Debug>;

export const Primary: Story = {
  args: {},
};
