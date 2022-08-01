// Copyright 2022 The Perses Authors
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
	"encoding/json"
	"fmt"
	"os"
	"os/user"
	"path/filepath"

	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/sirupsen/logrus"
)

const (
	pathConfig     = ".perses"
	configFileName = "config.json"
)

var Global *Config

func Init(configPath string) {
	var err error
	Global, err = readConfig(configPath)
	if err != nil {
		logrus.WithError(err).Debug("unable to read the config")
		Global = &Config{}
	} else {
		err = Global.init()
		if err != nil {
			logrus.WithError(err).Errorf("unable to initialize the CLI from the config")
		}
	}
	Global.filePath = configPath
}

type Config struct {
	RestClientConfig perseshttp.RestConfigClient `json:"rest_client_config"`
	Project          string                      `json:"project"`
	filePath         string
	apiClient        api.ClientInterface
}

func (c *Config) init() error {
	restClient, err := perseshttp.NewFromConfig(c.RestClientConfig)
	if err != nil {
		return err
	}
	c.apiClient = api.NewWithClient(restClient)
	return nil
}

func (c *Config) GetAPIClient() (api.ClientInterface, error) {
	if c.apiClient != nil {
		return c.apiClient, nil
	}
	return nil, fmt.Errorf("you are not connected to any API")
}

func (c *Config) SetAPIClient(apiClient api.ClientInterface) {
	c.apiClient = apiClient
}

func GetDefaultPath() string {
	return filepath.Join(getRootFolder(), pathConfig, configFileName)
}

// getRootFolder will return a root folder that will or that contains the Perses' config in a sub dir.
func getRootFolder() string {
	usr, err := user.Current()
	if err != nil {
		// In this case, we didn't find the current system user.
		// It's really a corner case, and so it can be acceptable to use a temporary folder instead of the homedir
		return os.TempDir()
	}
	return usr.HomeDir
}

// ReadConfig reads the configuration file stored in the path {USER_HOME}/.argos/config
// If there is no error during the read, it returns the result in the struct ArgosCLIConfig
func readConfig(filePath string) (*Config, error) {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("file %q doesn't exist", filePath)
	} else if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	result := &Config{}
	return result, json.Unmarshal(data, result)
}

func SetProject(project string) error {
	return Write(&Config{
		Project: project,
	})
}

// Write writes the configuration file in the path {USER_HOME}/.perses/config
// if the directory doesn't exist, the function will create it
func Write(config *Config) error {
	// this value has been set by the root command and that will be the path where the config must be saved
	filePath := Global.filePath
	directory := filepath.Dir(filePath)

	if _, err := os.Stat(directory); os.IsNotExist(err) {
		mkdirError := os.Mkdir(directory, 0700)
		if mkdirError != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	previousConf, err := readConfig(filePath)
	if err == nil {
		// the config already exists, so we should update it with the one provided in the parameter.
		if config != nil {
			previousConf.RestClientConfig.InsecureTLS = config.RestClientConfig.InsecureTLS
			if len(config.RestClientConfig.URL) > 0 {
				previousConf.RestClientConfig.URL = config.RestClientConfig.URL
			}
			if len(config.Project) > 0 {
				previousConf.Project = config.Project
			}
		}
	} else {
		previousConf = config
	}

	data, err := json.Marshal(previousConf)

	if err != nil {
		return err
	}

	return os.WriteFile(filePath, data, 0600)
}
