// Copyright 2023 The Perses Authors
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

package login

import (
	"fmt"
	"io"
	"net/url"
	"os"

	"github.com/go-kit/log/term"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/internal/cli/read"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/spf13/cobra"
	terminal "golang.org/x/term"
)

func readPassword() (string, error) {
	in := os.Stdin
	if term.IsTerminal(in) {
		// read using terminal
		result, err := terminal.ReadPassword(int(in.Fd()))
		return string(result), err
	}
	// read using reader
	var result string
	_, err := fmt.Fscan(in, &result)
	return result, err
}

type option struct {
	persesCMD.Option
	writer      io.Writer
	url         string
	username    string
	password    string
	token       string
	insecureTLS bool
}

func (o *option) Complete(args []string) error {
	if len(args) > 1 {
		return fmt.Errorf("only the server URL should be specified as an argument")
	}

	if len(args) == 0 {
		o.url = config.Global.RestClientConfig.URL
	} else {
		o.url = args[0]
	}
	if len(o.url) == 0 {
		return fmt.Errorf("no URL has been provided or has not been found in the previous configuration")
	}
	return nil
}

func (o *option) Validate() error {
	if _, err := url.Parse(o.url); err != nil {
		return err
	}
	if len(o.username) > 0 && len(o.token) > 0 {
		return fmt.Errorf("--token and --username are mutually exclusive")
	}
	return nil
}

func (o *option) Execute() error {
	httpConfig := perseshttp.RestConfigClient{
		URL:         o.url,
		InsecureTLS: o.insecureTLS,
	}
	if len(o.token) == 0 {
		if err := o.readAndSetCredentialInput(); err != nil {
			return err
		}
		if err := o.setToken(httpConfig); err != nil {
			return err
		}
	}
	httpConfig.Token = o.token
	if err := config.Write(&config.Config{
		RestClientConfig: httpConfig,
	}); err != nil {
		return err
	}
	return output.HandleString(o.writer, fmt.Sprintf("successfully log in %s", o.url))
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) setToken(httpConfig perseshttp.RestConfigClient) error {
	restClient, err := perseshttp.NewFromConfig(httpConfig)
	if err != nil {
		return err
	}
	token, err := api.NewWithClient(restClient).Auth().Login(o.username, o.password)
	if err != nil {
		return err
	}
	o.token = token
	return nil
}

func (o *option) readAndSetCredentialInput() error {
	if len(o.username) == 0 {
		_, _ = fmt.Fprint(o.writer, "Username: ")
		user, err := read.FromStdin()
		if err != nil {
			return err
		}
		o.username = user
	}
	if len(o.password) == 0 {
		_, _ = fmt.Fprint(o.writer, "Password: ")
		password, err := readPassword()
		if err != nil {
			return err
		}
		o.password = password
	}
	return nil
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "login [URL]",
		Short: "Log in to the Perses API",
		Example: `
# Log in to the given server
percli login https://perses.dev
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().BoolVar(&o.insecureTLS, "insecure-skip-tls-verify", o.insecureTLS, "If true the server's certificate will not be checked for validity. This will make your HTTPS connections insecure.")
	cmd.Flags().StringVarP(&o.username, "username", "u", "", "Username used for the authentication.")
	cmd.Flags().StringVarP(&o.password, "password", "p", "", "Password used for the authentication.")
	cmd.Flags().StringVar(&o.token, "token", "", "Bearer token for authentication to the API server")
	return cmd
}
