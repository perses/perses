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

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/shared/schemas"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

func main() {
	cfg := config.Schemas{}
	_ = cfg.Verify()
	sch := schemas.New(cfg)
	for _, loader := range sch.GetLoaders() {
		if err := loader.Load(); err != nil {
			logrus.Fatal(err)
		}
	}
	dirEntries, err := os.ReadDir(config.DefaultPanelsPath)
	if err != nil {
		logrus.Fatal(err)
	}
	for _, dir := range dirEntries {
		data, readErr := os.ReadFile(filepath.Join(config.DefaultPanelsPath, dir.Name(), fmt.Sprintf("%s.json", dir.Name())))
		if readErr != nil {
			logrus.Fatal(readErr)
		}
		plugin := &modelV1.Plugin{}
		if jsonErr := json.Unmarshal(data, plugin); jsonErr != nil {
			logrus.Fatal(jsonErr)
		}
		if validateErr := sch.ValidatePanel(*plugin, dir.Name()); validateErr != nil {
			logrus.Fatal(validateErr)
		}
	}
}
