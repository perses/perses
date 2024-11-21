// Copyright 2023 The Perses Authors
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

package config

import (
	"github.com/prometheus/common/model"
)

type ProvisioningConfig struct {
	Folders []string `json:"folders,omitempty" yaml:"folders,omitempty"`
	// Interval is the refresh frequency
	// +kubebuilder:validation:Type=string
	// +kubebuilder:validation:Format=duration
	Interval model.Duration `json:"interval,omitempty" yaml:"interval,omitempty"`
}

func (p *ProvisioningConfig) Verify() error {
	if p.Interval <= 0 {
		p.Interval = model.Duration(defaultInterval)
	}
	return nil
}
