// Copyright 2022 The Perses Authors
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
 * Calls `global.fetch`, but throws a `FetchError` for non-200 responses.
 */
export async function fetch(...args: Parameters<typeof global.fetch>) {
  const response = await global.fetch(...args);
  if (response.ok === false) {
    throw new FetchError(response);
  }
  return response;
}

/**
 * Calls `global.fetch` and throws a `FetchError` on non-200 responses, but also
 * decodes the response body as JSON, casting it to type `T`. Returns the
 * decoded body.
 */
export async function fetchJson<T>(...args: Parameters<typeof global.fetch>) {
  const response = await fetch(...args);
  const json: T = await response.json();
  return json;
}

/**
 * Error thrown when fetch returns a non-200 response.
 */
export class FetchError extends Error {
  constructor(readonly response: Response) {
    super(`${response.status} ${response.statusText}`);
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}
