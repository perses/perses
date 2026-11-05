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

import { useEffect, useState } from 'react';

/** Text of a CodeMirror editor, read from its lines and skipping the placeholder. */
export function readCodeEditorText(content: Element): string {
  return Array.from(content.querySelectorAll('.cm-line'))
    .map((line) =>
      Array.from(line.childNodes)
        .filter((node) => !(node instanceof Element && node.classList.contains('cm-placeholder')))
        .map((node) => node.textContent ?? '')
        .join(''),
    )
    .join('\n');
}

export interface CodeEditorText {
  /** Ref callback for the element containing the editor. */
  containerRef: (element: HTMLElement | null) => void;
  /** Current text of the editor, or undefined until an editor is found. */
  text?: string;
}

/**
 * Text of the CodeMirror editor rendered inside a container, updated on every edit. Query editors of plugins only
 * report their value once the edit is committed (on blur or Mod+Enter), so the text is read from the editor DOM.
 */
export function useCodeEditorText(): CodeEditorText {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [text, setText] = useState<string>();

  useEffect(() => {
    if (!container) return undefined;
    const update = (): void => {
      const content = container.querySelector('.cm-content');
      setText(content ? readCodeEditorText(content) : undefined);
    };
    const observer = new MutationObserver(update);
    observer.observe(container, { subtree: true, childList: true, characterData: true });
    // The editor may already be rendered, in which case no mutation is observed until the next edit.
    const frame = requestAnimationFrame(update);
    return (): void => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [container]);

  return { containerRef: setContainer, text };
}
