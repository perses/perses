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

import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { Span, SpanEvent } from '@perses-dev/core';
import ExpandMoreIcon from 'mdi-material-ui/ChevronDown';
import { ReactElement } from 'react';
import { formatDuration } from '../utils';
import { GanttTrace } from '../trace';
import { AttributeList } from './Attributes';

export interface SpanEventListProps {
  trace: GanttTrace;
  span: Span;
}

export function SpanEventList(props: SpanEventListProps): ReactElement {
  const { trace, span } = props;

  return (
    <>
      {span.events
        .sort((a, b) => a.timeUnixMs - b.timeUnixMs)
        .map((event, i) => (
          <SpanEventItem key={i} trace={trace} event={event} />
        ))}
    </>
  );
}

interface SpanEventItemProps {
  trace: GanttTrace;
  event: SpanEvent;
}

function SpanEventItem(props: SpanEventItemProps): ReactElement {
  const { trace, event } = props;
  const relativeTime = event.timeUnixMs - trace.startTimeUnixMs;

  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{formatDuration(relativeTime)}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="subtitle1">{event.name}</Typography>
        <AttributeList attributes={event.attributes} />
      </AccordionDetails>
    </Accordion>
  );
}
