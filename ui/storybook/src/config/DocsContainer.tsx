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

import { DocsContainer as BaseContainer } from '@storybook/addon-docs';
import { useDarkMode } from 'storybook-dark-mode';
import { themes } from '@storybook/theming';

// Doing this instead of using the exported `DocsContainerProps` because it is
// missing the `children` property (they modify it to add `children` when
// using it in the `DocsContainer` definition).
type DocsContainerProps = React.ComponentProps<typeof BaseContainer>;

// Solution for having dark mode on docs page combo of the following:
// https://github.com/hipstersmoothie/storybook-dark-mode/issues/127#issuecomment-1070524402
// https://github.com/hipstersmoothie/storybook-dark-mode/issues/205
export const DocsContainer = ({ children, context }: DocsContainerProps) => {
  const isDarkMode = useDarkMode();

  return (
    <BaseContainer context={context} theme={isDarkMode ? themes.dark : themes.light}>
      {children}
    </BaseContainer>
  );
};
