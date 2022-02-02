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

package utils

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/user"
	"path/filepath"
)

const (
	pathConfig     = ".perses"
	configFileName = "config"
)

type CLIConfig struct {
	URL         string `json:"url"`
	InsecureTLS bool   `json:"insecure_tls"`
	Project     string `json:"project"`
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
func readConfig() (*CLIConfig, error) {
	path := filepath.Join(getRootFolder(), pathConfig, configFileName)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil, fmt.Errorf("file %s doesn't exist", path)
	}

	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}

	result := &CLIConfig{}
	return result, json.Unmarshal(data, result)
}

// WriteConfig writes the configuration file in the path {USER_HOME}/.perses/config
// if the directory doesn't exist, the function will create it
func WriteConfig(config *CLIConfig) error {
	path := filepath.Join(getRootFolder(), pathConfig)

	if _, err := os.Stat(path); os.IsNotExist(err) {
		err := os.Mkdir(path, 0700)
		if err != nil {
			return err
		}
	}

	previousConf, err := readConfig()
	if err == nil {
		// the config already exists, so we should update it with the one provided in the parameter.
		if config != nil {
			previousConf.InsecureTLS = config.InsecureTLS
			if len(config.URL) > 0 {
				previousConf.URL = config.URL
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

	return ioutil.WriteFile(filepath.Join(path, configFileName), data, 0600)
}
