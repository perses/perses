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
	"os/exec"

	"github.com/fatih/color"
	"github.com/perses/common/async"
	"github.com/sirupsen/logrus"
)

// As you can see, the implementation of the devserver on windows is slightly different from other platforms.
// The main difference is that we don't create a process group for the devserver, mainly because I didn't find a way to do it.
// There is a possibility this implementation won't work as expected, and the devserver won't be killed when the context is done.
// The result will be to have a zombie process that needs to be killed manually if you are able to find it.
// See https://stackoverflow.com/a/68179972

type devserver struct {
	async.SimpleTask
	pluginName        string
	pluginPath        string
	rsbuildScriptName string
	writer            io.Writer
	errWriter         io.Writer
}

func newDevServer(pluginName, pluginPath, rsbuildScriptName string, writer, errWriter io.Writer, c *color.Color) *devserver {
	streamWriter := newPrefixedStream(pluginName, writer, c)
	streamErrWriter := newPrefixedStream(pluginName, errWriter, c)

	return &devserver{
		pluginName:        pluginName,
		pluginPath:        pluginPath,
		rsbuildScriptName: rsbuildScriptName,
		writer:            streamWriter,
		errWriter:         streamErrWriter,
	}
}

func (d *devserver) Execute(ctx context.Context, _ context.CancelFunc) error {
	cmd := exec.CommandContext(ctx, "npm", "run", d.rsbuildScriptName)
	cmd.Stdout = d.writer
	cmd.Stderr = d.errWriter
	cmd.Dir = d.pluginPath
	if err := cmd.Start(); err != nil {
		return err
	}
	<-ctx.Done()
	if err := cmd.Wait(); err != nil {
		// As the dev server is a task that doesn't stop, killing the process with a SIGKILL signal is causing d.cmd.Wait to return an error.
		// So most of the time it is safe to ignore the error. It is interesting to log it for debug purpose.
		logrus.WithError(err).Debugf("wait for plugin %s failed", d.pluginName)
	}
	logrus.Infof("dev server for plugin %s has been killed", d.pluginName)
	return nil
}

func (d *devserver) String() string {
	return fmt.Sprintf("dev server for plugin %s", d.pluginName)
}
