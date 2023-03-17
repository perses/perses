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

import { Locator } from '@playwright/test';

/**
 * Wait for all animations to complete on the specified element. Useful for
 * things like waiting for a panel to finish animating in, so that everything is
 * visible and clicks target the right location on the page.
 */
export async function waitForAnimations(container: Locator) {
  // Wait for all animations to complete.
  await container.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
}
