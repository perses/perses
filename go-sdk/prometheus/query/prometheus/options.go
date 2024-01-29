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
	"time"

	"github.com/perses/perses/go-sdk/datasource"
	"github.com/prometheus/common/model"
)

func Expr(expr string) Option {
	return func(builder *Builder) error {
		builder.Query = expr
		return nil
	}
}

func Datasource(datasource datasource.Selector) Option {
	return func(builder *Builder) error {
		builder.Datasource = &datasource
		return nil
	}
}

func SeriesNameFormat(format string) Option {
	return func(builder *Builder) error {
		builder.SeriesNameFormat = format
		return nil
	}
}

func MinStep(step time.Duration) Option {
	return func(builder *Builder) error {
		builder.MinStep = model.Duration(step)
		return nil
	}
}

func Resolution(resolution int) Option {
	return func(builder *Builder) error {
		builder.Resolution = resolution
		return nil
	}
}
