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

import { Box, Divider, IconButton, Tab, Tabs, Typography } from '@mui/material';
import { Span } from '@perses-dev/core';
import { useState } from 'react';
import CloseIcon from 'mdi-material-ui/Close';
import { AttributeList } from './Attributes';
import { SpanEventList } from './SpanEvents';

export interface DetailPaneProps {
  rootSpan: Span;
  span: Span;
  onCloseBtnClick: () => void;
}

/**
 * DetailPane renders a sidebar showing the span attributes etc.
 */
export function DetailPane(props: DetailPaneProps) {
  const { rootSpan, span, onCloseBtnClick } = props;
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <IconButton sx={{ float: 'right' }} onClick={onCloseBtnClick}>
        <CloseIcon />
      </IconButton>
      <Typography sx={{ wordBreak: 'break-word' }}>{span.resource.serviceName}</Typography>
      <Typography variant="h2" sx={{ wordBreak: 'break-word' }}>
        {span.name}
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, tab) => setTab(tab)}>
          <Tab sx={{ p: 0 }} value={0} label="Attributes" />
          {span.events.length > 0 && <Tab value={1} label="Events" />}
        </Tabs>
      </Box>
      {tab === 0 && (
        <>
          {span.attributes.length > 0 && <AttributeList attributes={span.attributes} />}
          {span.attributes.length > 0 && <Divider />}
          <AttributeList attributes={span.resource.attributes} />
        </>
      )}
      {tab === 1 && <SpanEventList rootSpan={rootSpan} span={span} />}
    </Box>
  );
}
