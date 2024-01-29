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

package row

import v1 "github.com/perses/perses/pkg/model/api/v1"

type Row struct {
	Title        string
	PanelsWidth  int
	PanelsHeight int
	IsCollapsed  bool
	Panels       []v1.Panel
}

type Option func(plugin *Builder) error

type Builder struct {
	Row
}

func New(title string, options ...Option) (Builder, error) {
	builder := &Builder{
		Row: Row{},
	}

	defaults := []Option{
		Title(title),
		PanelWidth(12),
		PanelHeight(6),
		Collapsed(false),
	}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}
