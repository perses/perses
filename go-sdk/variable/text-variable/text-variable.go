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

package textvariable

import (
	"github.com/perses/perses/go-sdk/variable"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
)

type Option func(textVariableSpec *Builder) error

type Builder struct {
	TextVariableSpec dashboard.TextVariableSpec `json:",inline" yaml:",inline"`
	Filters          []v1.Variable              `json:"-" yaml:"-"`
}

func New(value string, options ...Option) (Builder, error) {
	var builder = &Builder{
		TextVariableSpec: dashboard.TextVariableSpec{
			//Name:     "", // TODO: handle conversion
		},
	}
	defaults := []Option{
		Value(value),
	}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

func Text(value string, options ...Option) variable.Option {
	return func(builder *variable.Builder) error {
		options = append([]Option{Filter(builder.Filters...)}, options...)
		t, err := New(value, options...)
		if err != nil {
			return err
		}
		builder.Variable.Spec.Kind = "TextVariable"
		builder.Variable.Spec.Spec = t.TextVariableSpec
		return nil
	}
}
