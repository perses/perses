# Exploring Perses tooling

This sections takes the user through a tour of how to make use of the tooling provided by Perses. You'll learn now to 
use the Perses API from your browser, given tips to use it with your favorite API client, and pointed to where you can
learn now to use the Perses command line tooling.

## Learning about the Perses API 

The Perses API contains all the features you need for creating, updating, deleting, and retrieving a resource. To 
explore the full details, [see the Perses API documentation](../api/README.md). This section will rely on this 
documentation and help you to explore the API usage by hands-on examples. 

All examples shown in the following section are based on a sample project that is not provided with the basic 
installation. In later sections of the user documentation, you'll create the project shown here and all it's resources.

## Getting started with Perses API

The easiest and most basic way to explore the Perses API and our current Perses instance, is to use a browser and send
a well formatted URL to the API. Let's get started by asking our instance, which has a project created that is called
**WorkshopProject**. We want to view all available project resources using our browser with the following request:

```shell
http://localhost:8080/api/v1/projects
```
After submitting this project resource request, the response is a Perses resource in unformulated JSON:

```shell
[{"kind":"Project","metadata":{"name":"WorkshopProject","createdAt":"2024-01-16T11:17:10.31497Z","updatedAt":"2024-01-16T11:17:10.31497Z","version":0},"spec":{}}]
```

While this might be fine for simple and quick explorations of resources, most users tend to interact with APIs using 
their favorite clients to ensure formatted responses. Let's explore using our preferred API client.

## Using your favorite API client

No matter what your preferred API client is, the basics are to submit the same URL as above and get the projects 
resource as a response that is well formatted JSON, such as our client does here:

```shell
http://localhost:8080/api/v1/projects
```

And the nicer formatted output is:

```shell
[
  {
    "kind": "Project",
    "metadata": {
      "name": "WorkshopProject",
      "createdAt": "2024-01-16T11:17:10.31497Z",
      "updatedAt": "2024-01-16T11:17:10.31497Z",
      "version": 0
    },
    "spec": {}
  }
]
```

Another example is to request the dashboard resources for the project **WorkshopProject**, as shown here:

```shell
http://localhost:8080/api/v1/projects/WorkshopProject/dashboards
```

The resulting formatted output is only partially displayed here, as it's a bit long, but you see the one dashboard that
has been created for the **WorkshopProject**:

```shell
[
  {
    "kind": "Dashboard",
    "metadata": {
      "name": "MyFirstDashboard",
      "createdAt": "2024-01-16T11:17:13.362292Z",
      "updatedAt": "2024-01-16T11:17:13.362292Z",
      "version": 0,
      "project": "WorkshopProject"
    },
    "spec": {
      "display": {
        "name": "MyFirstDashboard"
      },
      "variables": [
      
     ...CLIPPED_REST_OF_THE_RESOURCE...
```
With these two examples you can now use the [Perses API documentation](../api/README.md) to explore how to create, 
update, delete, and retrieve resources such as dashboards, datasources, projects, variables, and more.

## Using the Perses CLI tooling

The last option you have to interact with the Perses API is provided by the project itself, the command line tooling 
known as **percli**. See the [command line tooling documentation](../tooling/cli.md) for all the details and examples of
how to use it.

## What's next?

In the next section, you start creating your first Perses dashboard.