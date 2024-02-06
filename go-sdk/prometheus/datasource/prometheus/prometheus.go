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

package prometheus

import (
	"encoding/json"
	"fmt"

	"github.com/perses/perses/go-sdk/datasource"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/prometheus/common/model"
)

type PluginSpec struct {
	DirectURL      string         `json:"directUrl,omitempty" yaml:"directUrl,omitempty"`
	Proxy          *http.Proxy    `json:"proxy,omitempty" yaml:"proxy,omitempty"`
	ScrapeInterval model.Duration `json:"scrapeInterval,omitempty" yaml:"scrapeInterval,omitempty"`
}

func (s *PluginSpec) UnmarshalJSON(data []byte) error {
	type plain PluginSpec
	var tmp PluginSpec
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *PluginSpec) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp PluginSpec
	type plain PluginSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *PluginSpec) validate() error {
	if len(s.DirectURL) == 0 && s.Proxy == nil {
		return fmt.Errorf("directUrl or proxy cannot be empty")
	}
	if len(s.DirectURL) > 0 && s.Proxy != nil {
		return fmt.Errorf("at most directUrl or proxy must be configured")
	}
	return nil
}

type Option func(plugin *Builder) error

func NewPlugin(options ...Option) (Builder, error) {
	builder := &Builder{
		PluginSpec: PluginSpec{},
	}

	defaults := []Option{}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

type Builder struct {
	PluginSpec
}

func Prometheus(options ...Option) datasource.Option {
	return func(builder *datasource.Builder) error {
		plugin, err := NewPlugin(options...)
		if err != nil {
			return err
		}

		builder.Spec.Plugin.Kind = "PrometheusDatasource"
		builder.Spec.Plugin.Spec = plugin.PluginSpec
		return nil
	}
}