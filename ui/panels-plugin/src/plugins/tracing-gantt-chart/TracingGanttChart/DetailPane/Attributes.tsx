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

import { ReactElement, useMemo } from 'react';
import { Link, List, ListItem, ListItemText } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { TraceAttribute, TraceAttributeValue } from '@perses-dev/core';

export type AttributeLinks = Record<string, (attributes: Record<string, TraceAttributeValue>) => string>;

export interface AttributeListProps {
  attributeLinks?: AttributeLinks;
  attributes: TraceAttribute[];
}

export function AttributeList(props: AttributeListProps): ReactElement {
  const { attributeLinks, attributes } = props;
  const attributesMap = useMemo(
    () => Object.fromEntries(attributes.map((attr) => [attr.key, attr.value])),
    [attributes]
  );

  return (
    <>
      <List>
        {attributes
          .sort((a, b) => a.key.localeCompare(b.key))
          .map((attribute, i) => (
            <AttributeItem key={i} attribute={attribute} linkTo={attributeLinks?.[attribute.key]?.(attributesMap)} />
          ))}
      </List>
    </>
  );
}

interface AttributeItemProps {
  attribute: TraceAttribute;
  linkTo?: string;
}

function AttributeItem(props: AttributeItemProps): ReactElement {
  const { attribute, linkTo } = props;

  const value = linkTo ? (
    <Link component={RouterLink} to={linkTo}>
      {renderAttributeValue(attribute.value)}
    </Link>
  ) : (
    renderAttributeValue(attribute.value)
  );

  return (
    <ListItem disablePadding>
      <ListItemText
        primary={attribute.key}
        secondary={value}
        primaryTypographyProps={{ variant: 'h5' }}
        secondaryTypographyProps={{ variant: 'body1', sx: { wordBreak: 'break-word' } }}
      />
    </ListItem>
  );
}

function renderAttributeValue(value: TraceAttributeValue): string {
  if ('stringValue' in value) return value.stringValue.length > 0 ? value.stringValue : '<empty string>';
  if ('intValue' in value) return value.intValue;
  if ('boolValue' in value) return value.boolValue.toString();
  if ('arrayValue' in value) return value.arrayValue.values.map(renderAttributeValue).join(', ');
  return 'unknown';
}
