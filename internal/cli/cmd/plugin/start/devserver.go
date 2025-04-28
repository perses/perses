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

//go:build !windows

package start

import (
	"context"
	"fmt"
	"io"
	"os/exec"
	"syscall"

	"github.com/fatih/color"
	"github.com/perses/common/async"
	"github.com/sirupsen/logrus"
)

type devserver struct {
	async.SimpleTask
	cmd        *exec.Cmd
	pluginName string
}

func newDevServer(pluginName, pluginPath, rsbuildScriptName string, writer, errWriter io.Writer, c *color.Color) *devserver {
	streamWriter := newPrefixedStream(pluginName, writer, c)
	streamErrWriter := newPrefixedStream(pluginName, errWriter, c)

	cmd := exec.Command("npm", "run", rsbuildScriptName)
	cmd.Stdout = streamWriter
	cmd.Stderr = streamErrWriter
	cmd.Dir = pluginPath
	// Request the OS to assign a process group to the new process, to which all its children will belong
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	return &devserver{
		cmd:        cmd,
		pluginName: pluginName,
	}
}

func (d *devserver) Execute(ctx context.Context, _ context.CancelFunc) error {
	if err := d.cmd.Start(); err != nil {
		return err
	}
	<-ctx.Done()
	// Send kill signal to the process group instead of a single process
	// (it gets the same value as the PID, only negative)
	// This will ensure the process and all its children are killed.
	_ = syscall.Kill(-d.cmd.Process.Pid, syscall.SIGKILL)
	if err := d.cmd.Wait(); err != nil {
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
