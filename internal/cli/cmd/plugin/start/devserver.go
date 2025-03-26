// Copyright 2025 The Perses Authors
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

package start

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os/exec"
	"time"

	"github.com/perses/common/async"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/sirupsen/logrus"
)

type waiter struct {
	async.SimpleTask
	serverURL  *common.URL
	pluginName string
}

func (w *waiter) Execute(_ context.Context, _ context.CancelFunc) error {
	logrus.Infof("waiting for server %s to be ready", w.serverURL.String())
	timeoutTicker := time.NewTicker(5 * time.Second)
	defer timeoutTicker.Stop()
	w.serverURL.Path = fmt.Sprintf("/plugins/%s/mf-manifest.json", w.pluginName)
	for range timeoutTicker.C {
		resp, err := http.Get(w.serverURL.String())
		if err == nil && resp.StatusCode == http.StatusOK {
			_ = resp.Body.Close()
			return nil
		}
	}
	return nil
}

func (w *waiter) String() string {
	return fmt.Sprintf("waiter for plugin %s", w.pluginName)
}

type devserver struct {
	async.SimpleTask
	pluginPath        string
	rsbuildScriptName string
	writer            io.Writer
	errWriter         io.Writer
}

func newDevServer(pluginName, pluginPath, rsbuildScriptName string, writer, errWriter io.Writer) *devserver {
	return &devserver{
		pluginPath:        pluginPath,
		rsbuildScriptName: rsbuildScriptName,
		writer:            newPrefixedStream(pluginName, writer),
		errWriter:         newPrefixedStream(pluginName, errWriter),
	}
}

func (d *devserver) Execute(ctx context.Context, _ context.CancelFunc) error {
	logrus.Infof("starting plugin %s", d.pluginPath)
	cmd := exec.CommandContext(ctx, "npm", "run", d.rsbuildScriptName) // nolint: gosec
	cmd.Stdout = d.writer
	cmd.Stderr = d.errWriter
	cmd.Dir = d.pluginPath
	return cmd.Run()
}

func (d *devserver) String() string {
	return fmt.Sprintf("dev server for plugin %s", d.pluginPath)
}
