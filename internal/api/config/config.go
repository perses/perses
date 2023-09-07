// Copyright 2021 The Perses Authors
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
	"encoding/hex"
	"fmt"
	"math/rand"
	"os"
	"time"

	"github.com/perses/common/config"
	promConfig "github.com/prometheus/common/config"
	"github.com/sirupsen/logrus"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func randomString(stringSize uint) string {
	// gosec is yelling because we are using a weak random generator.
	// We are generating a string for the encryption key as best effort so the docker image can run without pre-configuration.
	// So it makes Perses easier to be tested.
	// People should provide the secret key by them self in the regular flow.
	// nolint:gosec
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	b := make([]byte, stringSize)
	for i := range b {
		b[i] = charset[seededRand.Intn(len(charset))]
	}
	return string(b)
}

type dashboardSelector struct {
	// Project correspond to the name of the project (dashboard.metadata.project)
	Project string `json:"project" yaml:"project"`
	// Dashboard correspond to the name of the dashboard (dashboard.metadata.name)
	Dashboard string `json:"dashboard" yaml:"dashboard"`
}

type Config struct {
	// Readonly will deactivate any HTTP POST, PUT, DELETE endpoint
	Readonly bool `json:"readonly" yaml:"readonly"`
	// EncryptionKey is the secret key used to encrypt and decrypt sensitive data stored in the database such as the password of the basic auth for a datasource
	// Note that if it is not provided it will be generated. When perses is used in a multi instance mode, you should provide the key.
	// Otherwise, each instance will have a different key and therefore won't be able to decrypt what the other is encrypting.
	// Also note the key must be at least 32 bytes long.
	EncryptionKey promConfig.Secret `json:"encryption_key,omitempty" yaml:"encryption_key,omitempty"`
	// EncryptionKeyFile is the path to file containing the secret key
	EncryptionKeyFile string `json:"encryption_key_file,omitempty" yaml:"encryption_key_file,omitempty"`
	// Database contains the different configuration depending on the database you want to use
	Database Database `json:"database" yaml:"database"`
	// Schemas contains the configuration to get access to the CUE schemas
	Schemas Schemas `json:"schemas" yaml:"schemas"`
	// ImportantDashboards contains important dashboard selectors
	ImportantDashboards []dashboardSelector `json:"important_dashboards,omitempty" yaml:"important_dashboards,omitempty"`
	// Information contains markdown content to be display on the home page
	Information string `json:"information,omitempty" yaml:"information,omitempty"`
}

func (c *Config) Verify() error {
	if len(c.EncryptionKey) == 0 && len(c.EncryptionKeyFile) == 0 {
		logrus.Warning("encryption_key is not provided and therefore will be generated. For production instance you should provide a fixed key")
		c.EncryptionKey = promConfig.Secret(randomString(32))
	}
	if len(c.EncryptionKey) > 0 && len(c.EncryptionKeyFile) > 0 {
		return fmt.Errorf("encryption_key and encryption_key_file are mutually exclusive. Use one or the other not both at the same time")
	}
	if len(c.EncryptionKeyFile) > 0 {
		// Read the file and load the password contained
		data, err := os.ReadFile(c.EncryptionKeyFile)
		if err != nil {
			return err
		}
		c.EncryptionKey = promConfig.Secret(data)
	}
	if len(c.EncryptionKey) < 32 {
		return fmt.Errorf("encryption_key must be longer than 32 bytes")
	}
	c.EncryptionKey = promConfig.Secret(hex.EncodeToString([]byte(c.EncryptionKey)))
	return nil
}

func Resolve(configFile string) (Config, error) {
	c := Config{}
	return c, config.NewResolver[Config]().
		SetConfigFile(configFile).
		SetEnvPrefix("PERSES").
		Resolve(&c).
		Verify()
}
