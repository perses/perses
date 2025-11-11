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

/**
 * Calls `globalThis.fetch` and determines which type of error to show for non-200 responses.
 */
export async function fetch(...args: Parameters<typeof globalThis.fetch>): Promise<Response> {
  const response = await globalThis.fetch(...args);
  if (response.ok === false) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = await response.clone().json();
      if (json.error) {
        throw new UserFriendlyError(json.error, response.status);
      }
      if (json.message) {
        throw new UserFriendlyError(json.message, response.status);
      }
    }

    const text = await response.clone().text();
    if (text) {
      throw new UserFriendlyError(text, response.status);
    }
    throw new FetchError(response);
  }
  return response;
}

/**
 * Calls `globalThis.fetch` and throws a `FetchError` on non-200 responses, but also
 * decodes the response body as JSON, casting it to type `T`. Returns the
 * decoded body.
 */
export async function fetchJson<T>(...args: Parameters<typeof globalThis.fetch>): Promise<T> {
  const response = await fetch(...args);
  if (!response.ok) {
    throw new FetchError(response);
  }
  return await response.json();
}

export interface StatusError extends Error {
  status: number;
}

/**
 * Error thrown when fetch returns a non-200 response.
 */
export class FetchError extends Error implements StatusError {
  status: number;
  constructor(response: Readonly<Response>) {
    super(`${response.status} ${response.statusText}`);
    this.status = response.status;
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}

/**
 * General error type for an error that has a message that is OK to show to the end user.
 */
export class UserFriendlyError extends Error implements StatusError {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, UserFriendlyError.prototype);
  }
}
