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

import { StatusError } from '@perses-dev/core';
import { refreshToken } from './auth-client';

export function enableRefreshFetch(): void {
  global.fetch = new Proxy(global.fetch, {
    apply: function (target, that, args: Parameters<typeof global.fetch>): Promise<Response> {
      return target
        .apply(that, args)
        .then((res) => {
          if (res.status === 401) {
            return refreshToken()
              .then(() => {
                return target.apply(that, args);
              })
              .catch((refreshError: StatusError) => {
                throw refreshError;
              });
          }
          return res;
        })
        .catch((error: StatusError) => {
          throw error;
        });
    },
  });
}

export async function fetchJson<T>(...args: Parameters<typeof global.fetch>): Promise<T> {
  const response = await fetch(...args);
  const json: T = await response.json();
  return json;
}
