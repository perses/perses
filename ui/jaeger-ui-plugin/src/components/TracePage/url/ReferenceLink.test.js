// Copyright (c) 2019 The Jaeger Authors.
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
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ReferenceLink from './ReferenceLink';

describe(ReferenceLink, () => {
  const focusMock = jest.fn();

  const sameTraceRef = {
    refType: 'CHILD_OF',
    traceID: 'trace1',
    spanID: 'span1',
    span: {
      // not null or undefined is an indicator of an internal reference
    },
  };

  const externalRef = {
    refType: 'CHILD_OF',
    traceID: 'trace2',
    spanID: 'span2',
  };

  describe('rendering', () => {
    it('render for this trace', () => {
      render(<ReferenceLink reference={sameTraceRef} focusSpan={focusMock} />);
      expect(screen.getAllByRole('button').length).toBe(1);
    });

    it('render for external trace', () => {
      render(<ReferenceLink reference={externalRef} focusSpan={focusMock} />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/trace/trace2?uiFind=span2');
    });
  });

  describe('focus span', () => {
    it('call focusSpan', () => {
      focusMock.mockReset();
      render(<ReferenceLink reference={sameTraceRef} focusSpan={focusMock} />);

      fireEvent.click(screen.getByRole('button'));
      expect(focusMock).toHaveBeenLastCalledWith('span1');
    });
  });
});
