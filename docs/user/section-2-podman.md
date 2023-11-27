# Section 2 - Installing Perses in a Container

This sections continues with installing using a container image with Podman open source container tooling, configure 
examples, and run the container on your local machine.

## Installing Podman tooling

Installing Perses using a container image is going to be demonstrated here using the
[open source project Podman](https://podman.io/) and [Docker](https://www.docker.com/). It's assumed you have already 
installed and running either the Podman or the Docker commandline tooling.

## Running container image
It's pretty straight forward to running Perses in a container, just start the Perses container image using one of
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
need to map to the container port 8080.

### Note: What to do with failures?

Don't worry if at anytime in these instructions you encounter failures during installation, testing, data population, or build 
results. The container can be rerun anytime after you fix any problems reported. You might have to remove the perses 
container depending on how far you get before something goes wrong. Just stop, remove, and restart it:

```shell
# podman command.
#
$ podman container stop perses

$ podman container rm perses

$ podman run --name perses -d -p 127.0.0.1:8080:8080 persesdev/perses

# docker command.
#
$ docker container stop perses

$ docker container rm perses 

$ docker run --name perses -d -p 127.0.0.1:8080:8080 persesdev/perses
```
## Connect a browser (default)

Open the Perses console at http://localhost:8080.

You are presented with an empty home dashboard, in light mode. For fun you can choose optionally to flip the switch in
the top right corner to enable dark mode.

## What's next?

In the next section you start exploring Perses and the available tooling.

### [Next section - Exploring Perses Tooling] or [[Back to Index]](index.md)