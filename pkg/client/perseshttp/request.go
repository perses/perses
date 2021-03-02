// Copyright 2021 Amadeus s.a.s
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

package perseshttp

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

const (
	defaultAPIPrefix  = "/api"
	defaultAPIVersion = "v1"
)

// QueryInterface defines the query interface that you can set in the Request
type QueryInterface interface {
	GetValues() url.Values
}

// Request allows for building up a request to a server in a chained fashion.
// Any errors are stored until the end of your call, so you only have to
// check once.
type Request struct {
	client    *http.Client
	method    string
	token     string
	basicAuth *BasicAuth
	headers   map[string]string
	ctx       context.Context

	// all component relative to the url
	baseURL *url.URL
	// API
	apiPrefix  string // it's the api prefix such as /api
	apiVersion string
	// Resource
	project  string
	resource string
	name     string

	queryParam url.Values
	body       io.Reader
	err        error
}

// NewRequest creates a new request helper object for accessing resource on a the API
func NewRequest(client *http.Client, method string, baseURL *url.URL, token string, basicAuth *BasicAuth, headers map[string]string) *Request {
	return &Request{
		client:     client,
		method:     method,
		token:      token,
		basicAuth:  basicAuth,
		headers:    headers,
		baseURL:    baseURL,
		apiPrefix:  defaultAPIPrefix,
		apiVersion: defaultAPIVersion,
	}
}

// APIPrefix set the api prefix to used (default /api)
func (r *Request) APIPrefix(apiPrefix string) *Request {
	r.apiPrefix = apiPrefix
	return r
}

// APIVersion set the api version to used (default v1)
func (r *Request) APIVersion(APIVersion string) *Request {
	r.apiVersion = APIVersion
	return r
}

// Project set the project where the resource must be defined. It cannot be used at the same time with Request.Area
func (r *Request) Project(project string) *Request {
	r.project = project
	return r
}

// Resource set the resource that the client want to access (like project, prometheusRule ...etc.)
func (r *Request) Resource(resource string) *Request {
	r.resource = resource
	return r
}

// Name set the name of the resource
func (r *Request) Name(name string) *Request {
	r.name = name
	return r
}

// Query set all queryParameter contains in the query passed as a parameter
func (r *Request) Query(query QueryInterface) *Request {
	if query == nil {
		return r
	}
	if r.queryParam == nil {
		r.queryParam = make(url.Values)
	}
	for k, v := range query.GetValues() {
		r.queryParam[k] = append(r.queryParam[k], v...)
	}
	return r
}

// Body defines the body in the HTTP request.
// The body shall be json compatible
func (r *Request) Body(obj interface{}) *Request {
	data, err := json.Marshal(obj)
	if err != nil {
		r.err = err
	} else {
		r.body = bytes.NewBuffer(data)
	}
	return r
}

// Do build the query and execute it.
// The error and/or the response from the server are set in the object Response
func (r *Request) Do() *Response {
	if r.err != nil {
		return &Response{err: r.err}
	}

	httpClient := r.client
	if httpClient == nil {
		httpClient = http.DefaultClient
	}

	httpRequest, err := r.prepareRequest()

	if err != nil {
		return &Response{err: err}
	}

	resp, err := httpClient.Do(httpRequest)

	if err != nil {
		ctx := httpRequest.Context()
		if ctx != nil {
			select {
			case <-ctx.Done():
				return &Response{err: ctx.Err()}
			default:
			}
		}

		return &Response{err: err}
	}

	defer resp.Body.Close() // nolint: errcheck

	// Deserialize the json response
	if resp.Body != nil {
		data, err := ioutil.ReadAll(resp.Body)
		return &Response{body: data, err: err, statusCode: resp.StatusCode}
	}

	return &Response{statusCode: resp.StatusCode}
}

