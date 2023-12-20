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
	writer       io.Writer
	url          string
	username     string
	password     string
	accessToken  string
	refreshToken string
	insecureTLS  bool
	apiClient    api.ClientInterface
	restConfig   perseshttp.RestConfigClient
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
		return fmt.Errorf("no URL has been provided neither found in the previous configuration")
	}
	o.restConfig = perseshttp.RestConfigClient{
		URL:         o.url,
		InsecureTLS: o.insecureTLS,
	}
	restClient, err := perseshttp.NewFromConfig(o.restConfig)
	if err != nil {
		return err
	}
	o.apiClient = api.NewWithClient(restClient)
	return nil
}

func (o *option) Validate() error {
	if _, err := url.Parse(o.url); err != nil {
		return err
	}
	if len(o.username) > 0 && len(o.accessToken) > 0 {
		return fmt.Errorf("--token and --username are mutually exclusive")
	}
	return nil
}

func (o *option) Execute() error {
	cfg, err := o.apiClient.Config()
	if err != nil {
		return err
	}
	if cfg.Security.EnableAuth && len(o.accessToken) == 0 {
		if readErr := o.readAndSetCredentialInput(); readErr != nil {
			return readErr
		}
		if authErr := o.authAndSetToken(); authErr != nil {
			return authErr
		}
	}
	o.restConfig.Token = o.accessToken
	if writeErr := config.Write(&config.Config{
		RestClientConfig: o.restConfig,
		RefreshToken:     o.refreshToken,
	}); writeErr != nil {
		return writeErr
	}
	return output.HandleString(o.writer, fmt.Sprintf("successfully logged in %s", o.url))
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) authAndSetToken() error {
	token, err := o.apiClient.Auth().Login(o.username, o.password)
	if err != nil {
		return err
	}
	o.accessToken = token.AccessToken
	o.refreshToken = token.RefreshToken
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
	cmd.Flags().StringVar(&o.accessToken, "token", "", "Bearer token for authentication to the API server")
	return cmd
}
