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

package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAppendIfMissing(t *testing.T) {
	slice := []string{"test1", "test2"}
	slice, ok1 := AppendIfMissing(slice, "test1")
	assert.Len(t, slice, 2)
	assert.False(t, ok1)
	slice, ok2 := AppendIfMissing(slice, "test3")
	assert.Len(t, slice, 3)
	assert.True(t, ok2)
	slice, ok3 := AppendIfMissing(slice, "test3")
	assert.Len(t, slice, 3)
	assert.False(t, ok3)
}
