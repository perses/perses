// Copyright The Perses Authors
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
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"syscall"

	"github.com/fatih/color"
	"github.com/perses/common/async"
	"github.com/sirupsen/logrus"
)

type devserver struct {
	async.SimpleTask
	cmd        *exec.Cmd
	pluginName string
	portChan   chan int
}

type portCapturingWriter struct {
	writer    io.Writer
	portChan  chan int
	portSent  bool
	portRegex *regexp.Regexp
}

func newPortCapturingWriter(writer io.Writer, portChan chan int) *portCapturingWriter {
	// Matches patterns like "Local:	http://localhost:3000" or "Local: http://127.0.0.1:3000" or [PERSES_PLUGIN] NAME="Test" PORT="3009" PROTOCOL="https"
	portRegex := regexp.MustCompile(`(?m)(?:Local:\s*https?://(?:localhost|127\.0\.0\.1):|\[PERSES_PLUGIN\]\s*PORT=")(\d+)`)

	return &portCapturingWriter{
		writer:    writer,
		portChan:  portChan,
		portRegex: portRegex,
	}
}

func (p *portCapturingWriter) Write(data []byte) (int, error) {
	n, err := p.writer.Write(data)

	// Only extract port once
	if !p.portSent {
		if matches := p.portRegex.FindSubmatch(data); len(matches) > 1 {
			if port, err := strconv.Atoi(string(matches[1])); err == nil {
				p.portChan <- port
				p.portSent = true
			}
		}
	}

	return n, err
}

func (d *devserver) GetPort() <-chan int {
	return d.portChan
}

func newDevServer(pluginName, pluginPath, rsbuildScriptName string, writer, errWriter io.Writer, c *color.Color) *devserver {
	portChan := make(chan int)

	streamWriter := newPrefixedStream(pluginName, writer, c)
	streamErrWriter := newPrefixedStream(pluginName, errWriter, c)
	portCapturingWriter := newPortCapturingWriter(streamWriter, portChan)

	cmd := exec.Command("npm", "run", rsbuildScriptName)
	cmd.Stdout = portCapturingWriter
	cmd.Stderr = streamErrWriter
	cmd.Dir = pluginPath
	// PERSES_CLI indicates to the plugin dev server that it is run by the perses CLI
	cmd.Env = append(os.Environ(), "PERSES_CLI=true")
	// Request the OS to assign a process group to the new process, to which all its children will belong
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	return &devserver{
		cmd:        cmd,
		pluginName: pluginName,
		portChan:   portChan,
	}
}

func (d *devserver) Execute(ctx context.Context, _ context.CancelFunc) error {
	if err := d.cmd.Start(); err != nil {
		return err
	}
	<-ctx.Done()
	// Close the port channel when the dev server is shutting down
	close(d.portChan)
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
