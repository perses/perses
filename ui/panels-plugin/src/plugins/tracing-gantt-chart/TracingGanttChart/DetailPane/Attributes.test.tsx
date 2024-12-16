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

import { render, RenderResult } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { MemoryRouter } from 'react-router-dom';
import { TraceAttributeValue } from '@perses-dev/core';
import { AttributeLinks, AttributeList, AttributeListProps } from './Attributes';

describe('Attributes', () => {
  const renderComponent = (props: AttributeListProps): RenderResult => {
    return render(
      <MemoryRouter>
        <AttributeList {...props} />
      </MemoryRouter>
    );
  };

  it('render stringValues', () => {
    const attributes = [{ key: 'attrkey', value: { stringValue: 'str' } }];
    renderComponent({ attributes });
    expect(screen.getByText('attrkey')).toBeInTheDocument();
    expect(screen.getByText('str')).toBeInTheDocument();
  });

  it('render intValue', () => {
    const attributes = [{ key: 'attrkey', value: { intValue: '123' } }];
    renderComponent({ attributes });
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('render boolValue', () => {
    const attributes = [{ key: 'attrkey', value: { boolValue: false } }];
    renderComponent({ attributes });
    expect(screen.getByText('false')).toBeInTheDocument();
  });

  it('render arrayValue', () => {
    const attributes = [
      { key: 'attrkey', value: { arrayValue: { values: [{ stringValue: 'abc' }, { boolValue: true }] } } },
    ];
    renderComponent({ attributes });
    expect(screen.getByText('abc, true')).toBeInTheDocument();
  });

  it('render an attribute with a link', () => {
    const stringValue = (val?: TraceAttributeValue): string => (val && 'stringValue' in val ? val.stringValue : '');
    const attributeLinks: AttributeLinks = {
      'k8s.pod.name': (attrs) =>
        `/console/ns/${stringValue(attrs['k8s.namespace.name'])}/pod/${stringValue(attrs['k8s.pod.name'])}/detail`,
    };
    const attributes = [
      { key: 'k8s.namespace.name', value: { stringValue: 'testing' } },
      { key: 'k8s.pod.name', value: { stringValue: 'hotrod' } },
    ];

    renderComponent({ attributeLinks, attributes });
    expect(screen.getByText('testing')).not.toHaveAttribute('href');
    expect(screen.getByRole('link', { name: 'hotrod' })).toHaveAttribute(
      'href',
      '/console/ns/testing/pod/hotrod/detail'
    );
  });
});
