# Installing Perses in a container

This section is explaining how you can install Perses using a container manager like [Podman](https://podman.io/) or [Docker](https://www.docker.com/).

It assumes you have already installed and are familiar with either the Podman or the Docker commandline tooling.

## Running container image

Start the Perses container image using one of the following commands depending on your tooling choice:

```shell
# podman command.
#
$ podman run --name perses --rm -p 127.0.0.1:8080:8080 persesdev/perses
```

```shell
# docker command.
#
$ docker run --name perses --rm -p 127.0.0.1:8080:8080 persesdev/perses
```

The details in this command are that we give the container a referencable name (--name perses), automatically remove
the container when it stops (--rm), map the local machine port 8080 to the container port 8080 (-p 127.0.0.1:8080:8080),
and use the image version supported in these instructions (latest). Note: you can use any local port you have available,
but you need to map to container port 8080.

The resulting console output should be something like:

```shell
time="2025-01-04T11:40:04Z" level=warning msg="encryption_key is not provided and therefore it will use a default one. For production instance you should provide the key."
 ___________
\___________/
     ___________      ______
    \___________/     | ___ \
 ___________          | |_/ /__ _ __ ___  ___  ___
\___________/         |  __/ _ \ '__/ __|/ _ \/ __|
 ___                  | | |  __/ |  \__ \  __/\__ \
\___/                 \_|  \___|_|  |___/\___||___/  [PERSES_VERSION]
__________________________________________________________

⇨ http server started on [::]:8080
```

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

- images built from the main branch: `persesdev/perses:main-2023-12-23-a2223483-distroless-debug`
  or `persesdev/perses:main-2023-12-23-a2223483-distroless`
- latest Perses image: `persesdev/perses` or `persesdev/perses:latest-debug`
- precise release image: `persesdev/perses:v0.50.0`, `persesdev/perses:v0.50.0-debug`, `persesdev/perses:v0.50.0-distroless`, `persesdev/perses:v0.50.0-distroless-debug`
- minor release image: `persesdev/perses:v0.50`, `persesdev/perses:v0.50-debug`, `persesdev/perses:v0.50-distroless`, `persesdev/perses:v0.50-distroless-debug`

## Connect a browser (default)

Open the Perses UI at http://localhost:8080.

You are presented with the home page, in light mode.
For fun, you can optionally flip the switch in the top right corner to enable dark mode.

# Building your own container image

If you want to build your own container image, you can use [`Dockerfile.dev`](https://github.com/perses/perses/blob/main/Dockerfile.dev).
This container will include the Perses binary, percli, Perses UI and it will download the core [plugins](https://github.com/perses/plugins) at build time.

To build your own container image, and run it you can use the following commands:

```shell
# podman command.
$ podman build -t perses-test -f Dockerfile.dev .
$ podman run --name perses --rm -p 127.0.0.1:8080:8080 perses-test
```

```shell
# docker command.
$ docker build -t perses-test -f Dockerfile.dev .
$ docker run --name perses --rm -p 127.0.0.1:8080:8080 perses-test
```

## What's next?

Explore the online [Perses documentation](https://perses.dev/)
