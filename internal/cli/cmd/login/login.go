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
	"errors"
	"fmt"
	"io"
	"net/url"

	"github.com/charmbracelet/huh"
	"github.com/perses/perses/internal/api/shared/utils"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/perseshttp"
	backendConfig "github.com/perses/perses/pkg/model/api/config"
	"github.com/spf13/cobra"
)

type externalAuthKind string

const (
	externalAuthKindOAuth externalAuthKind = utils.AuthKindOAuth
	externalAuthKindOIDC  externalAuthKind = utils.AuthKindOIDC
)

type option struct {
	persesCMD.Option
	writer               io.Writer
	url                  string
	username             string
	password             string
	externalAuthKind     externalAuthKind
	externalAuthProvider string
	accessToken          string
	refreshToken         string
	insecureTLS          bool
	apiClient            api.ClientInterface
	restConfig           perseshttp.RestConfigClient
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
		if readErr := o.readAndSetLoginInput(cfg.Security.Authentication.Providers); readErr != nil {
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
	if len(o.username) > 0 && len(o.password) > 0 {
		token, err := o.apiClient.Auth().Login(o.username, o.password)
		if err != nil {
			return err
		}
		o.accessToken = token.AccessToken
		o.refreshToken = token.RefreshToken
		return nil
	}

	// TODO: Use o.externalAuthKind and o.externalAuthProvider to start a device code flow
	//   (e.g first calling the api/auth/providers/{oidc|oauth}/{externalAuthProvider}/device/code)
	//   Design in Authentication.md design documentation
	return errors.New("oidc and oauth 2.0 authentication are not yet supported through command line")
}

func (o *option) readAndSetLoginInputNative() error {
	if len(o.username) == 0 {
		input := huh.NewInput().Title("Username").Value(&o.username)
		if err := input.Run(); err != nil {
			return err
		}
		if err := output.HandleString(o.writer, input.View()); err != nil {
			return err
		}
	}
	if len(o.password) == 0 {
		input := huh.NewInput().Title("Password").EchoMode(huh.EchoModeNone).Value(&o.password)
		if err := input.Run(); err != nil {
			return err
		}
		if err := output.HandleString(o.writer, input.View()); err != nil {
			return err
		}
	}
	return nil
}

func (o *option) readAndSetLoginInputExternal(providers backendConfig.AuthProviders, slugID string) error {
	for _, prov := range providers.OIDC {
		if prov.SlugID == slugID {
			return o.setLoginInputExternal(externalAuthKindOIDC, slugID)()
		}
	}
	for _, prov := range providers.OAuth {
		if prov.SlugID == slugID {
			return o.setLoginInputExternal(externalAuthKindOAuth, slugID)()
		}
	}
	return fmt.Errorf("provider %q does not exist", slugID)
}

func (o *option) setLoginInputExternal(kind externalAuthKind, slugID string) func() error {
	return func() error {
		o.externalAuthKind = kind
		o.externalAuthProvider = slugID
		return nil
	}
}

func (o *option) promptProvider(options []huh.Option[string]) (string, error) {
	selectedItem := ""
	sel := huh.NewSelect[string]().
		Title("Select Provider")
	if err := sel.
		Options(options...).
		Value(&selectedItem).Run(); err != nil {
		return "", err
	}

	if err := output.HandleString(o.writer, sel.View()); err != nil {
		return "", err
	}
	return selectedItem, nil
}

func (o *option) readAndSetLoginInput(providers backendConfig.AuthProviders) error {
	if !providers.EnableNative && (len(o.username) > 0 || len(o.password) > 0) {
		return errors.New("username/password input is forbidden as backend does not support native auth provider")
	}

	// In case the user is trying to set user / password, we don´t make selection
	if len(o.username) > 0 || len(o.password) > 0 {
		return o.readAndSetLoginInputNative()
	}

	// In case the user set the provider as argument, we don´t make selection, but validate its input
	if len(o.externalAuthProvider) > 0 {
		return o.readAndSetLoginInputExternal(providers, o.externalAuthProvider)
	}

	// The first step is to collect the different providers and store it into items + modifiers.
	// items will be the selection items to display to users.
	// modifiers will be the action to save the different user input into option struct.
	modifiers := map[string]func() error{}

	var options []huh.Option[string]

	// Saving Native item if supported
	if providers.EnableNative {
		optKey := "Native (username/password)"
		optValue := "native"
		options = append(options, huh.NewOption(optKey, optValue))
		modifiers[optValue] = o.readAndSetLoginInputNative

		// Make sure that if user started to provider username or password, it chooses by default the native provider
		if len(o.username) > 0 || len(o.password) > 0 {
			return modifiers[optValue]()
		}
	}

	// Saving OIDC item(s) if supported
	for _, prov := range providers.OIDC {
		optKey := fmt.Sprintf("OIDC (%s)", prov.Name)
		optValue := prov.SlugID
		options = append(options, huh.NewOption(optKey, optValue))
		modifiers[optValue] = o.setLoginInputExternal(externalAuthKindOAuth, prov.SlugID)
	}

	// Saving OAuth 2.0 item(s) if supported
	for _, prov := range providers.OAuth {
		optKey := fmt.Sprintf("OAuth 2.0 (%s)", prov.Name)
		optValue := prov.SlugID
		options = append(options, huh.NewOption(optKey, optValue))
		//nolint: unparam
		modifiers[optValue] = o.setLoginInputExternal(externalAuthKindOAuth, prov.SlugID)
	}

	// In case there is only one item available, prompt selection is not necessary
	if len(options) == 1 {
		return modifiers[options[0].Value]()
	}

	selectedItem, err := o.promptProvider(options)
	if err != nil {
		return err
	}

	// Apply the modifier of the corresponding item
	return modifiers[selectedItem]()
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
	cmd.Flags().StringVar(&o.externalAuthProvider, "provider", "", "External authentication provider identifier. (slug_id)")
	return cmd
}
