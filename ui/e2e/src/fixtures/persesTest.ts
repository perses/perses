// Copyright The Perses Authors
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

import { expect, test as testBase } from '@playwright/test';

type PersesTestFixtures = {
  /**
   * Violations of the Content-Security-Policy reported by the pages opened during the test.
   * The Perses server sends a policy with the pages of the UI: the test fails when the UI, or a plugin, does something
   * that the policy blocks.
   */
  contentSecurityPolicyViolations: string[];
};

const REPORT_VIOLATION_BINDING = '__persesReportContentSecurityPolicyViolation';

/**
 * Base fixture of the end-to-end tests.
 */
export const test = testBase.extend<PersesTestFixtures>({
  contentSecurityPolicyViolations: [
    async ({ context }, use): Promise<void> => {
      const violations: string[] = [];
      await context.exposeBinding(REPORT_VIOLATION_BINDING, (_source, violation: string) => {
        violations.push(violation);
      });
      await context.addInitScript((binding) => {
        document.addEventListener('securitypolicyviolation', (event) => {
          const report = (window as unknown as Record<string, (violation: string) => void>)[binding];
          report?.(`${event.effectiveDirective}: ${event.blockedURI} (${event.sourceFile}:${event.lineNumber})`);
        });
      }, REPORT_VIOLATION_BINDING);

      // oxlint-disable-next-line react/rules-of-hooks -- Playwright's fixture callback is not a React component.
      await use(violations);

      expect(
        violations,
        `${violations.length} Content-Security-Policy violations seen while running test.`,
      ).toHaveLength(0);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
