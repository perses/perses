Perses
======
[![CircleCI](https://circleci.com/gh/perses/perses.svg?style=shield)](https://circleci.com/gh/perses/perses)
[![build](https://github.com/perses/perses/workflows/build/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Abuild)
[![go](https://github.com/perses/perses/workflows/go/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Ago)
[![react](https://github.com/perses/perses/workflows/angular/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Aangular)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/perses/perses)
[![codecov](https://codecov.io/gh/perses/perses/branch/master/graph/badge.svg?token=M37Y9VSVB5)](https://codecov.io/gh/perses/perses)

## Overview

Perses is providing a secure way to configure your Prometheus (like AlertRules, Scrapping Rules). Configurations can
then be deployed across different Prometheis.

Perses is the solution if you want to give the hand to your users without being worried that they could change or impact
others configuration. Users can create isolated workspace where they can define their configurations.

A good example of how Perses is securing and isolated each workspace is when a user is going to silence something with
AlertManager. With Perses, the silences are scoped to the alertRules the user defined in his workspace. Perses is
assuring you won't be able to silence others alert

Perses is also going to provide visualization for Prometheus through a new dashboard definition.

## Status

Work in progress and far away to be prod ready. We have for the moment the CRUD for the Prometheus AlertRule and a
beginning of a dashboard.

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

* You have a bash script that would populate the database with a default setup. It can help if you just want to run a
  demo.

```bash
bash populate.sh
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

Note: if you populate the database with the bash script `./dev/populate.sh`, then you can go on the
URL http://localhost:4200/projects/perses you will see a first visual of Prometheus AlertRule and Dashboard.

## License

The code is licensed under an [Apache 2.0](./LICENSE) license.
