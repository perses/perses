package v1

import "github.com/perses/perses/pkg/client/perseshttp"

type ClientInterface interface {
	RESTClient() *perseshttp.RESTClient
	Project() ProjectInterface
}

type client struct {
	ClientInterface
	restClient *perseshttp.RESTClient
}

func NewWithClient(restClient *perseshttp.RESTClient) ClientInterface {
	return &client{
		restClient: restClient,
	}
}

func (c *client) RESTClient() *perseshttp.RESTClient {
	return c.restClient
}

func (c *client) Project() ProjectInterface {
	return newProject(c.restClient)
}
