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
	"os"

	"github.com/perses/perses/internal/cli/cmd/apply"
	"github.com/perses/perses/internal/cli/cmd/describe"
	"github.com/perses/perses/internal/cli/cmd/get"
	"github.com/perses/perses/internal/cli/cmd/login"
	"github.com/perses/perses/internal/cli/cmd/project"
	"github.com/perses/perses/internal/cli/cmd/remove"
	"github.com/perses/perses/internal/cli/cmd/version"
	cmdUtils "github.com/perses/perses/internal/cli/utils"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

var (
	configPath string
	logLevel   string
)

func newRootCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "percli",
		Short: "Command line interface to interact with the Perses API",
	}

	// The list of the commands supported
	cmd.AddCommand(apply.NewCMD())
	cmd.AddCommand(describe.NewCMD())
	cmd.AddCommand(get.NewCMD())
	cmd.AddCommand(login.NewCMD())
	cmd.AddCommand(project.NewCMD())
	cmd.AddCommand(remove.NewCMD())
	cmd.AddCommand(version.NewCMD())

	// the list of the global flags supported
	cmd.PersistentFlags().StringVar(&configPath, "percliconfig", cmdUtils.GetDefaultConfigPath(), "Path to the percliconfig file to use for CLI requests.")
	cmd.PersistentFlags().StringVar(&logLevel, "log.level", "info", "Set the log verbosity level. Possible values: panic, fatal, error, warning, info, debug, trace")

	// Some custom settings about the percli itself
	cmd.SilenceUsage = true
	cmd.SetOut(os.Stdout)
	cmd.SetErr(os.Stderr)
	return cmd
}

func initLogrus() {
	logrus.SetFormatter(&logrus.TextFormatter{
		// Useful when you have a TTY attached.
		// Issue explained here when this field is set to false by default:
		// https://github.com/sirupsen/logrus/issues/896
		FullTimestamp: true,
	})
	level, err := logrus.ParseLevel(logLevel)
	if err != nil {
		logrus.WithError(err).Fatal("unable to set the log level")
	}
	logrus.SetLevel(level)
}

func initializeCLI() {
	initLogrus()
	cmdUtils.InitGlobalConfig(configPath)
}

func main() {
	cobra.OnInitialize(initializeCLI)
	rootCmd := newRootCommand()

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
