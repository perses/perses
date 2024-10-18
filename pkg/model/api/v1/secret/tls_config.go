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

package secret

import (
	"crypto/tls"

	promConfig "github.com/prometheus/common/config"
)

// PublicTLSConfig is the public struct of TLSConfig.
// It's used when the API returns a response to a request
type PublicTLSConfig struct {
	CA                 Hidden `yaml:"ca,omitempty" json:"ca,omitempty"`
	Cert               Hidden `yaml:"cert,omitempty" json:"cert,omitempty"`
	Key                Hidden `yaml:"key,omitempty" json:"key,omitempty"`
	CAFile             string `yaml:"caFile,omitempty" json:"caFile,omitempty"`
	CertFile           string `yaml:"certFile,omitempty" json:"certFile,omitempty"`
	KeyFile            string `yaml:"keyFile,omitempty" json:"keyFile,omitempty"`
	ServerName         string `yaml:"serverName,omitempty" json:"serverName,omitempty"`
	InsecureSkipVerify bool   `yaml:"insecureSkipVerify" json:"insecureSkipVerify"`
}

func NewPublicTLSConfig(t *TLSConfig) *PublicTLSConfig {
	if t == nil {
		return nil
	}
	return &PublicTLSConfig{
		CA:                 Hidden(t.CA),
		Cert:               Hidden(t.Cert),
		Key:                Hidden(t.Key),
		CAFile:             t.CAFile,
		CertFile:           t.CertFile,
		KeyFile:            t.KeyFile,
		ServerName:         t.ServerName,
		InsecureSkipVerify: t.InsecureSkipVerify,
	}
}

func BuildTLSConfig(cfg *TLSConfig) (*tls.Config, error) {
	if cfg == nil {
		return &tls.Config{MinVersion: tls.VersionTLS12}, nil
	}
	preConfig := &promConfig.TLSConfig{
		CA:                 cfg.CA,
		Cert:               cfg.Cert,
		Key:                promConfig.Secret(cfg.Key),
		CAFile:             cfg.CAFile,
		CertFile:           cfg.CertFile,
		KeyFile:            cfg.KeyFile,
		ServerName:         cfg.ServerName,
		InsecureSkipVerify: cfg.InsecureSkipVerify,
		MinVersion:         promConfig.TLSVersions[cfg.MinVersion],
		MaxVersion:         promConfig.TLSVersions[cfg.MaxVersion],
	}
	return promConfig.NewTLSConfig(preConfig)
}

type TLSConfig struct {
	// Text of the CA cert to use for the targets.
	CA string `yaml:"ca,omitempty" json:"ca,omitempty"`
	// Text of the client cert file for the targets.
	Cert string `yaml:"cert,omitempty" json:"cert,omitempty"`
	// Text of the client key file for the targets.
	Key string `yaml:"key,omitempty" json:"key,omitempty"`
	// The CA cert to use for the targets.
	CAFile string `yaml:"caFile,omitempty" json:"caFile,omitempty"`
	// The client cert file for the targets.
	CertFile string `yaml:"certFile,omitempty" json:"certFile,omitempty"`
	// The client key file for the targets.
	KeyFile string `yaml:"keyFile,omitempty" json:"keyFile,omitempty"`
	// Used to verify the hostname for the targets.
	ServerName string `yaml:"serverName,omitempty" json:"serverName,omitempty"`
	// Disable target certificate validation.
	InsecureSkipVerify bool `yaml:"insecureSkipVerify" json:"insecureSkipVerify"`
	// Minimum acceptable TLS version.
	MinVersion string `yaml:"minVersion" json:"minVersion" default:"TLS12"`
	// Maximum acceptable TLS version.
	MaxVersion string `yaml:"maxVersion" json:"maxVersion" default:"TLS13"`
}
