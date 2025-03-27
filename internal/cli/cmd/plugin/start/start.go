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
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/fatih/color"
	"github.com/perses/common/async"
	"github.com/perses/common/async/taskhelper"
	"github.com/perses/perses/internal/api/plugin"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/pkg/client/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

const defaultRSBuildPort = 3000

var (
	portRegexp = regexp.MustCompile(`(?m)port\s*:\s*(\d+)`)
	nameRegexp = regexp.MustCompile(`(?m)name\s*:\s*'?"?(\w+)'?"?`)
)

func extractServerPort(data []byte) (int, error) {
	// We are trying to find the config:
	//  server: {
	//    port: 8080,
	//  }
	// If not find, the default port will be 3000 as defined in the rsbuild documentation.
	matches := portRegexp.FindSubmatch(data)
	if len(matches) != 2 {
		return defaultRSBuildPort, nil
	}
	return strconv.Atoi(string(matches[1]))
}

func extractPluginName(data []byte) (string, error) {
	matches := nameRegexp.FindSubmatch(data)
	if len(matches) != 2 {
		return "", errors.New("unable to find the plugin name")
	}
	return string(matches[1]), nil
}

func getServerPortAndExactPluginName(pluginPath string) (int, string, error) {
	// todo we should support all format supported by rsbuild: https://rsbuild.dev/guide/basic/configure-rsbuild#configuration-file
	configPath := filepath.Join(pluginPath, "rsbuild.config.ts")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return 0, "", err
	}
	port, err := extractServerPort(data)
	if err != nil {
		return 0, "", err
	}
	name, err := extractPluginName(data)
	if err != nil {
		return 0, "", err
	}
	return port, name, nil
}

// buildTasks is responsible to create the list of tasks that will be executed.
// It will wrap the devserver in a taskhelper.Helper and create a signal listener.
func buildDevServerTasks(servers []*devserver) []taskhelper.Helper {
	var tasks []taskhelper.Helper
	signalsListener, _ := taskhelper.New(async.NewSignalListener(syscall.SIGINT, syscall.SIGTERM))
	tasks = append(tasks, signalsListener)
	for _, server := range servers {
		task, _ := taskhelper.New(server)
		tasks = append(tasks, task)
	}
	return tasks
}

func buildWaitDevServerTasks(pluginInDev []*v1.PluginInDevelopment) []taskhelper.Helper {
	var result []taskhelper.Helper
	for _, plg := range pluginInDev {
		w := &waiter{
			serverURL:  common.NewURL(plg.URL),
			pluginName: plg.Name,
		}
		task, _ := taskhelper.New(w)
		result = append(result, task)
	}
	return result
}

type option struct {
	persesCMD.Option
	all        bool
	pluginList []string
	apiClient  api.ClientInterface
	writer     io.Writer
	errWriter  io.Writer
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		if o.all {
			return errors.New("you cannot have arguments when the flag --all is set")
		}
		o.pluginList = args
	} else if o.all {
		// We are assuming we are in a mono-repo, and we are able to find the plugins in the workspace list of the file `package.json`.
		if err := o.completeAllPlugin(); err != nil {
			return err
		}
	} else {
		// In that case, we will start the plugin in the current directory.
		o.pluginList = []string{"."}
	}
	apiClient, err := config.Global.GetAPIClient()
	if err != nil {
		return err
	}
	o.apiClient = apiClient
	return nil
}

func (o *option) completeAllPlugin() error {
	pkg, err := plugin.ReadPackage(".")
	if err != nil {
		return err
	}
	o.pluginList = pkg.Workspaces
	return nil
}

func (o *option) Validate() error {
	cfg, err := o.apiClient.Config()
	if err != nil {
		return err
	}
	if !cfg.Plugin.EnableDev {
		return errors.New("remote server is not configured to receive plugin in development")
	}
	return nil
}

func (o *option) Execute() error {
	var servers []*devserver
	var pluginInDev []*v1.PluginInDevelopment
	colors := generateColors(len(o.pluginList))
	for i, pluginName := range o.pluginList {
		s, cfg, err := o.preparePlugin(pluginName, colors[i])
		if err != nil {
			logrus.WithError(err).Errorf("failed to prepare plugin %q", pluginName)
			continue
		}
		servers = append(servers, s)
		pluginInDev = append(pluginInDev, cfg)
	}

	devServerTasks := buildDevServerTasks(servers)
	waitDevServerTasks := buildWaitDevServerTasks(pluginInDev)

	// create the primary context that must be shared by every task
	ctx, cancel := context.WithCancel(context.Background())
	// in any case, call the cancel method to release any possible resources.
	defer cancel()
	// launch every devserver in a goroutine
	for _, task := range devServerTasks {
		taskhelper.Run(ctx, cancel, task)
	}
	for _, task := range waitDevServerTasks {
		taskhelper.Run(ctx, cancel, task)
	}
	taskhelper.WaitAll(time.Second*60, waitDevServerTasks)
	// Register the plugin in development
	if apiErr := o.apiClient.V1().Plugin().PushDevPlugin(pluginInDev); apiErr != nil {
		logrus.WithError(apiErr).Error("failed to register the plugin in development")
		cancel()
	}
	// Wait for context to be canceled or tasks to be ended and wait for graceful stop
	taskhelper.JoinAll(ctx, time.Second*30, devServerTasks)
	return nil
}

func (o *option) preparePlugin(pluginPath string, c *color.Color) (*devserver, *v1.PluginInDevelopment, error) {
	// First, we need to find the command to start the dev server.
	npmPackageData, readErr := plugin.ReadPackage(pluginPath)
	if readErr != nil {
		return nil, nil, fmt.Errorf("failed to read package for the plugin %q", pluginPath)
	}
	var rsbuildCMD string
	for scriptName, script := range npmPackageData.Scripts {
		if strings.Contains(script, "rsbuild dev") {
			rsbuildCMD = scriptName
		}
	}
	if rsbuildCMD == "" {
		return nil, nil, fmt.Errorf("unable to find how to run the rsbuild dev server in the file package.json for the plugin %q", pluginPath)
	}
	// Then, we need to find which port is used by the dev server.
	port, pluginName, err := getServerPortAndExactPluginName(pluginPath)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get the dev server port for the plugin %q", pluginPath)
	}
	abs, err := filepath.Abs(pluginPath)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get the absolute path for the plugin %q", pluginPath)
	}
	server := newDevServer(pluginName, pluginPath, rsbuildCMD, o.writer, o.errWriter, c)
	pluginInDevelopment := &v1.PluginInDevelopment{
		Name:         pluginName,
		URL:          common.MustParseURL(fmt.Sprintf("http://localhost:%d", port)),
		AbsolutePath: abs,
	}
	return server, pluginInDevelopment, nil
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "start [PLUGIN_NAME]",
		Short: "Start the plugin",
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().BoolVar(&o.all, "all", false, "In case you are in a mono-repo, when set to true, it will start all plugins")
	return cmd
}
