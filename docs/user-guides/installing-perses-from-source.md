# Installing Perses from the source

This sections continues with installing using the source code, test the project, build the project, configure examples,
and run the Perses dashboard project on your local machine.

## Building requirements

To build the Perses project from source you need minimum versions of the following:

- GO v1.21+
- Node v16+
- NPM v8+

## Downloading the source

You can obtain the source code of the Perses project at the main product page in various compression formats or you can
clone the git repository as shown here:

```shell
git clone https://github.com/perses/perses.git
```

Now just move to the Perses project directory and build the project:

```shell
cd perses

make build

...
... LOTS OF BUILD LOG LINES HERE ...
...
>> build the perses cli
CGO_ENABLED=0 GOARCH=arm64 GOOS=darwin go build -ldflags "-s -w -X github.com/prometheus/common/version.Version=0.42.1 
-X github.com/prometheus/common/version.Revision=20a69c0d8e063bcb193f9f209d4d571c1bbadde2 
-X github.com/prometheus/common/version.BuildDate=2024-01-02 
-X github.com/prometheus/common/version.Branch=main" -o ./bin/percli ./cmd/percli
```

Note the last line stating that you have successfully built your own instance of Perses!

## Starting the Perses server

To start the server you just built:

```shell
./bin/perses --config dev/config.yaml
 ___________
\___________/
     ___________      ______
    \___________/     | ___ \
 ___________          | |_/ /__ _ __ ___  ___  ___
\___________/         |  __/ _ \ '__/ __|/ _ \/ __|
 ___                  | | |  __/ |  \__ \  __/\__ \
\___/                 \_|  \___|_|  |___/\___||___/  0.47.0
__________________________________________________________

⇨ http server started on [::]:8080
```

If you are interested in exploring how to configure your Perses server, please see the
[configuration documentation](configuration.md).

## Connect a browser (default)

Open the Perses UI at http://localhost:8080.

You are presented with the home page, in light mode.
For fun, you can optionally flip the switch in the top right corner to enable dark mode.

## What's next?

In the next section, you start exploring Perses and the available tooling.
