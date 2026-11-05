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

import type { MatchingResult } from '@nexucis/kvsearch';

import { getDisplayNameMatch, getTagDisplayValues } from './model';

describe('getTagDisplayValues', () => {
  it('shows matching tags first while preserving their order', () => {
    const tags = ['backend', 'prod', 'infra', 'frontend', 'ops'];
    const matchingTags = ['INFRA', 'PROD'];
    const result = getTagDisplayValues(tags, matchingTags);
    expect(result.visibleTags).toEqual(['prod', 'infra', 'backend']);
    expect(result.hiddenTagsCount).toBe(2);
    expect(result.hasAnyTags).toBe(true);
  });

  it('handles resources without tags', () => {
    const result = getTagDisplayValues(undefined, []);
    expect(result.visibleTags).toEqual([]);
    expect(result.hiddenTagsCount).toBe(0);
    expect(result.hasAnyTags).toBe(false);
  });

  it('removes duplicates without hiding tags unnecessarily', () => {
    const result = getTagDisplayValues(['backend', 'infra', 'backend', 'prod'], ['infra']);
    expect(result.visibleTags).toEqual(['infra', 'backend', 'prod']);
    expect(result.hiddenTagsCount).toBe(0);
    expect(result.hasAnyTags).toBe(true);
  });
});

describe('getDisplayNameMatch', () => {
  it('highlights metadata.name when display name is missing', () => {
    const matches: MatchingResult[] = [
      {
        path: ['metadata', 'name'],
        value: 'production',
        intervals: [{ from: 0, to: 4 }],
      },
    ];

    expect(getDisplayNameMatch('production', undefined, matches)).toEqual({
      value: 'production',
      intervals: [{ from: 0, to: 4 }],
    });
  });

  it('highlights the display name when available', () => {
    const matches: MatchingResult[] = [
      {
        path: ['metadata', 'name'],
        value: 'production',
        intervals: [{ from: 0, to: 4 }],
      },
      {
        path: ['spec', 'display', 'name'],
        value: 'Production Metrics',
        intervals: [{ from: 11, to: 18 }],
      },
    ];
    expect(getDisplayNameMatch('production', 'Production Metrics', matches)).toEqual({
      value: 'Production Metrics',
      intervals: [{ from: 11, to: 18 }],
    });
  });

  it('does not use metadata.name intervals for a different display name', () => {
    const matches: MatchingResult[] = [
      {
        path: ['metadata', 'name'],
        value: 'production',
        intervals: [{ from: 0, to: 4 }],
      },
    ];

    expect(getDisplayNameMatch('production', 'Production Metrics', matches)).toEqual({
      value: 'Production Metrics',
      intervals: [],
    });
  });

  it('handles resources matching only through tags', () => {
    const matches: MatchingResult[] = [
      {
        path: ['metadata', 'tags', '0'],
        value: 'infra',
        intervals: [{ from: 0, to: 5 }],
      },
    ];

    expect(getDisplayNameMatch('production', undefined, matches)).toEqual({
      value: 'production',
      intervals: [],
    });
  });

  it('falls back to metadata.name when the display name is empty', () => {
    expect(getDisplayNameMatch('production', '', undefined)).toEqual({
      value: 'production',
      intervals: [],
    });
  });
});
