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

package labelnames

import (
	promDatasource "github.com/perses/perses/go-sdk/prometheus/datasource"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

func Datasource(datasourceName string) Option {
	return func(builder *Builder) error {
		builder.PluginSpec.Datasource = promDatasource.Selector(datasourceName)
		return nil
	}
}

func Matchers(matchers ...string) Option {
	return func(builder *Builder) error {
		builder.PluginSpec.Matchers = matchers
		return nil
	}
}

func AddMatcher(matcher string) Option {
	return func(builder *Builder) error {
		builder.PluginSpec.Matchers = append(builder.PluginSpec.Matchers, matcher)
		return nil
	}
}

func Filter(variables ...v1.Variable) Option {
	return func(builder *Builder) error {
		builder.Filters = variables
		return nil
	}
}
