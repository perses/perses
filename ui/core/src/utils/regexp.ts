// Copyright 2024 The Perses Authors
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

/**
 * Checks if a string is a regex pattern.
 */
export function isRegexPattern(input: string | null | undefined): boolean {
  return Boolean(input?.startsWith('/'));
}

/**
 * Converts a string to RegExp. Handles both regular strings and regex patterns.
 * For regular strings, creates exact match regex.
 * For patterns like "/pattern/flags", creates corresponding RegExp.
 */
export function createRegexFromString(input: string): RegExp {
  if (!input) {
    throw new Error('Input string cannot be empty');
  }

  if (!isRegexPattern(input)) {
    return new RegExp(`^${input}$`);
  }

  const regexPattern = /^\/(.+)\/([gimy]*)$/;
  const matches = input.match(regexPattern);

  if (!matches) {
    throw new Error(`Invalid regular expression format: ${input}`);
  }

  const [, pattern = '', flags = ''] = matches;

  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    throw new Error(`Failed to create RegExp ${error}`);
  }
}
