// Copyright (c) 2023 The Jaeger Authors
// Adopted from https://thesametech.com/snapshot-testing-in-rtl/
// Copyright (c) 2023 Ildar Sharafeev
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// NOTICE: do not use shallow() for snapshot testing if possible.

/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { isFragment, isLazy, isPortal, isMemo, isSuspense, isForwardRef } from 'react-is';

describe('dummy test', () => {
  it('dummy test', () => {
    // this file defines a helper module for use in other tests.
  });
});

const shallow = (element, options) => {
  const localOptions = options === undefined ? {} : options;
  const Wrapper = localOptions.Wrapper || null;
  const shallowRenderer = new ShallowRenderer();
  const shallowWrapper = Wrapper
    ? shallowRenderer.render(<Wrapper>{element}</Wrapper>)
    : shallowRenderer.render(element);

  const getNodeName = node => {
    return node.displayName || node.name || '';
  };

  const getWrappedName = (outerNode, innerNode, wrapperName) => {
    const functionName = getNodeName(innerNode);
    return (
      outerNode.type.displayName || (functionName !== '' ? `${wrapperName}(${functionName})` : wrapperName)
    );
  };

  const extractType = node => {
    if (typeof node === 'string') return node;
    const name = getNodeName(node.type) || node.type || 'Component';
    if (isLazy(node)) {
      return 'Lazy';
    }

    if (isMemo(node)) {
      return `Memo(${name || extractType(node.type)})`;
    }

    if (isSuspense(node)) {
      return 'Suspense';
    }

    if (isPortal(node)) {
      return 'Portal';
    }

    if (isFragment(node)) {
      return 'Fragment';
    }
    if (isForwardRef(node)) {
      return getWrappedName(node, node.type.render, 'ForwardRef');
    }
    return name;
  };

  const transformNode = current => {
    const extractProps = ({ children, ...props }, key) => {
      const childrenArray = Array.isArray(children) ? children : [children];
      return {
        children: childrenArray.filter(Boolean).map(transformNode),
        props: {
          ...props,
          ...(key ? { key } : {}),
        },
      };
    };
    if (Array.isArray(current)) {
      return current.map(transformNode);
    }
    if (typeof current !== 'object') {
      return current;
    }
    return {
      $$typeof: Symbol.for('react.test.json'),
      type: extractType(current),
      ...extractProps(current.props, current.key),
    };
  };

  return transformNode(shallowWrapper);
};

export default shallow;
