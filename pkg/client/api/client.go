package api

import (
	v1 "github.com/perses/perses/pkg/client/api/v1"
	"github.com/perses/perses/pkg/client/perseshttp"
)

type ClientInterface interface {
	RESTClient() *perseshttp.RESTClient
	V1() v1.ClientInterface
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

func (c *client) V1() v1.ClientInterface {
	return v1.NewWithClient(c.restClient)
}
