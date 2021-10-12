Contributing
============

As Perses is still in progress, process to contribute is not entirely in place.

We are using GitHub for the development.

* All PRs should go there
* We are opening issue when we are sure about a feature, and we want to trace it. We also open issues when the feature proposed should be small and doesn't require huge talk.
* If you are thinking about something more involved, you can use the [GitHub discussion](https://github.com/perses/perses/discussions)
* Be sure to sign off on the [DCO](https://github.com/probot/dco#how-it-works)

If you are unsure about what to do, and you are eager to contribute, you can reach us on the development channel [#perses-dev](https://matrix.to/#/#perses-dev:matrix.org) available on matrix.

## Development

This section should help to build and start the project, and to enter in the project.

In this repository you have :

* the API written in Golang
* the web app written in Typescript (using React)

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

* Install nodejs [version 14 or greater](https://nodejs.org/).
* Install npm [version 7 or greater](https://www.npmjs.com/).
* Then go to the folder `./web`, and install all necessary packages:

```bash
cd ./web
npm install
```

* Finally, start the web-app:

```bash
npm start
```

The web-app is now available using the url http://localhost:3000.
