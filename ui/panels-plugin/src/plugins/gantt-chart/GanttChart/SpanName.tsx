// Copyright 2024 The Perses Authors
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

import { Box, Stack } from '@mui/material';
import { Span } from './model';
import { SpanIndent } from './SpanIndent';

export interface SpanNameProps {
  span: Span;
}

/**
 * SpanName renders the entire left column of a SpanRow, i.e. the hierarchy and the service and span name
 */
export function SpanName(props: SpanNameProps) {
  const { span } = props;

  let parent = span.parent;
  const indents = [<SpanIndent key="lastIndent" span={span} parentSpanId={parent?.spanId ?? ''} isLastIndent={true} />];
  while (parent) {
    parent = parent.parent;
    indents.unshift(<SpanIndent key={parent?.spanId ?? ''} span={span} parentSpanId={parent?.spanId ?? ''} />);
  }

  return (
    <Stack direction="row" alignItems="center" sx={{ width: '25%' }}>
      {indents}
      <Box>
        <strong style={{ color: span.resource.color }}>{span.resource.serviceName}:</strong> {span.spanName}
      </Box>
    </Stack>
  );
}
