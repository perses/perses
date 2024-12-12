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

import { Subject } from '@perses-dev/core';

// subjectsSummary returns a formatted string of a list of subjects where max is the amount of subject to show with their name
export function subjectsSummary(subjects: Subject[], max: number): string {
  if (subjects.length === 0) {
    return 'No subjects';
  }
  if (subjects.length < max) {
    return subjects.map((subject) => subject.name).join(', ');
  }
  let result = '';
  subjects.forEach((subject, index) => {
    if (index < max) {
      result += `${subject.name}, `;
    }
  });
  result += `+${subjects.length - max} others`;
  return result;
}
