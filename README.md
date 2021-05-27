Perses
======
[![CircleCI](https://circleci.com/gh/perses/perses.svg?style=shield)](https://circleci.com/gh/perses/perses)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/perses/perses)
[![codecov](https://codecov.io/gh/perses/perses/branch/master/graph/badge.svg?token=M37Y9VSVB5)](https://codecov.io/gh/perses/perses)

## Overview

Work in progress and far away to be prod ready 

## Development

In this repository you have :

* the API written in Golang
* the web app written in Typescript (using Angular)

Each side of this project can be easily started and tested, you just have to follow the steps described below.

### API

To be able to start the API, you need to install the following tool:

* Golang (usually the last version as we are following closely the latest version of Golang)
* Docker & docker-compose
* Make

Once it is done, you can proceed as followed:

* go the `dev` folder, where you can find a `docker-compose.yaml` file.
* start the different container described in the file:

```bash
cd dev/
docker-compose up -d
```  

* come back to the root of the project and then build the api:

```bash
cd ../
make build
```

* finally, run the binary built by using the simple configuration file from the `dev` folder:

```bash
./bin/perses -config ./dev/config.yaml
```

You should see something like that displayed in your terminal:

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

The API is now available :).

### Web App

To be able to use the Web app, you will have to follow the steps to run the API first. For the moment there is no
particular desire to run the Web-app on the development environment without the API at the same time.

* Once the API is running, you have to install nodeJS v14 minimum.
* Then go to the folder `./internal/api/front/perses`, and install all necessary packages:

```bash
cd ./internal/api/front/perses
npm install
```

* Finally, start the web-app:

```bash
npm start
```

The web-app is now available using the url http://localhost:4200.

## License

The code is licensed under an [Apache 2.0](./LICENSE) license.
