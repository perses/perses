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
// adjustments to work for our specific use case (v7 version of storybook).
// https://github.com/happo/happo-plugin-storybook/blob/master/src/register.js

import { addons } from '@storybook/addons';

const time = window.happoTime || {
  originalDateNow: Date.now,
  originalSetTimeout: window.setTimeout.bind(window),
};

const ASYNC_TIMEOUT = 100;
const WAIT_FOR_TIMEOUT = 2000;

let examples;
let currentIndex = 0;
let defaultDelay;

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
  return Object.values(storyStore.extract())
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
      if (typeof parameters.happo === 'object' && parameters.happo !== null) {
        delay = parameters.happo.delay || defaultDelay;
        waitForContent = parameters.happo.waitForContent;
        waitFor = parameters.happo.waitFor;
        beforeScreenshot = parameters.happo.beforeScreenshot;
        afterScreenshot = parameters.happo.afterScreenshot;
        targets = parameters.happo.targets;
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
      };
    })
    .filter(Boolean);
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
  const { component, variant, storyId, delay, waitForContent, waitFor, beforeScreenshot } = examples[currentIndex];

  try {
    const docsRootElement = document.getElementById('docs-root');
    if (docsRootElement) {
      docsRootElement.setAttribute('data-happo-ignore', 'true');
    }
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
