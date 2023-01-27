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

function getCanvasDataURL(canvasEl: Locator) {
  return canvasEl.evaluate((node) => {
    if (node instanceof HTMLCanvasElement) {
      return node.toDataURL();
    }
    return undefined;
  });
}

type WaitForStableCanvasOptions = {
  /**
   * Interval in ms to wait before checking the canvas again to see if it is
   * still consistent.
   * @default 250
   */
  interval?: number;

  /**
   * How long to wait overall for the canvas to stabilize before failing.
   * The combination of `timeout` and `interval` impact how many times the
   * canvas can be checked for stability before failing.
   * @default 5000
   */
  timeout?: number;
};

/**
 * Wait for a canvas element to become stable (i.e. stop changing its contents).
 * Validates stability by comparing that the result of `toDataURL` is consistent
 * after a specified `interval`. Will throw an error if stability is not found
 * after the specified `timeout`.
 */
export async function waitForStableCanvas(
  canvasEl: Locator,
  { interval = 300, timeout = 5000 }: WaitForStableCanvasOptions = {}
) {
  const maxChecks = Math.floor(timeout / interval);

  if (maxChecks < 1) {
    throw new Error('The canvas cannot be checked for stability with the current `interval` and `timeout` options.');
  }

  let prevCanvasData = await getCanvasDataURL(canvasEl);
  let totalChecks = 0;

  async function checkCanvas() {
    const canvasData = await getCanvasDataURL(canvasEl);
    if (canvasData && canvasData === prevCanvasData) {
      // Data was stable for the interval.
      return;
    } else if (totalChecks + 1 === maxChecks) {
      // Data was not stable and time is up.
      throw new Error('Canvas element failed to stabilize.');
    } else {
      // data was not stable. Check again.
      totalChecks++;
      prevCanvasData = canvasData;
      await checkCanvasWithTimeout();
    }
  }

  async function checkCanvasWithTimeout() {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        await checkCanvas();
        resolve();
      }, interval);
    });
  }

  await checkCanvasWithTimeout();
}
