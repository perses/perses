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

import { useState } from 'react';
import { Stack, TextField, Button, Box, IconButton } from '@mui/material';
import TrashIcon from 'mdi-material-ui/TrashCan';

export function MatcherEditor(props: { initialMatchers?: string[]; onChange: (matchers: string[]) => void }) {
  const [matchers, setMatchers] = useState<string[]>(props.initialMatchers ?? []);
  return (
    <Stack spacing={1}>
      {matchers.map((matcher, index) => (
        <Box key={index} display="flex">
          <TextField
            fullWidth
            onBlur={() => {
              props.onChange(matchers);
            }}
            label="Series Selector"
            value={matcher}
            onChange={(e) => {
              const newMatchers = [...matchers];
              newMatchers[index] = e.target.value;
              setMatchers(newMatchers);
            }}
          />
          <IconButton
            onClick={() => {
              const newMatchers = [...matchers];
              newMatchers.splice(index, 1);
              setMatchers(newMatchers);
            }}
          >
            <TrashIcon />
          </IconButton>
        </Box>
      ))}
      <Box>
        <Button
          fullWidth={false}
          variant="outlined"
          onClick={() => {
            setMatchers([...matchers, '']);
          }}
        >
          Add Series Selector
        </Button>
      </Box>
    </Stack>
  );
}
