// Copyright 2021 The Perses Authors
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
	"fmt"

	"github.com/perses/perses/go-sdk"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/sirupsen/logrus"
)

type PluginSpec struct {
	Text string `json:"text" yaml:"text"`
}

func NewPanel(name string, content string) *PanelBuilder {
	return &PanelBuilder{
		PanelBuilder: sdk.PanelBuilder{
			Panel: v1.Panel{
				Kind: "Panel",
				Spec: v1.PanelSpec{
					Display: v1.PanelDisplay{
						Name: name,
					},
					Plugin: common.Plugin{
						Kind: "Markdown",
						Spec: PluginSpec{
							Text: content,
						},
					},
				},
			},
		},
	}
}

func NewPanelBuilder(panel v1.Panel) *PanelBuilder {
	return &PanelBuilder{PanelBuilder: sdk.PanelBuilder{Panel: panel}}
}

type PanelBuilder struct {
	sdk.PanelBuilder
}

func (b *PanelBuilder) WithText(text string) *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set text: %q", text))
		return b
	}
	pluginSpec.Text = text
	return b
}

func (b *PanelBuilder) AddText(text string) *PanelBuilder {
	pluginSpec, ok := b.Panel.Spec.Plugin.Spec.(*PluginSpec)
	if !ok {
		logrus.Error(fmt.Sprintf("failed to set text: %q", text))
		return b
	}
	pluginSpec.Text = pluginSpec.Text + text
	return b
}

// TODO: add markdown text helpers (i.e.: add title, add image, ...)
