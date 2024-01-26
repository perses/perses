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

package static_list

import (
	"github.com/perses/perses/go-sdk/prometheus/variable"
)

func WithLabelName(labelName string) Option {
	return func(builder *Builder) error {
		builder.LabelName = labelName
		return nil
	}
}

func WithDatasource(datasource variable.DatasourceSelector) Option {
	return func(builder *Builder) error {
		builder.Datasource = &datasource
		return nil
	}
}

func WithMatchers(matchers ...string) Option {
	return func(builder *Builder) error {
		builder.Matchers = matchers
		return nil
	}
}

func AddMatchers(matcher string) Option {
	return func(builder *Builder) error {
		builder.Matchers = append(builder.Matchers, matcher)
		return nil
	}
}
