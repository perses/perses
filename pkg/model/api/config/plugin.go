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

package config

import (
	"os"
)

// These constants are actually defined as variables to allow overriding them at build time using the -ldflags option.
// It is useful for the Linux distribution that has different conventions for the location of the data files.
// See https://github.com/perses/perses/issues/2947 for more context.
var (
	DefaultPluginPath                   = "plugins"
	DefaultPluginPathInContainer        = "/etc/perses/plugins"
	DefaultArchivePluginPath            = "plugins-archive"
	DefaultArchivePluginPathInContainer = "/etc/perses/plugins-archive"
)

func isRunningInContainer() bool {
	// This file exists when podman is used
	if _, err := os.Stat("/run/.containerenv"); err == nil {
		return true
	}
	// This file exists when docker is used
	if _, err := os.Stat("/.dockerenv"); err == nil {
		return true
	}
	return false
}

// isRunningInKubernetes checks if the application is running in a kubernetes cluster.
// In this context, the function isRunningInContainer will always return false as the files `/run/.containerenv` and `/.dockerenv`
// are not created in a kubernetes cluster.
func isRunningInKubernetes() bool {
	if _, err := os.Stat("/var/run/secrets/kubernetes.io"); err == nil {
		return true
	}
	// In case the value automountServiceAccountToken is equal to false, then the directory `/var/run/secrets/kubernetes.io` will not be created.
	// So another way to verify if the application is running in a kubernetes cluster is to check if the environment variable `KUBERNETES_SERVICE_HOST` is set.
	// This variable is set only if the pod is running on a node as stamped in the documentation: https://kubernetes.io/docs/tutorials/services/connect-applications-service/#environment-variables.
	if _, present := os.LookupEnv("KUBERNETES_SERVICE_HOST"); present {
		return true
	}
	return false
}

type Plugin struct {
	// Path is the path to the directory containing the runtime plugins
	Path string `json:"path,omitempty" yaml:"path,omitempty"`
	// ArchivePath is the path to the directory containing the archived plugins
	// When Perses is starting, it will extract the content of the archive in the folder specified in the `folder` attribute.
	ArchivePath string `json:"archive_path,omitempty" yaml:"archive_path,omitempty"`
	// DevEnvironment is the configuration to use when developing a plugin
	EnableDev bool `json:"enable_dev" yaml:"enable_dev"`
}

func (p *Plugin) Verify() error {
	runningInContainer := isRunningInContainer()
	runningInKubernetes := isRunningInKubernetes()
	if len(p.Path) == 0 {
		if runningInContainer || runningInKubernetes {
			p.Path = DefaultPluginPathInContainer
		} else {
			p.Path = DefaultPluginPath
		}
	}
	if len(p.ArchivePath) == 0 {
		if runningInContainer || runningInKubernetes {
			p.ArchivePath = DefaultArchivePluginPathInContainer
		} else {
			p.ArchivePath = DefaultArchivePluginPath
		}
	}
	return nil
}
