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

import { Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface StorySectionProps {
  title: string;
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
  children: ReactNode;
}

/**
 * Simple helper component to lay out more complex stories where you want to
 * lay out a combination of examples with a title and content.
 */
export function StorySection({ title, level, children }: StorySectionProps) {
  return (
    <div>
      <Typography variant={level} gutterBottom>
        {title}
      </Typography>
      {children}
    </div>
  );
}
