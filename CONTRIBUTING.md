Contributing
============

As Perses is still a work in progress, the contribution process is still evolving.

We are using GitHub as our main development and discussion forum.

* All PRs should go there.
* We use pull requests and issues for tracking the development of features that are either uncontroversial and/or small and don't need much up-front discussion.
* If you are thinking about contributing something more involved, you can use the [GitHub discussions](https://github.com/perses/perses/discussions) feature for design discussions before sending a pull request or creating a feature request issue.
* Be sure to add [DCO signoffs](https://github.com/probot/dco#how-it-works) to all of your commits.

If you are unsure about what to do, and you are eager to contribute, you can reach us on the development channel [#perses-dev](https://matrix.to/#/#perses-dev:matrix.org) on [Matrix](https://matrix.org/).

## Development

This section explains how to build, launch, and start using Perses.

This repository contains two major components of Perses:

* The backend API server written in Go.
* The web application frontend written in TypeScript (using React).

Both components can be started and tested individually as described below.

### Backend API Server

Building and starting the backend API server requires the following tools:

* [Go](https://go.dev/doc/install) (usually the latest version as we are following upstream Go releases closely)
* [Docker](https://docs.docker.com/engine/install/), which includes docker-compose
* Make
* [jq](https://stedolan.github.io/jq/download/)

With these dependencies installed, you can proceed as follows:

* Change to the `dev` folder and start an [etcd](https://etcd.io/) server, which is currently still required for storing and retrieving dashboard definitions:

```bash
cd dev/
docker-compose up -d
```

* To populate the etcd database with a default dashboard and datasource setup for demonstration purposes, run the `populate.sh` script:

```bash
bash populate.sh
```

* Return to the root of the project and build the API server:

```bash
cd ../
make build-api
```

* Finally, run the built binary, using the simple configuration file found in the `dev` folder:

```bash
./bin/perses -config ./dev/config.yaml
```

You should see something like this displayed in your terminal:

```log
$> ./bin/perses -config ./bin/config.yaml
______
| ___ \
| |_/ /__ _ __ ___  ___  ___
|  __/ _ \ '__/ __|/ _ \/ __|
| | |  __/ |  \__ \  __/\__ \
\_|  \___|_|  |___/\___||___/

The secure way to configure your monitoring.               <\
                                                            \\
--------------==========================================>|||<*>//////]
                                                            //
                                                           </

⇨ http server started on [::]:8080

```

The API backend is now available on port 8080 :).

### Web App

See the [ui/README.md](./ui/README.md) file for details around the build process and the structure of the web UI. The web UI currently still shows a canned test dashboard that is not loaded from the Perses API backend yet, but it already runs health checks that require the backend to be running in order to not show errors in the UI.
