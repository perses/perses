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

import type { Subject } from '@perses-dev/client';

import { subjectsSummary } from './role';

function makeSubjects(count: number): Subject[] {
  return Array.from({ length: count }, (_, i) => ({ kind: 'User', name: `user${i + 1}` }));
}

describe('subjectsSummary', () => {
  it('returns a placeholder when there are no subjects', () => {
    expect(subjectsSummary([], 5)).toBe('No subjects');
  });

  it('lists every subject when there are fewer than max', () => {
    expect(subjectsSummary(makeSubjects(2), 5)).toBe('user1, user2');
  });

  it('lists every subject without an "others" suffix when there are exactly max', () => {
    expect(subjectsSummary(makeSubjects(5), 5)).toBe('user1, user2, user3, user4, user5');
  });

  it('truncates to max subjects and counts the others when there are more than max', () => {
    expect(subjectsSummary(makeSubjects(7), 5)).toBe('user1, user2, user3, user4, user5, +2 others');
  });
});
