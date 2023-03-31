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

import { useTheme } from '@mui/material';
import { useMemo, useEffect } from 'react';
import { Decorator } from '@storybook/react';

// Much of the code for this decorator is cribbed from the backgrounds addon. We cannot
// use that addon directly because it requires hardcoding the colors instead
// of setting them dynamically based on a theme. It is possible that we'll
// need to adjust this file to keep in sync with that addon's code when doing major
// version bumps of storybook.
// https://github.com/storybookjs/storybook/blob/main/addons/backgrounds/src/decorators/withBackground.ts

export const addBackgroundStyle = (selector: string, css: string, storyId: string | null) => {
  const existingStyle = document.getElementById(selector) as HTMLElement;
  if (existingStyle) {
    if (existingStyle.innerHTML !== css) {
      existingStyle.innerHTML = css;
    }
  } else {
    const style = document.createElement('style') as HTMLElement;
    style.setAttribute('id', selector);
    style.innerHTML = css;

    const gridStyleSelector = `addon-backgrounds-grid${storyId ? `-docs-${storyId}` : ''}`;
    // If grids already exist, we want to add the style tag BEFORE it so the background doesn't override grid
    // NOTE: our modifications do not seem to work quite right with the grid
    // selector.
    const existingGridStyle = document.getElementById(gridStyleSelector) as HTMLElement;
    if (existingGridStyle && existingGridStyle.parentElement) {
      existingGridStyle.parentElement?.insertBefore(style, existingGridStyle);
    } else {
      document.head.appendChild(style);
    }
  }
};

export const WithBackground: Decorator = (Story, context) => {
  const theme = useTheme();

  const maybeGlobalBg = context.globals.bgColor;
  const globalBg = typeof maybeGlobalBg === 'string' ? maybeGlobalBg : '';

  const themeBg = theme.palette.background[globalBg as keyof typeof theme.palette.background];
  const selector = context.viewMode === 'docs' ? `#anchor--${context.id} .docs-story` : '.sb-show-main';

  const backgroundStyles = useMemo(() => {
    const transitionStyle = 'transition: background-color 0.3s;';
    return `
      ${selector} {
        background: ${themeBg} !important;
        ${transitionStyle}
      }
    `;
  }, [themeBg, selector]);

  useEffect(() => {
    // Note that we use `internal` instead of `addon` in these selectors to avoid
    // this accidentally fighting with the real background addon.
    const selectorId =
      context.viewMode === 'docs' ? `internal-backgrounds-docs-${context.id}` : `internal-backgrounds-color`;

    addBackgroundStyle(selectorId, backgroundStyles, context.viewMode === 'docs' ? context.id : null);
  }, [backgroundStyles, context]);

  return <Story />;
};
