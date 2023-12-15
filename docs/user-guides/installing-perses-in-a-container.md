# Installing Perses in a container

This section continues with installing using a container image with Podman open-source container tooling, configure
examples, and run the container on your local machine.

## Installing container tooling

Installing Perses using a container image is going to be demonstrated here using[Podman](https://podman.io/) and [Docker](https://www.docker.com/). 
It's assumed you have already installed and running either the Podman or the Docker commandline tooling.

## Running container image

It's pretty straight forward to running Perses in a container, start the Perses container image using one of
the following depending on your tooling choice:

```shell
# podman command.
#
$ podman run --name perses -d -p 127.0.0.1:8080:8080 persesdev/perses


# docker command.
#
$ docker run --name perses -d -p 127.0.0.1:8080:8080 persesdev/perses
```

The details in this command are that we give the container a referencable name (--name perses), detach the container
from the command line (-d), map the local machine port 8080 to the container port 8080 (-p 127.0.0.1:8080:8080), and use
the image version supported in these instructions (latest). Note: you can use any local port you have available, but you
need to map to container port 8080.

### Tags

We are publishing a set of tags to match different requirements when running Perses in a container:

1. Our images can run either on **arm64** or on **amd64** platform.
2. We have two different types of image: `distroless` and `distroless-debug`.
   The first one is meant to be used in production as it doesn't contain anything excepting the Perses binaries.
   The second one contains a shell and should be used to debug any issue you might encounter with your container.
3. The tag `latest` is an alias for the `distroless` distribution and is erased with the latest release.
4. The tag `latest-debug` is an alias for the `distroless-debug` distribution and is erased with the latest release.
5. We are also providing an image for each commit created on the `main` branch.
   The tag created for each commit is following this pattern: `main-<YYYY-MM-DD>-<short commit ID>-<distribution>`

Examples:

- images built from the main branch:  `persesdev/perses:main-2023-12-14-f66e10ce-distroless-debug`
  or `persesdev/perses:main-2023-12-14-f66e10ce-distroless`
- latest Perses image: `persesdev/perses` or `persesdev/perses:latest-debug`
- precise release image: `persesdev/perses:v0.42.1`, `persesdev/perses:v0.42.1-debug`, `persesdev/perses:v0.42.1-distroless`, `persesdev/perses:v0.42.1-distroless-debug`
- minor release image: `persesdev/perses:v0.42`, `persesdev/perses:v0.42-debug`, `persesdev/perses:v0.42-distroless`, `persesdev/perses:v0.42-distroless-debug`

## Connect a browser (default)

Open the Perses console at http://localhost:8080.

You are presented with an empty home dashboard, in light mode.
For fun, you can choose optionally to flip the switch in the top right corner to enable dark mode.

## What's next?

In the next section, you start exploring Perses and the available tooling.
