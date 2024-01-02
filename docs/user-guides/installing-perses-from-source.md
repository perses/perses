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

Now just change into the Perses project root directory and build the project:

```shell
cd perses

make build

...
... LOTS OF BUILD LOG LINES HERE ...
...
@perses-dev/app:build: webpack 5.84.1 compiled with 2 warnings in 7038 ms

  Tasks:    14 successful, 14 total
  Cached:    0 cached, 14 total
  Time:    28.59s

>> compressing assets
scripts/compress_assets.sh
GOARCH=arm64 GOOS=darwin go generate ./internal/api
>> build the perses api
CGO_ENABLED=0 GOARCH=arm64 GOOS=darwin go build -ldflags "-s -w -X github.com/prometheus/common/version.Version=0.41.1
>> build the perses cli
CGO_ENABLED=0 GOARCH=arm64 GOOS=darwin go build -ldflags "-s -w -X github.com/prometheus/common/version.Version=0.41.1
Perses server built successfully!
```

Note the last line stating that you have successfully built your own instance of Perses!

## Starting the Perses server

To start the server you need a minimal configuration file, so let's set up a new one for you. Apply the following to a
file using your favorite editor and name it myconfig.yaml:

```yaml
database:
  file:
    folder: "myperses/local_db"
    extension: "json"

provisioning:
  folders:
  - "myperses/data"

schemas:
  panels_path: "schemas/panels"
  queries_path: "schemas/queries"
  datasources_path: "schemas/datasources"
  variables_path: "schemas/variables"
  interval: "5m"
```

The database section points to a new directory called `myperses/local_db` where all your visualization and dashboard
project files will be kept. The provisioning sections defines where all the JSON files will be stored, in
`myperses/data`. The schema section defines where Perses can find the definitions for all things used to create
visualization and dashboard elements.

Once you have the configuration file set up, you can now start your Perses instance:

```shell
./bin/perses -config [PATH_TO]/myconfig.yaml

WARN[0000] encryption_key is not provided and therefore it will use a default one. For production instance you should 
provide the key. 

______                       
| ___ \                      
| |_/ /__ _ __ ___  ___  ___ 
|  __/ _ \ '__/ __|/ _ \/ __|
| | |  __/ |  \__ \  __/\__ \
\_|  \___|_|  |___/\___||___/  0.42.1 

All your monitoring dashboards in one place.               <\
                                                            \\
--------------==========================================>|||<*>//////]
                                                            //
                                                           </
⇨ http server started on [::]:8080
```

## Connect a browser (default)

Open the Perses UI at http://localhost:8080.

You are presented with the home page, in light mode.
For fun, you can optionally flip the switch in the top right corner to enable dark mode.

## What's next?

In the next section, you start exploring Perses and the available tooling.
