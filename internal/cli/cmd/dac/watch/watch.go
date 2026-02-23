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

package watch

import (
	"context"
	"fmt"
	"io"
	"os"
	"syscall"
	"time"

	"github.com/perses/common/async"
	"github.com/perses/common/async/taskhelper"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	sourceDir     string
	output        string
	debounceDelay time.Duration
	buildArgs     []string
	writer        io.Writer
	errWriter     io.Writer
}

// Complete initializes the watch command with the provided arguments
func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		o.sourceDir = args[0]
	} else {
		o.sourceDir = "."
	}
	return nil
}

// Validate ensures the output directory is properly configured and exists
func (o *option) Validate() error {
	// Use the configured output folder from dac command
	if config.Global.Dac.OutputFolder == "" {
		config.Global.Dac.OutputFolder = "built"
	}

	// Ensure output directory exists
	if err := os.MkdirAll(config.Global.Dac.OutputFolder, 0750); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}
	return nil
}

// Execute starts the file watcher and manages the watch lifecycle
func (o *option) Execute() error {
	buildDir := config.Global.Dac.OutputFolder

	logrus.Info("📦 Dashboard-as-Code Watcher")
	logrus.Infof("   Source: %s", o.sourceDir)
	logrus.Infof("   Output: %s", buildDir)
	logrus.Infof("   Format: %s", o.output)
	logrus.Info("")
	logrus.Info("👀 Watching for changes... (Ctrl+C to stop)")
	logrus.Info("")

	// Create the primary context
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Create watcher task
	watcher := newWatcher(
		o.sourceDir,
		buildDir,
		o.output,
		o.buildArgs,
		o.debounceDelay,
		o.writer,
		o.errWriter,
	)

	// Wrap tasks with taskhelper
	var tasks []taskhelper.Helper

	// Setup signal listener
	signalListener, _ := taskhelper.New(async.NewSignalListener(syscall.SIGINT, syscall.SIGTERM, syscall.SIGKILL))
	tasks = append(tasks, signalListener)

	// Add watcher task
	watcherTask, _ := taskhelper.New(watcher)
	tasks = append(tasks, watcherTask)

	// Run all tasks
	for _, task := range tasks {
		taskhelper.Run(ctx, cancel, task)
	}

	// Wait for all tasks to finish
	taskhelper.JoinAll(ctx, time.Second*30, tasks)
	return nil
}

// SetWriter sets the standard output writer for the watch command
func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

// SetErrWriter sets the error output writer for the watch command
func (o *option) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

// NewCMD creates the watch command for automatic Dashboard-as-Code rebuilding
func NewCMD() *cobra.Command {
	o := &option{
		debounceDelay: 500 * time.Millisecond,
		output:        "yaml",
	}

	cmd := &cobra.Command{
		Use:   "watch [source-dir]",
		Short: "Watch Dashboard-as-Code files and auto-rebuild on changes",
		Long: `Watch Go/CUE files in the specified directory and automatically rebuild JSON/YAML outputs when files are saved.

This command provides a development workflow similar to frontend hot-reload, where changes to your Dashboard-as-Code files are immediately compiled and made available for provisioning.

The watcher will:
- Perform an initial build
- Monitor all .go and .cue files in the source directory
- Rebuild automatically when files are modified
- Output results to the build directory (default: ./built)

File identification:
- Go files: Must be "package main" to be built as dashboards
- CUE files: Identified as dashboards if they have a named import "dashboardBuilder" OR if the filename contains "dashboard"
- Library files: Other .go/.cue files are treated as libraries and trigger rebuilds of dependent dashboards

Combine this with Perses provisioning to see your dashboard changes reflected in the UI automatically.`,
		Example: `# Watch current directory, output to ./built
percli dac watch

# Watch specific directory
percli dac watch ./my-dashboards

# Watch and output as JSON
percli dac watch ./my-dashboards -ojson

# Watch with custom output directory
percli dac watch ./my-dashboards --dac.output_folder=./provisioning/dashboards

# Pass extra arguments to Go programs
percli dac watch ./my-dashboards -- --arg1=value1 --arg2=value2`,
		Args: cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}

	cmd.Flags().StringVarP(&o.output, "output", "o", "yaml", "Output format (json or yaml)")
	cmd.Flags().DurationVar(&o.debounceDelay, "debounce", 500*time.Millisecond, "Debounce delay for file changes")

	return cmd
}
