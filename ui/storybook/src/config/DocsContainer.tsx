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

import React, { FunctionComponent } from 'react';
import { DocsContainer as BaseContainer, DocsContainerProps as BaseDocsContainerProps } from '@storybook/addon-docs';
import { ReactFramework } from '@storybook/react';
import { useDarkMode } from 'storybook-dark-mode';
import { themes } from '@storybook/theming';

export interface DocsContainerProps extends BaseDocsContainerProps<ReactFramework> {
  children: React.ReactNode;
}
// Force the container to know what framework it is working with. The types
// for this look better in the main branch in storybook, so hopefully we can
// do something more elegant here in the future.
const BaseContainerReact = BaseContainer as FunctionComponent<DocsContainerProps>;

// Solution for having dark mode on docs page
// https://github.com/hipstersmoothie/storybook-dark-mode/issues/127#issuecomment-1070524402
export const DocsContainer = ({ children, context }: DocsContainerProps) => {
  const dark = useDarkMode();

  return (
    <BaseContainerReact
      context={{
        ...context,
        storyById: (id) => {
          const storyContext = context.storyById(id);
          return {
            ...storyContext,
            parameters: {
              ...storyContext?.parameters,
              docs: {
                ...storyContext?.parameters?.docs,
                theme: dark ? themes.dark : themes.light,
              },
            },
          };
        },
      }}
    >
      {children}
    </BaseContainerReact>
  );
};
