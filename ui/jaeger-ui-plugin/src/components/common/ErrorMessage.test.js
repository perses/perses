// Copyright (c) 2017 Uber Technologies, Inc.
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
import ErrorMessage, { Details, MAX_DETAIL_LENGTH } from './ErrorMessage';

import '@testing-library/jest-dom';

describe('<ErrorMessage>', () => {
  const errorMessage = 'some error message';

  it('renders empty when not passed an error', () => {
    render(<ErrorMessage />);
    expect(screen.queryByTestId('ErrorMessage')).toBeNull();
  });

  it('renders a message when passed a string', () => {
    render(<ErrorMessage error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('<Details /> renders empty on string error', () => {
    render(<Details error={errorMessage} />);
    expect(screen.queryByTestId('ErrorMessage--details')).toBeNull();
    expect(screen.queryByTestId('ErrorMessage--details--wrapper')).toBeNull();
  });

  it('<Details /> renders wrapper on wrap', () => {
    const error = {
      httpStatus: 'value-httpStatus',
      httpStatusText: 'value-httpStatusText',
      httpUrl: 'value-httpUrl',
      httpQuery: 'value-httpQuery',
      httpBody: 'value-httpBody',
    };
    render(<Details error={error} wrap />);

    // The wrapper element should be present
    expect(screen.getByTestId('ErrorMessage--details--wrapper')).toBeInTheDocument();

    // All the error attributes should be present
    Object.keys(error).forEach(key => {
      expect(screen.getByText(error[key])).toBeInTheDocument();
    });
  });

  it('<Details /> renders custom wrapper class', () => {
    const error = {
      httpStatus: 'value-httpStatus',
      httpStatusText: 'value-httpStatusText',
      httpUrl: 'value-httpUrl',
      httpQuery: 'value-httpQuery',
      httpBody: 'value-httpBody',
    };
    render(<Details error={error} wrap wrapperClassName="TEST-WRAPPER-CLASS" />);

    // The wrapper element should be present
    expect(screen.getByTestId('ErrorMessage--details--wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('ErrorMessage--details--wrapper')).toHaveClass('TEST-WRAPPER-CLASS');

    // All the error attributes should be present
    Object.keys(error).forEach(key => {
      expect(screen.getByText(error[key])).toBeInTheDocument();
    });
  });

  it('renders the error message', () => {
    const error = new Error('another-error');
    render(<ErrorMessage error={error} />);

    expect(screen.getByText(error.message)).toBeInTheDocument();
  });

  it('renders HTTP related data from the error', () => {
    const error = {
      message: 'some-http-ish-message',
      httpStatus: 'value-httpStatus',
      httpStatusText: 'value-httpStatusText',
      httpUrl: 'value-httpUrl',
      httpQuery: 'value-httpQuery',
      httpBody: 'value-httpBody',
    };

    render(<ErrorMessage error={error} />);
    Object.keys(error).forEach(key => {
      expect(screen.getByText(error[key])).toBeInTheDocument();
    });
  });

  it('renders truncated body excerpt on large body', () => {
    const error = {
      message: 'some-http-ish-message',
      httpStatus: 'value-httpStatus',
      httpStatusText: 'value-httpStatusText',
      httpUrl: 'value-httpUrl',
      httpQuery: 'value-httpQuery',
      httpBody: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac maximus elit. Curabitur non urna in odio dictum porttitor. Fusce sed mi mauris. Sed vehicula mi nec nulla ultricies, a faucibus nisi feugiat. Aliquam varius diam in porttitor maximus. Quisque in varius neque, vel consequat enim. Donec faucibus lorem tortor, a aliquam augue vulputate eu. Pellentesque tincidunt, nisl vitae tristique fringilla, elit augue eleifend leo, eget laoreet turpis justo et dui. Suspendisse nec lacinia tortor, non fermentum arcu. Morbi at nunc nisi. Vestibulum condimentum sollicitudin nibh ut cursus. Nullam neque erat, eleifend eget libero eget, porta maximus diam. Integer ut est congue, placerat ipsum nec, varius ligula. Integer maximus gravida velit quis commodo. Phasellus posuere a nulla id sodales. Aliquam ultrices purus et iaculis imperdiet. Morbi in felis maximus, dictum sapien in, malesuada augue. Duis sit amet tortor ac ante pellentesque iaculis eget vestibulum ex. Nunc malesuada egestas mauris, ut tempus eros hendrerit dui.`,
    };

    render(<ErrorMessage error={error} />);

    // All the keys expect httpBody should be present as is
    Object.keys(error).forEach(key => {
      if (key !== 'httpBody') expect(screen.getByText(error[key])).toBeInTheDocument();
    });

    // The body should be truncated
    expect(
      screen.getByText(`${error.httpBody.slice(0, MAX_DETAIL_LENGTH - 3).trim()}...`)
    ).toBeInTheDocument();
  });

  it('renders on missing httpStatus from the error', () => {
    const error = {
      message: 'some-http-ish-message',
      httpStatusText: 'value-httpStatusText',
      httpUrl: 'value-httpUrl',
      httpQuery: 'value-httpQuery',
      httpBody: 'value-httpBody',
    };

    render(<ErrorMessage error={error} />);
    Object.keys(error).forEach(key => {
      expect(screen.getByText(error[key])).toBeInTheDocument();
    });
  });
});
