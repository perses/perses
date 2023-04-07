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

import { rest, RequestHandler } from 'msw';
import qs from 'qs';

type MockQueryRangeQueryConfig = {
  query: string;
  response: {
    status?: 200;
    body: Record<string, unknown> | string | number;
  };
};

type MockQueryRangeConfig = {
  queries: MockQueryRangeQueryConfig[];
};

/**
 * Mock responses from '/query_range' by the query parameter in the
 * request. Useful for stabilizing charts when taking screenshots.
 */
export function mockQueryRangeRequests({ queries }: MockQueryRangeConfig): RequestHandler[] {
  return [
    rest.post('*/query_range', async (req, res, ctx) => {
      // MSW has some roadmap work to better support form data, but does not
      // currently handle it well, so we need to parse the post data to get
      // the values we care about.
      const rawPostData = await req.text();
      const requestPostData = qs.parse(rawPostData);

      const requestQuery = typeof requestPostData === 'object' ? requestPostData['query'] : undefined;
      const mockQuery = queries.find((mockQueryConfig) => mockQueryConfig.query === requestQuery);

      console.log(requestQuery);
      console.log(queries);

      if (mockQuery) {
        // Found a config for mocking this query. Return the mock response.
        return res(ctx.json(mockQuery.response.body));
      }

      // No config found. Let the request continue normally.
      return req.passthrough();
    }),
  ];
}
