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
	"fmt"

	"github.com/perses/spec/go/dashboard"
	"github.com/perses/spec/go/plugin"
)

// Option is the annotation plugin configuration supplied by a plugin SDK.
type Option struct {
	Kind   plugin.Kind
	Plugin plugin.Plugin
	Error  error
}

// DisplayOption configures optional annotation display fields.
type DisplayOption func(annotation *dashboard.AnnotationSpec)

// New builds an annotation with its required name and plugin configuration.
func New(name string, option Option, options ...DisplayOption) (*dashboard.AnnotationSpec, error) {
	if name == "" {
		return nil, errors.New("annotation name cannot be empty")
	}
	if option.Kind != plugin.KindAnnotation {
		return nil, fmt.Errorf("invalid plugin kind for an annotation: %s", option.Kind)
	}

	annotation := &dashboard.AnnotationSpec{
		Display: dashboard.AnnotationDisplay{
			Name: name,
		},
		Plugin: option.Plugin,
	}
	for _, opt := range options {
		opt(annotation)
	}

	return annotation, option.Error
}
