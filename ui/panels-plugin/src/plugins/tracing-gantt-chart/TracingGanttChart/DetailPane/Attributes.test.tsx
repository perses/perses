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

import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { AttributeList, AttributeListProps } from './Attributes';

describe('Attributes', () => {
  const renderComponent = (props: AttributeListProps) => {
    return render(<AttributeList {...props} />);
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
});
