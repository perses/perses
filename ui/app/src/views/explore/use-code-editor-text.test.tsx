// Copyright The Perses Authors
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

import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import { readCodeEditorText, useCodeEditorText } from './use-code-editor-text';

function buildContent(lines: string[], placeholder?: string): HTMLElement {
  const content = document.createElement('div');
  content.className = 'cm-content';
  for (const text of lines) {
    const line = document.createElement('div');
    line.className = 'cm-line';
    line.append(text);
    if (placeholder) {
      const placeholderElement = document.createElement('span');
      placeholderElement.className = 'cm-placeholder';
      placeholderElement.textContent = placeholder;
      line.append(placeholderElement);
    }
    content.append(line);
  }
  return content;
}

function EditorTextProbe(): ReactElement {
  const { containerRef, text } = useCodeEditorText();
  return (
    <>
      <div ref={containerRef} data-testid="container" />
      <output>{text ?? 'no editor'}</output>
    </>
  );
}

describe('readCodeEditorText', () => {
  it('joins the editor lines', () => {
    expect(readCodeEditorText(buildContent(['{app="web"}', '|= "error"']))).toBe('{app="web"}\n|= "error"');
  });

  it('skips the placeholder', () => {
    expect(readCodeEditorText(buildContent([''], 'Enter a query'))).toBe('');
  });
});

describe('useCodeEditorText', () => {
  it('follows the editor text as it is edited', async () => {
    render(<EditorTextProbe />);
    expect(screen.getByRole('status')).toHaveTextContent('no editor');

    const content = buildContent(['{app="web"}']);
    screen.getByTestId('container').append(content);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('{app="web"}'));

    const firstLine = content.querySelector('.cm-line');
    if (firstLine) firstLine.textContent = '{app="api"}';
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('{app="api"}'));
  });
});
