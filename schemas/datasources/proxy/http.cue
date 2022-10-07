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

package proxy

#HTTPAllowedEndpoint: {
	endpoint_pattern: string
	method:           'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE'
}

#HTTPPRoxy: {
	kind: "HTTPProxy"
	spec: {
		// url is the url of the datasource. It is not the url of the proxy.
		// The Perses server is the proxy, so it needs to know where to redirect the request.
		url: string
		// allowed_endpoints is a list of tuples of http methods and http endpoints that will be accessible.
		// Leave it empty if you don't want to restrict the access to the datasource.
		allowed_endpoints?: [ ...HTTPAllowedEndpoint]
		// headers can be used to provide additional headers that need to be forwarded when requesting the datasource
		headers?: {[string]: string}
		// secret is the name of the secret that should be used for the proxy or discovery configuration
		// It will contain any sensitive information such as password, token, certificate.
		secret?: string
	}
}