// prepareRequest build the HTTP request that #Do function will execute
// It set all necessary header and the correct URL
func (r *Request) prepareRequest() (*http.Request, error) {
	finalURL, err := r.url()
	if err != nil {
		return nil, err
	}
	httpRequest, err := http.NewRequest(r.method, finalURL, r.body)

	if err != nil {
		return nil, err
	}

	// set the context if exists
	if r.ctx != nil {
		httpRequest = httpRequest.WithContext(r.ctx)
	}

	// set the default content type
	if r.body != nil {
		httpRequest.Header.Set("Content-Type", "application/json")
	}

	// set the accept content type
	httpRequest.Header.Set("Accept", "application/json")

	// set the token
	if len(r.token) > 0 {
		httpRequest.Header.Set("Authorization", fmt.Sprintf("Bearer %s", r.token))
	}

	if r.basicAuth != nil {
		httpRequest.SetBasicAuth(r.basicAuth.User, r.basicAuth.Password)
	}

	// set the default headers
	for key, value := range r.headers {
		httpRequest.Header.Set(key, value)
	}

	return httpRequest, nil
}

// url build the final URL for the request, using the different pathParameter or queryParameter set
func (r *Request) url() (string, error) {
	path, err := r.buildPath()

	if err != nil {
		return "", err
	}

	finalURL := &url.URL{}
	if r.baseURL != nil {
		*finalURL = *r.baseURL
	}
	finalURL.Path = path

	if r.queryParam != nil {
		finalURL.RawQuery = r.queryParam.Encode()
	}

	return finalURL.String(), nil
}

// buildPath builds the REST path according to a predefined ordering
// /<api name>/<api version>[/<address>]/<resource type>[/<resource name>[/versions/<resource version>]][/<verb>]
func (r *Request) buildPath() (string, error) {
	var path strings.Builder

	// API name
	if len(r.apiPrefix) <= 0 {
		return "", errors.New("api prefix cannot be empty")
	}
	path.WriteString(r.apiPrefix)

	// API version
	if len(r.apiVersion) > 0 {
		path.WriteString(fmt.Sprintf("/%s", r.apiVersion))
	}

	// Address of the resource
	if len(r.project) > 0 {
		// Project address
		path.WriteString(fmt.Sprintf("/projects/%s", r.project))
	}

	// Resource type (mandatory)
	if len(r.resource) <= 0 {
		return "", errors.New("resource cannot be empty")
	}
	path.WriteString(fmt.Sprintf("/%s", r.resource))

	// Resource name
	if len(r.name) > 0 {
		path.WriteString(fmt.Sprintf("/%s", r.name))
	}

	return path.String(), nil
}

// RequestError is a format struct to defines the error the results of calling #Request.Do()
type RequestError struct {
	Message    string
	StatusCode int
	Err        error
}

func (re *RequestError) Error() string {
	err := "something wrong happened with the request to the API."

	if re.Err != nil {
		err = err + " Error: " + re.Err.Error()
	}
	if len(re.Message) > 0 {
		err = err + " Message: " + re.Message
	}

	if re.StatusCode > 0 {
		err = err + " StatusCode: " + strconv.Itoa(re.StatusCode)
	}

	return err
}

func (re *RequestError) Unwrap() error {
	return re.Err
}

// Response contains the result of calling #Request.Do()
type Response struct {
	body       []byte
	err        error
	statusCode int
}

type errorResponse struct {
	Message string `json:"message"`
}

// Error returns the error executing the request, nil if no error occurred.
func (r *Response) Error() error {
	e := &RequestError{Err: r.err}
	// check code result
	if r.statusCode < http.StatusOK || r.statusCode > http.StatusPartialContent {
		// check error message contains in the body
		if r.body != nil {
			response := &errorResponse{}
			err := json.Unmarshal(r.body, &response)
			if err != nil {
				// in this case something horrible append on client side
				e.Err = fmt.Errorf("something horrible occured when the client tried to decode the error message: %w", err)
			} else {
				e.Message = response.Message
			}
		}
		e.StatusCode = r.statusCode
	}

	if e.Err != nil || e.StatusCode > 0 || len(e.Message) > 0 {
		return e
	}
	return nil
}

// Object stores the result into respObj.
func (r *Response) Object(respObj interface{}) error {
	err := r.Error()

	if err != nil {
		return err
	}

	if r.body != nil {
		err = json.Unmarshal(r.body, respObj)
		if err != nil {
			return fmt.Errorf("unable to decode the response body. Error %w", err)
		}
	}
	return nil
}
