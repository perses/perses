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

package gauge

import (
	commonSdk "github.com/perses/perses/go-sdk/common"
	"github.com/perses/perses/go-sdk/panel"
)

type PluginSpec struct {
	Calculation commonSdk.Calculation `json:"calculation" yaml:"calculation"`
	Format      *commonSdk.Format     `json:"format,omitempty" yaml:"format,omitempty"`
	Thresholds  *commonSdk.Thresholds `json:"thresholds,omitempty" yaml:"thresholds,omitempty"`
	Max         int                   `json:"max,omitempty" yaml:"max,omitempty"`
}

type Option func(plugin *Builder) error

type Builder struct {
	PluginSpec
}

func New(options ...Option) (Builder, error) {
	builder := &Builder{
		PluginSpec: PluginSpec{},
	}

	defaults := []Option{
		Calculation(commonSdk.LastCalculation),
	}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

func Chart(options ...Option) panel.Option {
	return func(builder *panel.Builder) error {
		r, err := New(options...)
		if err != nil {
			return err
		}
		builder.Spec.Plugin.Kind = "GaugeChart"
		builder.Spec.Plugin.Spec = r.PluginSpec
		return nil
	}
}
