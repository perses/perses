// Copyright 2024 The Perses Authors
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

package sdk

import (
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type PanelBuilder struct {
	v1.Panel
}

func (b *PanelBuilder) Build() v1.Panel {
	return b.Panel
}

func (b *PanelBuilder) WithDescription(description string) *PanelBuilder {
	b.Panel.Spec.Display.Description = description
	return b
}
