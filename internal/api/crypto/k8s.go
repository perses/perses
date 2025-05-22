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

package crypto

import (
	"fmt"

	"github.com/labstack/echo/v4"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// Returns initialized config, allows local usage (outside cluster) based on provided kubeconfig or in-cluster
// service account usage
func InitKubeConfig(kcLocation string) (*rest.Config, error) {
	if kcLocation != "" {
		kubeConfig, err := clientcmd.BuildConfigFromFlags("", kcLocation)
		if err != nil {
			return nil, fmt.Errorf("unable to build rest config based on provided path to kubeconfig file: %w", err)
		}
		return kubeConfig, nil
	}

	kubeConfig, err := rest.InClusterConfig()
	if err != nil {
		return nil, fmt.Errorf("cannot find Service Account in pod to build in-cluster rest config: %w", err)
	}

	return kubeConfig, nil
}

/*
 * These functions are used to retrieve the Authorization Header from the current state of the
 * request and the server configuration. These are used for local development of perses, enabling
 * the usage of the frontend without the need to define and forward a token from the frontend
 */
func GetAuthnHeaderFromLocation(ctx echo.Context, kcLocation string) string {
	if len(kcLocation) == 0 {
		return ctx.Request().Header.Get("Authorization")
	}
	kubeconfig, err := InitKubeConfig(kcLocation)
	if err != nil {
		return ""
	}
	return fmt.Sprintf("bearer %s", kubeconfig.BearerToken)
}

func GetAuthnHeaderFromClient(ctx echo.Context, kubeconfig *rest.Config) string {
	if kubeconfig == nil {
		return ctx.Request().Header.Get("Authorization")
	}
	return fmt.Sprintf("bearer %s", kubeconfig.BearerToken)
}
