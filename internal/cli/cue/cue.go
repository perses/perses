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

package cue

import (
	"fmt"
	"os"

	"github.com/perses/perses/internal/cli/sources"
)

const (
	cueModFolder       = "cue.mod"
	cueDepsRootDstPath = cueModFolder + "/pkg/github.com/perses/perses" // for more info see https://cuelang.org/docs/concept/modules-packages-instances/
	maxFileSizeBytes   = 10240                                          // = 10 KiB. Estimated max size for CUE files. Limit required by gosec.
)

// InstallCueDepsFromSources installs the common CUE package as a dependency
func InstallCueDepsFromSources(cueSchemasPath, version string) error {
	if _, err := os.Stat(cueModFolder); os.IsNotExist(err) {
		return fmt.Errorf("unable to find the CUE module folder. Please run 'cue mod init'")
	} else if err != nil {
		return err
	}

	if err := sources.DownloadAndExtract(cueSchemasPath, cueDepsRootDstPath, maxFileSizeBytes, version); err != nil {
		return fmt.Errorf("error installing the common CUE package as a dependency: %v", err)
	}

	return nil
}
