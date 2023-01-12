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
