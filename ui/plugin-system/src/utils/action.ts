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

export type Action = 'create' | 'read' | 'update';

export function getTitleAction(action: Action, isDraft: boolean): string {
  if (action === 'read') return 'View';
  if (isDraft && action === 'create') return 'Add';
  if (!isDraft && action === 'create') return 'Create';
  if (action === 'update') return 'Edit';
  return '';
}

export function getSubmitText(action: Action, isDraft: boolean): string {
  if (isDraft && action === 'create') return 'Add';
  if (isDraft && action === 'update') return 'Apply';
  if (!isDraft) return 'Save';
  return '';
}
