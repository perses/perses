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

import { useEffect } from 'react';
import type { Params } from 'react-router-dom';
import { useMatches } from 'react-router-dom';

export interface PageTitleHandle {
  title: string | ((params: Params) => string | undefined);
}

function isPageTitleHandle(handle: unknown): handle is PageTitleHandle {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    'title' in handle &&
    (typeof handle.title === 'string' || typeof handle.title === 'function')
  );
}

/**
 * Combines route titles from the most specific view to its parents.
 * TODO: replace by React 19 native support for titles when available.
 */

export function PageTitle(): null {
  const matches = useMatches();
  const titles = matches.flatMap(({ handle, params }) => {
    if (!isPageTitleHandle(handle)) return [];
    const title = typeof handle.title === 'function' ? handle.title(params) : handle.title;
    return title ? [title] : [];
  });
  const title = [...titles.toReversed(), 'Perses'].join(' | ');

  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
}
