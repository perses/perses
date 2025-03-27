// Copyright 2025 The Perses Authors
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

package start

import (
	"bytes"
	"fmt"
	"io"
	"strings"

	"github.com/fatih/color"
)

type prefixedStream struct {
	prefix string
	buff   *bytes.Buffer
	writer io.Writer
	color  func(a ...interface{}) string
}

func newPrefixedStream(prefix string, writer io.Writer, c *color.Color) *prefixedStream {
	return &prefixedStream{
		prefix: prefix,
		buff:   bytes.NewBuffer(nil),
		writer: writer,
		color:  c.SprintFunc(),
	}
}

func (p *prefixedStream) Write(data []byte) (n int, err error) {
	if n, err = p.buff.Write(data); err != nil {
		return
	}

	err = p.writePrefixLine()
	return
}

func (p *prefixedStream) writePrefixLine() error {
	for {
		line, err := p.buff.ReadString('\n')
		if len(line) > 0 {
			// There is a possibility that the line is not terminated by a newline character as stamped by the spec of bytes.ReadString.
			if strings.HasSuffix(line, "\n") {
				if flushErr := p.flush(line); flushErr != nil {
					return flushErr
				}
				// If the line is not terminated by a newline character, we need to keep it in the buffer.
			} else if _, writeErr := p.buff.WriteString(line); writeErr != nil {
				return writeErr
			}
		}

		if err == io.EOF {
			break
		}

		if err != nil {
			return err
		}
	}
	return nil
}

func (p *prefixedStream) flush(line string) error {
	prefixLine := fmt.Sprintf("[%s] %s", p.color(p.prefix), line)
	_, err := p.writer.Write([]byte(prefixLine))
	return err
}
