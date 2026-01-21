// Copyright 2026 The Perses Authors
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

package v1

import (
	"github.com/perses/perses/pkg/model/api/v1/common"
)

type Display struct {
	Name        string `json:"name" yaml:"name"`
	Description string `json:"description,omitempty" yaml:"description,omitempty"`
	Hidden      bool   `json:"hidden,omitempty" yaml:"hidden,omitempty"`
}

type AnnotationSpec struct {
	Display Display       `json:"display" yaml:"display"`
	Color   string        `json:"color" yaml:"color"`
	Plugin  common.Plugin `json:"plugin" yaml:"plugin"`
}
