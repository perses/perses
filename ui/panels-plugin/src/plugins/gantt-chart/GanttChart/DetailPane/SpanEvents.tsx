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
import { formatDuration } from '../utils';
import { AttributeList } from './Attributes';

export interface SpanEventListProps {
  rootSpan: Span;
  span: Span;
}

export function SpanEventList(props: SpanEventListProps) {
  const { rootSpan, span } = props;

  return (
    <>
      {span.events
        .sort((a, b) => a.timeUnixMs - b.timeUnixMs)
        .map((event, i) => (
          <SpanEventItem key={i} rootSpan={rootSpan} event={event} />
        ))}
    </>
  );
}

export interface SpanEventItemProps {
  rootSpan: Span;
  event: SpanEvent;
}

function SpanEventItem(props: SpanEventItemProps) {
  const { rootSpan, event } = props;
  const relativeTime = event.timeUnixMs - rootSpan.startTimeUnixMs;

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
