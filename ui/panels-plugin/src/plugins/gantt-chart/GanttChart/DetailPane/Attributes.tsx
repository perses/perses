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

import { List, ListItem, ListItemText } from '@mui/material';
import { TraceAttribute, TraceAttributeValue } from '@perses-dev/core';

export interface AttributeListProps {
  attributes: TraceAttribute[];
}

export function AttributeList(props: AttributeListProps) {
  const { attributes } = props;

  return (
    <>
      <List>
        {attributes.map((attribute, i) => (
          <AttributeItem key={i} attribute={attribute} />
        ))}
      </List>
    </>
  );
}

export interface AttributeItemProps {
  attribute: TraceAttribute;
}

function AttributeItem(props: AttributeItemProps) {
  const { attribute } = props;

  return (
    <ListItem disablePadding>
      <ListItemText
        primary={attribute.key}
        secondary={renderAttributeValue(attribute.value)}
        primaryTypographyProps={{ variant: 'h5' }}
        secondaryTypographyProps={{ variant: 'body1', sx: { wordBreak: 'break-word' } }}
      />
    </ListItem>
  );
}

function renderAttributeValue(value: TraceAttributeValue): string {
  if ('stringValue' in value) return value.stringValue;
  if ('intValue' in value) return value.intValue;
  if ('boolValue' in value) return value.boolValue.toString();
  if ('arrayValue' in value) return value.arrayValue.values.map(renderAttributeValue).join(', ');
  return 'unknown';
}
