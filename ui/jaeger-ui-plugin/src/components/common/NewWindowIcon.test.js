// Copyright (c) 2019 Uber Technologies, Inc.
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
import '@testing-library/jest-dom/';
import NewWindowIcon from './NewWindowIcon';

describe('NewWindowIcon', () => {
  const props = {
    notIsLarge: 'not is large',
  };
  it('renders without is-large className when props.isLarge is false', () => {
    const { container } = render(<NewWindowIcon {...props} />);
    expect(container.querySelector('.is-large')).toBeNull();
  });

  it('adds is-large className when props.isLarge is true', () => {
    const { rerender, container } = render(<NewWindowIcon {...props} />);

    // Initial render, is-large should be false
    expect(container.querySelector('.is-large')).toBeNull();

    // Re-render with isLarge prop set to true
    rerender(<NewWindowIcon {...props} isLarge />);

    // After re-render, is-large should be true
    expect(container.querySelector('.is-large')).toBeInTheDocument();
  });
});
