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
	"context"
	"errors"
	"fmt"
	"io"
	"net/url"
	"time"

	"github.com/charmbracelet/huh"
	"github.com/perses/perses/internal/api/utils"
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

const (
	nativeProvider = "native"
)

type option struct {
	persesCMD.Option
	writer               io.Writer
	url                  string
	username             string
	password             string
	clientID             string
	clientSecret         string
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
	// If the user has provided username and password, we use the native provider
	if len(o.username) > 0 && len(o.password) > 0 {
		token, err := o.apiClient.Auth().Login(o.username, o.password)
		if err != nil {
			return err
		}
		o.accessToken = token.AccessToken
		o.refreshToken = token.RefreshToken
		return nil
	}

	// If the user has provided clientID and clientSecret, we use the robotic access
	if len(o.clientID) > 0 && len(o.clientSecret) > 0 {
		token, err := o.apiClient.Auth().ClientCredentialsToken(string(o.externalAuthKind), o.externalAuthProvider, o.clientID, o.clientSecret)
		if err != nil {
			return err
		}
		o.accessToken = token.AccessToken
		o.refreshToken = token.RefreshToken
		return nil
	}

	// Otherwise, we start the device code flow
	deviceCodeResponse, err := o.apiClient.Auth().DeviceCode(string(o.externalAuthKind), o.externalAuthProvider)
	if err != nil {
		return err
	}

	// Display the user code and verification URL
	if outErr := output.HandleString(o.writer, fmt.Sprintf("Go to %s and enter this user code: %s\nWaiting for user to authorize the application...", deviceCodeResponse.VerificationURI, deviceCodeResponse.UserCode)); err != nil {
		return outErr
	}

	// Compute the expiry and interval from the response
	ctx := context.Background()
	if !deviceCodeResponse.Expiry.IsZero() {
		var cancel context.CancelFunc
		ctx, cancel = context.WithDeadline(ctx, deviceCodeResponse.Expiry)
		defer cancel()
	}
	interval := deviceCodeResponse.Interval
	if interval == 0 {
		interval = 5
	}

	// Poll for an access token
	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			tokenResponse, tokenErr := o.apiClient.Auth().DeviceAccessToken(string(o.externalAuthKind), o.externalAuthProvider, deviceCodeResponse.DeviceCode)
			if tokenErr != nil {
				continue
			}
			// Handle the access token
			o.accessToken = tokenResponse.AccessToken
			o.refreshToken = tokenResponse.RefreshToken
			return nil
		}
	}
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

func (o *option) readAndSetClientCredentials() error {
	if len(o.clientID) == 0 {
		input := huh.NewInput().Title("Client ID").Value(&o.clientID)
		if err := input.Run(); err != nil {
			return err
		}
		if err := output.HandleString(o.writer, input.View()); err != nil {
			return err
		}
	}
	if len(o.clientSecret) == 0 {
		input := huh.NewInput().Title("Client Secret").EchoMode(huh.EchoModeNone).Value(&o.clientSecret)
		if err := input.Run(); err != nil {
			return err
		}
		if err := output.HandleString(o.writer, input.View()); err != nil {
			return err
		}
	}
	return nil
}

// trySetLoginInputExternal will try to set the external auth provider based on the slugID.
// If the slugID does not exist, it will return an error.
func (o *option) trySetLoginInputExternal(providers backendConfig.AuthProviders, slugID string) error {
	for _, prov := range providers.OIDC {
		if prov.SlugID == slugID {
			return o.setLoginInputExternal(externalAuthKindOIDC, slugID)
		}
	}
	for _, prov := range providers.OAuth {
		if prov.SlugID == slugID {
			return o.setLoginInputExternal(externalAuthKindOAuth, slugID)
		}
	}
	return fmt.Errorf("provider %q does not exist", slugID)
}

func (o *option) newLoginInputExternalModifier(kind externalAuthKind, slugID string) func() error {
	return func() error {
		return o.setLoginInputExternal(kind, slugID)
	}
}

func (o *option) setLoginInputExternal(kind externalAuthKind, slugID string) error {
	o.externalAuthKind = kind
	o.externalAuthProvider = slugID

	// In case the user is trying to set client id / secret, we do set
	if len(o.clientID) > 0 || len(o.clientSecret) > 0 {
		return o.readAndSetClientCredentials()
	}
	return nil

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

	// In case the user is trying to set user / password, we don´t make selection. We know it's native provider.
	if len(o.username) > 0 || len(o.password) > 0 {
		return o.readAndSetLoginInputNative()
	}

	// Otherwise it's considered that it wants to use an external provider
	if err := o.readAndSetExternalProvider(providers); err != nil {
		return err
	}

	return nil
}

// readAndSetExternalProvider will prompt the user to select the external provider to use.
func (o *option) readAndSetExternalProvider(providers backendConfig.AuthProviders) error {
	if len(o.externalAuthProvider) > 0 {
		// The user gave an external auth provider, we try to set it.
		return o.trySetLoginInputExternal(providers, o.externalAuthProvider)
	}
	// The first step is to collect the different providers and store it into items + modifiers.
	// items will be the selection items to display to users.
	// modifiers will be the action to save the different user input into option struct.
	modifiers := map[string]func() error{}

	var options []huh.Option[string]

	// We still give the possibility to the user to choose the native provider if it's supported by the backend
	if providers.EnableNative {
		optKey := "Native (username/password)"
		optValue := nativeProvider
		options = append(options, huh.NewOption(optKey, optValue))
		modifiers[optValue] = o.readAndSetLoginInputNative

		// Make sure that if user started to provider username or password, it chooses by default the native provider
		if len(o.username) > 0 || len(o.password) > 0 {
			return modifiers[optValue]()
		}
	}

	// Saving OIDC item(s)
	for _, prov := range providers.OIDC {
		optKey := fmt.Sprintf("OIDC (%s)", prov.Name)
		optValue := prov.SlugID
		options = append(options, huh.NewOption(optKey, optValue))
		modifiers[optValue] = o.newLoginInputExternalModifier(externalAuthKindOIDC, prov.SlugID)
	}

	// Saving OAuth 2.0 item(s)
	for _, prov := range providers.OAuth {
		optKey := fmt.Sprintf("OAuth 2.0 (%s)", prov.Name)
		optValue := prov.SlugID
		options = append(options, huh.NewOption(optKey, optValue))
		modifiers[optValue] = o.newLoginInputExternalModifier(externalAuthKindOAuth, prov.SlugID)
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
	cmd.Flags().StringVar(&o.clientID, "client-id", "", "Client ID used for robotic access when using external authentication provider.")
	cmd.Flags().StringVar(&o.clientSecret, "client-secret", "", "Client Secret used for robotic access when using external authentication provider.")
	cmd.Flags().StringVar(&o.accessToken, "token", "", "Bearer token for authentication to the API server")
	cmd.Flags().StringVar(&o.externalAuthProvider, "provider", "", "External authentication provider identifier. (slug_id)")
	return cmd
}
