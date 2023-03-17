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

const { RemoteBrowserTarget } = require('happo.io');
const happoPluginTypescript = require('happo-plugin-typescript');
const happoPluginStorybook = require('happo-plugin-storybook')

module.exports = {
  apiKey: process.env.HAPPO_API_KEY,
  apiSecret: process.env.HAPPO_API_SECRET,
  project: 'perses-storybook',

  plugins: [
    happoPluginTypescript(),
    happoPluginStorybook({
      configDir: 'src/config',
      outputDir: 'storybook-static',
      usePrebuiltPackage: true
    }),
  ],

  targets: {
    'chrome-desktop': new RemoteBrowserTarget('chrome', {
      // Keep this in sync with the viewport setting in `base.playwright.config.ts` 
      // for consistency for canvas elements, which are converted into images when 
      // run in playwright and sent to happo.
      viewport: '1200x800',
    }),
  },
};