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

// This code is largely a copy of the following file from happo with some
// adjustments to work for our specific use case (v7 version of storybook) and
// to more easily support taking pictures of light and dark mode.
// We may need to keep an eye on the original source to keep things working.
// Please comment specific areas of customization to make it easier to handle
// future changes.
// https://github.com/happo/happo-plugin-storybook/blob/master/src/register.js

import { addons } from '@storybook/addons';

// CUSTOMIZATION: part of adding ability to build a story for each theme.
import { DARK_MODE_EVENT_NAME } from 'storybook-dark-mode';

const time = window.happoTime || {
  originalDateNow: Date.now,
  originalSetTimeout: window.setTimeout.bind(window),
};

const ASYNC_TIMEOUT = 100;
const WAIT_FOR_TIMEOUT = 2000;

// CUSTOMIZATION: part of adding ability to build a story for each theme.
const DEFAULT_THEMES = ['light', 'dark'];

let examples;
let currentIndex = 0;
let defaultDelay;

// CUSTOMIZATION: part of adding ability to build a story for each theme.
async function setTheme(channel, theme) {
  return new Promise((resolve) => {
    const isDarkMode = theme === 'dark';

    // Listen for dark mode to change and resolve.
    channel.once(DARK_MODE_EVENT_NAME, () => {
      resolve();
    });
    // Change the theme.
    channel.emit(DARK_MODE_EVENT_NAME, isDarkMode);
  });
}

async function waitForSomeContent(elem, start = time.originalDateNow()) {
  const html = elem.innerHTML.trim();
  const duration = time.originalDateNow() - start;
  if (html === '' && duration < ASYNC_TIMEOUT) {
    return new Promise((resolve) => time.originalSetTimeout(() => resolve(waitForSomeContent(elem, start)), 10));
  }
  return html;
}

async function waitForWaitFor(waitFor, start = time.originalDateNow()) {
  const duration = time.originalDateNow() - start;
  if (!waitFor() && duration < WAIT_FOR_TIMEOUT) {
    return new Promise((resolve) => time.originalSetTimeout(() => resolve(waitForWaitFor(waitFor, start)), 50));
  }
}

async function getExamples() {
  const storyStore = window.__STORYBOOK_CLIENT_API__._storyStore;

  if (!storyStore.extract) {
    throw new Error('Missing Storybook Client API');
  }
  if (storyStore.cacheAllCSFFiles) {
    await storyStore.cacheAllCSFFiles();
  }
  const result = Object.values(storyStore.extract())
    .map(({ id, kind, story, parameters }) => {
      if (parameters.happo === false) {
        return;
      }
      let delay = defaultDelay;
      let waitForContent;
      let waitFor;
      let beforeScreenshot;
      let afterScreenshot;
      let targets;

      // CUSTOMIZATION: part of adding ability to build a story for each theme.
      let themes = DEFAULT_THEMES;

      if (typeof parameters.happo === 'object' && parameters.happo !== null) {
        delay = parameters.happo.delay || defaultDelay;
        waitForContent = parameters.happo.waitForContent;
        waitFor = parameters.happo.waitFor;
        beforeScreenshot = parameters.happo.beforeScreenshot;
        afterScreenshot = parameters.happo.afterScreenshot;
        targets = parameters.happo.targets;

        // CUSTOMIZATION: part of adding ability to build a story for each theme.
        themes = parameters.happo.themes || DEFAULT_THEMES;
      }
      return {
        component: kind,
        variant: story,
        storyId: id,
        delay,
        waitForContent,
        waitFor,
        beforeScreenshot,
        afterScreenshot,
        targets,

        // CUSTOMIZATION: part of adding ability to build a story for each theme.
        themes,
      };
    })
    // CUSTOMIZATION: part of adding ability to build a story for each theme.
    .reduce((result, { themes, ...otherExample }) => {
      if (!themes) {
        result.push(otherExample);
      } else {
        themes.forEach((theme) => {
          result.push({
            ...otherExample,
            variant: `${otherExample.variant} [${theme}]`,
            theme,
          });
        });
      }

      return result;
    }, [])
    .filter(Boolean);

  return result;
}

function filterExamples(all) {
  if (initConfig.chunk) {
    const examplesPerChunk = Math.ceil(all.length / initConfig.chunk.total);
    const startIndex = initConfig.chunk.index * examplesPerChunk;
    const endIndex = startIndex + examplesPerChunk;
    all = all.slice(startIndex, endIndex);
  }
  if (initConfig.targetName) {
    all = all.filter((e) => {
      if (!e.targets || !Array.isArray(e.targets)) {
        // This story hasn't been filtered for specific targets
        return true;
      }
      return e.targets.includes(initConfig.targetName);
    });
  }
  return all;
}

let initConfig = {};

window.happo = {};

window.happo.init = (config) => {
  initConfig = config;
};

window.happo.nextExample = async () => {
  if (!examples) {
    examples = filterExamples(await getExamples());
  }
  if (currentIndex >= examples.length) {
    return;
  }
  const { component, variant, storyId, delay, waitForContent, waitFor, beforeScreenshot, theme } =
    examples[currentIndex];

  try {
    const docsRootElement = document.getElementById('docs-root');
    if (docsRootElement) {
      docsRootElement.setAttribute('data-happo-ignore', 'true');
    }
    // CUSTOMIZATION: adjusted the id to look for because this changed in
    // storybook v7.
    const rootElement = document.getElementById('storybook-root');
    rootElement.setAttribute('data-happo-ignore', 'true');

    const { afterScreenshot } = examples[currentIndex - 1] || {};
    if (typeof afterScreenshot === 'function') {
      try {
        await afterScreenshot({ rootElement });
      } catch (e) {
        console.error('Failed to invoke afterScreenshot hook', e);
      }
    }
    const channel = addons.getChannel();
    channel.emit('setCurrentStory', {
      kind: component,
      story: variant,
      storyId,
    });

    await new Promise((resolve) => time.originalSetTimeout(resolve, 0));

    await waitForSomeContent(rootElement);

    // CUSTOMIZATION: part of adding ability to build a story for each theme.
    await setTheme(channel, theme);

    if (/sb-show-errordisplay/.test(document.body.className)) {
      // It's possible that the error is from unmounting the previous story. We
      // can try re-rendering in this case.
      channel.emit('forceReRender');
      await waitForSomeContent(rootElement);
    }
    if (beforeScreenshot && typeof beforeScreenshot === 'function') {
      try {
        await beforeScreenshot({ rootElement });
      } catch (e) {
        console.error('Failed to invoke beforeScreenshot hook', e);
      }
    }
    await new Promise((resolve) => time.originalSetTimeout(resolve, delay));
    if (waitFor) {
      await waitForWaitFor(waitFor);
    }
    return { component, variant, waitForContent };
  } catch (e) {
    console.warn(e);
    return { component, variant };
  } finally {
    currentIndex++;
  }
};

export const setDefaultDelay = (delay) => {
  defaultDelay = delay;
};
export const isHappoRun = () => window.__IS_HAPPO_RUN;
