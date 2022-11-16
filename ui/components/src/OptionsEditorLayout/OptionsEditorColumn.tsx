// Copyright 2022 The Perses Authors
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

import { Grid, Stack } from '@mui/material';

export type OptionsEditorColumnProps = {
  /**
   * Components to render in the column. These will usually be
   * `OptionsEditorGroup` components.
   */
  children: React.ReactNode;
};

/**
 * Lay out content in a column within panel options.
 */
export const OptionsEditorColumn = ({ children }: OptionsEditorColumnProps) => {
  return (
    <Grid item xs={4}>
      <Stack spacing={3}>{children}</Stack>
    </Grid>
  );
};
