// Copyright (c) 2020 The Jaeger Authors.
//
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

import React from 'react';
import { render } from '@testing-library/react';
import EmphasizedNode from './EmphasizedNode';
import '@testing-library/jest-dom';

describe('<EmphasizedNode>', () => {
  const defaultProps = {
    height: 100,
    width: 500,
  };

  it('renders with default props', () => {
    const { container } = render(<EmphasizedNode {...defaultProps} />);

    const recElements = container.querySelectorAll('rect');

    expect(recElements.length).toBe(4);
    recElements.forEach(element => {
      expect(element).toHaveAttribute('height', defaultProps.height.toString());
      expect(element).toHaveAttribute('width', defaultProps.width.toString());
    });
  });
});
