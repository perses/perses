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

package markdown

import (
	"github.com/perses/perses/pkg/model/api/v1/common"
)

type PluginSpec struct {
	Text string `json:"text" yaml:"text"`
}

func NewPanelPlugin(content string) *PanelPluginBuilder {
	return &PanelPluginBuilder{
		PluginSpec{
			Text: content,
		},
	}
}

type PanelPluginBuilder struct {
	PluginSpec
}

func (b *PanelPluginBuilder) Build() common.Plugin {
	return common.Plugin{
		Kind: "Markdown",
		Spec: b.PluginSpec,
	}
}

func (b *PanelPluginBuilder) WithText(text string) *PanelPluginBuilder {
	b.Text = text
	return b
}

func (b *PanelPluginBuilder) AddText(text string) *PanelPluginBuilder {
	b.Text = b.Text + text
	return b
}

// TODO: add markdown text helpers (i.e.: add title, add image, ...)
