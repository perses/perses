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

import { Box, List, ListItem, ListItemText, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import { Attribute, AttributeValue, Span } from './model';

export interface DetailPaneProps {
  span: Span;
}

/**
 * DetailPane renders a sidebar showing the span attributes etc.
 */
export function DetailPane(props: DetailPaneProps) {
  const { span } = props;
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography>{span.resource.serviceName}</Typography>
      <Typography variant="h2">{span.spanName}</Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, tab) => setTab(tab)}>
          <Tab sx={{ p: 0 }} value={0} label="Attributes" />
          <Tab value={1} label="Events" />
          <Tab value={2} label="Links" />
        </Tabs>
      </Box>
      {tab === 0 && <AttributeList span={span} />}
      {tab === 1 && <span>Events</span>}
      {tab === 2 && <span>Links</span>}
    </Box>
  );
}

export interface AttributeListProps {
  span: Span;
}

function AttributeList(props: AttributeListProps) {
  const { span } = props;

  return (
    <>
      <List>
        {span.attributes?.map((attribute, i) => <AttributeListItem key={i} attribute={attribute} />)}
        {span.resource.attributes?.map((attribute, i) => <AttributeListItem key={i} attribute={attribute} />)}
      </List>
    </>
  );
}

export interface AttributeListItemProps {
  attribute: Attribute;
}

function AttributeListItem(props: AttributeListItemProps) {
  const { attribute } = props;

  return (
    <ListItem disablePadding>
      <ListItemText
        primary={attribute.key}
        secondary={renderAttributeValue(attribute.value)}
        primaryTypographyProps={{ variant: 'h5' }}
        secondaryTypographyProps={{ variant: 'body1' }}
      />
    </ListItem>
  );
}

function renderAttributeValue(value: AttributeValue): string {
  if ('stringValue' in value) return value.stringValue;
  if ('intValue' in value) return value.intValue;
  if ('boolValue' in value) return value.boolValue.toString();
  if ('arrayValue' in value) return value.arrayValue.values.map(renderAttributeValue).join(', ');
  return 'unknown';
}
