// Copyright 2023 The Perses Authors
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

package read

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strings"
)

func FromStdin() (string, error) {
	buf := bufio.NewReader(os.Stdin)
	input, err := buf.ReadString('\n')
	if err != nil {
		return "", err
	}
	input = strings.TrimSuffix(
		strings.TrimSuffix(input, "\n"),
		"\r",
	)
	return input, nil
}

func FromStdout() ([]byte, error) {
	// from https://flaviocopes.com/go-shell-pipes/
	info, err := os.Stdin.Stat()
	if err != nil {
		return nil, err
	}

	if info.Mode()&os.ModeCharDevice != 0 {
		return nil, fmt.Errorf("the command is intended to work with pipes")
	}

	reader := bufio.NewReader(os.Stdin)
	var output []byte

	for {
		input, readErr := reader.ReadByte()
		if readErr != nil {
			if readErr == io.EOF {
				break
			}
			return nil, readErr
		}
		output = append(output, input)
	}
	return output, nil
}
