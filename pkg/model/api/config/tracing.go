// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package config

import "fmt"

type Tracing struct {
	// Enable activates the export of the traces of the Perses server with the OpenTelemetry protocol (OTLP) over gRPC.
	Enable bool `json:"enable,omitempty" yaml:"enable,omitempty"`
	// Endpoint is the address (host:port) of the OTLP gRPC receiver, like an OpenTelemetry Collector.
	Endpoint string `json:"endpoint,omitempty" yaml:"endpoint,omitempty"`
	// Insecure disables TLS when connecting to the endpoint.
	Insecure bool `json:"insecure,omitempty" yaml:"insecure,omitempty"`
	// SamplingRatio is the fraction, between 0 and 1, of the traces started by Perses that are sampled.
	// A request received with a sampled trace context (W3C traceparent header) is always traced.
	// With the default value (0), Perses only records the requests that are part of a sampled trace.
	SamplingRatio float64 `json:"sampling_ratio,omitempty" yaml:"sampling_ratio,omitempty"`
}

func (t *Tracing) Verify() error {
	if !t.Enable {
		return nil
	}
	if len(t.Endpoint) == 0 {
		return fmt.Errorf("tracing.endpoint must be set when tracing is enabled")
	}
	if t.SamplingRatio < 0 || t.SamplingRatio > 1 {
		return fmt.Errorf("tracing.sampling_ratio must be between 0 and 1, got %v", t.SamplingRatio)
	}
	return nil
}
