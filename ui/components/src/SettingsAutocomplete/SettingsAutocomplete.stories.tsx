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
import { SettingsAutocomplete, SettingsAutocompleteProps, SettingsAutocompleteOption } from '@perses-dev/components';
import { action } from '@storybook/addon-actions';
import { useState } from 'react';

const meta: Meta<typeof SettingsAutocomplete> = {
  component: SettingsAutocomplete,
  argTypes: {},
  args: {
    onChange: (...args) => {
      action('onChange')(...args);
    },
  },
  parameters: {
    // Overriding the default on* regex for actions becaues we expose a LOT
    // of these by exposing the MUI BoxProps, and it was making the storybook
    // and browser hang from the numerous actions happening when you interacted
    // with the page.
    actions: { argTypesRegex: '' },
  },
};

export default meta;

type Story = StoryObj<typeof SettingsAutocomplete>;

/**
 * Include a `label` property on options to specify the text that will be
 * displayed to the user for that option. If the `label` is not set, the
 * required `id` property will be displayed.
 */
export const OptionWithLabel: Story = {
  args: {
    options: [
      {
        id: 'top',
        label: 'Top',
      },
      {
        id: 'right',
        label: 'Right',
      },
      {
        id: 'bottom',
        label: 'Bottom',
      },
      {
        id: 'left',
        label: 'Left',
      },
    ],
  },
};

/**
 * Use the `value` prop to set the currently selected value (or values(s) when
 * `multiple` is true) of the autocomplete. The value should use the same type
 * as the `options`. Values are checked for equality with options using the
 * required `id` value for options which should be a unique identifier.
 */
export const Value: StoryObj<SettingsAutocompleteProps<SettingsAutocompleteOption, false, false>> = {
  args: {
    value: {
      id: 'top',
      label: 'Top',
    },
    options: [
      {
        id: 'top',
        label: 'Top',
      },
      {
        id: 'right',
        label: 'Right',
      },
      {
        id: 'bottom',
        label: 'Bottom',
      },
      {
        id: 'left',
        label: 'Left',
      },
    ],
  },
  render: (props) => {
    // This rule doesn't understand storybook's `render` prop.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState<SettingsAutocompleteOption | null | undefined>(props.value);

    return (
      <SettingsAutocomplete
        {...props}
        value={value}
        onChange={(event, value, ...otherArgs) => {
          action('onChange')(event, value, ...otherArgs);
          setValue(value);
        }}
      />
    );
  },
};

/**
 * Include a `description` property on options to display additional context
 * about the option below the label.
 */
export const OptionWithDescription: Story = {
  args: {
    options: [
      {
        id: 'min',
        label: 'Min',
        description: 'Minimum value.',
      },
      {
        id: 'max',
        label: 'Max',
        description: 'Maximum value.',
      },
      {
        id: 'mean',
        label: 'Mean',
        description: 'Average value.',
      },
    ],
  },
};

export const SelectMultiple: StoryObj<SettingsAutocompleteProps<SettingsAutocompleteOption, true, false>> = {
  args: {
    options: [
      {
        id: 'first',
        label: 'First',
      },
      {
        id: 'last',
        label: 'Last',
      },
      {
        id: 'min',
        label: 'Min',
      },
      {
        id: 'max',
        label: 'Max',
      },
    ],
    value: [
      {
        id: 'last',
        label: 'Last',
      },
    ],
    multiple: true,
  },
  render: (props) => {
    // This rule doesn't understand storybook's `render` prop.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState<SettingsAutocompleteOption[] | undefined>(props.value);

    return (
      <SettingsAutocomplete
        {...props}
        value={value}
        onChange={(event, value, ...otherArgs) => {
          action('onChange')(event, value, ...otherArgs);
          setValue(value);
        }}
      />
    );
  },
};

interface GroupedStoryOption extends SettingsAutocompleteOption {
  group: string;
}

/**
 * Options can be grouped using the `groupBy` property.
 */
export const GroupedOptions: StoryObj<SettingsAutocompleteProps<GroupedStoryOption, false, false>> = {
  args: {
    groupBy: (option) => option.group,
    options: [
      {
        id: 'apple',
        label: 'Apple',
        group: 'Fruit',
      },
      {
        id: 'banana',
        label: 'Banana',
        group: 'Fruit',
      },
      {
        id: 'orange',
        label: 'Orange',
        group: 'Fruit',
      },
      {
        id: 'broccoli',
        label: 'Broccoli',
        group: 'Vegetable',
      },
      {
        id: 'carrot',
        label: 'Carrot',
        group: 'Vegetable',
      },
      {
        id: 'onion',
        label: 'Onion',
        group: 'Vegetable',
      },
    ],
  },
};
