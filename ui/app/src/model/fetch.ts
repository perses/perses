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

const JWT_COOKIES = ['jwtPayload', 'jwtSignature', 'jwtRefreshToken', 'activeOrganization'];

// Delete a cookie by setting its expiration date to the past
function deleteCookie(name: string): void {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

export function enableRefreshFetch(): void {
  globalThis.fetch = new Proxy(globalThis.fetch, {
    apply: async function (target, that, args: Parameters<typeof globalThis.fetch>): Promise<Response> {
      return target
        .apply(that, args)
        .then((res) => {
          if (res.status === 401) {
            JWT_COOKIES.forEach(deleteCookie);
            return res;
          }
          return res;
        })
        .catch((error: StatusError) => {
          throw error;
        });
    },
  });
}
