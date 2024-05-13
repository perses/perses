// Copyright (c) 2020 Uber Technologies, Inc.
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
import { screen, render } from '@testing-library/react';

import CircularProgressbar from './CircularProgressbar';
import '@testing-library/jest-dom';

describe('CircularProgressbar', () => {
  const minProps = {
    maxValue: 108,
    value: 42,
  };

  const fullProps = {
    ...minProps,
    backgroundHue: 0,
    decorationHue: 120,
    strokeWidth: 8,
    text: 'test text',
  };

  it('handles minimal props', () => {
    render(<CircularProgressbar {...minProps} />);

    expect(screen.getByTestId('circular-progress-bar')).toBeInTheDocument();
  });

  it('renders as expected with all props', () => {
    render(<CircularProgressbar {...fullProps} />);

    expect(screen.getByTestId('circular-progress-bar')).toBeInTheDocument();
    expect(screen.getByText(fullProps.text)).toBeInTheDocument();
  });
});
