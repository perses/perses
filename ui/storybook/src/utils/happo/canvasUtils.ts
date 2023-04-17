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

  /**
   * Number of canvas elements you expect to see. This can be helpful for
   * validating complex cases with lots of canvas elements.
   */
  expectedCount?: number;
};

/**
 * Wait for canvas element(s) to become stable (i.e. stop changing their contents).
 * Validates stability by waiting for a consistent number of canvases with
 * consistent  `toDataURL` values after a specified `interval`. Will throw an
 * error if stability is not found after the specified `timeout`.
 */
export async function waitForStableCanvas(
  canvasSelector: string,
  { interval = 250, timeout = 5000, expectedCount }: WaitForStableCanvasOptions = {}
) {
  const maxChecks = Math.floor(timeout / interval);

  if (maxChecks < 1) {
    throw new Error('The canvas cannot be checked for stability with the current `interval` and `timeout` options.');
  }

  function getCanvasData() {
    const canvases = document.querySelectorAll<HTMLCanvasElement>(canvasSelector);
    return [...canvases].map((canvas) => canvas?.toDataURL());
  }

  let prevCanvasData = getCanvasData();
  let totalChecks = 0;

  async function checkCanvas() {
    const canvasData = getCanvasData();
    const hasExpectedCount = expectedCount === undefined || expectedCount === canvasData.length;

    if (
      hasExpectedCount &&
      prevCanvasData.length === canvasData.length &&
      JSON.stringify(prevCanvasData) === JSON.stringify(canvasData)
    ) {
      // Helpful for debugging
      console.log(`Canvas stable after ${totalChecks + 1} check(s).`);

      // Data was stable for the interval.
      return;
    } else if (totalChecks + 1 === maxChecks) {
      // Data was not stable and time is up.

      // Console erroring for help with debugging. It will not do anything in
      // happo.
      console.error('Canvas element failed to stabilize.');

      // We return and let happo continue because there isn't a good way to
      // interrupt.
      return;
    } else {
      // data was not stable. Check again.

      // Helpful for debugging
      console.log(`Canvas was not stable after ${totalChecks + 1} check(s). Trying again in ${interval}.`);

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
