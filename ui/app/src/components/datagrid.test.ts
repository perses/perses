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

import { getDataGridInitialStateSortByDisplayName, getDataGridInitialStateSortByName } from './datagrid';

describe('data grid defaults', () => {
  it('uses the configured page size in initial state', () => {
    expect(getDataGridInitialStateSortByName(25).pagination?.paginationModel?.pageSize).toBe(25);
    expect(getDataGridInitialStateSortByDisplayName(50).pagination?.paginationModel?.pageSize).toBe(50);
  });
});
