// Copyright The Perses Authors
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

// Package annotation provides builders for dashboard and panel annotations.
package annotation

import (
	"errors"

	"github.com/perses/spec/go/dashboard"
)

// Option configures an annotation builder.
type Option func(annotation *Builder) error

// New builds an annotation with its required name and plugin configuration.
func New(name string, options ...Option) (Builder, error) {
	builder := &Builder{
		Annotation: dashboard.AnnotationSpec{},
	}

	defaults := []Option{
		Name(name),
	}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	if builder.Annotation.Plugin.Kind == "" {
		return *builder, errors.New("annotation plugin cannot be empty")
	}

	return *builder, nil
}

// Builder constructs a dashboard annotation spec.
type Builder struct {
	Annotation dashboard.AnnotationSpec `json:"-" yaml:"-"`
}
