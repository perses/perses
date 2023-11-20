# Section 2 - Installing Perses in a Container

This sections continues with installing using a container image with Podman open source container tooling, configure 
examples, and run the container on your local machine.

## Installing Podman tooling

Installing Perses using a container image is going to be demonstrated here using the 
[open source project Podman](https://podman.io/). It's assumed you have already installed the Podman commandline tooling 
previously.

If you want to use other container tooling, such as Docker, it's left to the student to determine the commands to 
substitute as needed.

## Starting Podman machine
You need to make sure that the Podman virtual machine has been started, so, assuming you have initialized a podman 
machine already:

```shell
$ podman machine start
```

## Running container image
It's pretty straight forward to running Perses in a container, just start the Perses container image as follows:

```shell
$ podman run --name perses -d -p 127.0.0.1:8080:8080 persesdev/perses:v{VERSION-NUMBER}
```

The details in this command are that we give the container a referencable name (--name perses), detach the container 
from the command line (-d), map the local machine port 8080 to the container port 8080 (-p 127.0.0.1:8080:8080), and use 
the image version supported in these instructions (persesdev/perses:v{VERSION-NUMBER}). Note: you can use any local port you have 
available, but you need to map to the container port 8080.

### Note: What do do with failures?

Don't worry if at anytime in these instructions you encounter failures during installation, testing, data population, or build 
results. The container can be rerun anytime after you fix any problems reported. You might have to remove the perses 
container depending on how far you get before something goes wrong. Just stop, remove, and restart it:

```shell
$ podman container stop perses

$ podman container rm perses

$ podman run --name perses -d -p 127.0.0.1:8080:8080 persesdev/perses:v{VERSION-NUMBER}
```
## Connect a browser (default)

Open the Perses console at http://localhost:8080.

You are presented with an empty home dashboard, in light mode. For fun you can choose optionally to flip the switch in
the top right corner to enable dark mode.

## But this version is empty?

The first thing you might notice is that you now have a blank canvas. There are no example projects, no dashboards, and 
noting configured to get started with. Maybe you are OK with that, but wouldn't it be nice to start this exploration 
with an example to explore?

To achieve that you can make use of the [Perses Easy Install project](https://gitlab.com/o11y-workshops/perses-install-demo). 
This contains a simple automated installation process to provide you with a running and pre-populated Perses instance in 
a container. This instance will have an example project ready for you to explore. On the next slide you will download 
and install Perses in a container using the Perses Easy Install project.

## Resetting your container environment

Before we start installing a new container version of Perses, let reset our container environment by stopping the 
running container and shutting down our Podman machine as follows (note that you don't have to remove the perses 
container image as the automated installation can clean up any conflicts during the installation to ensure you have a 
clean starting point):

```shell
$ podman container stop perses

$ podman machine stop
```

## Using the easy install project

The Perses Easy Install project takes just 3 steps to a running server:

 1. Download and unzip project.

 2. Run the init.sh file in a console.

 3. Connect in a browser window.

Let's walk through these steps one by one in the next sections...

## Downloading and unzip project

The first step is to download the project. Unzipping (use your file manager or console) should look something like this:

```shell
$ unzip perses-install-demo-v1.3.zip

Archive:  perses-install-demo-v1.3.zip
creating: perses-install-demo-v1.3/
extracting: perses-install-demo-v1.3/.gitignore
inflating: perses-install-demo-v1.3/README.md
creating: perses-install-demo-v1.3/docs/
creating: perses-install-demo-v1.3/docs/demo-images/
inflating: perses-install-demo-v1.3/docs/demo-images/dashboard-demo.png
inflating: perses-install-demo-v1.3/docs/demo-images/workshop-console.png
inflating: perses-install-demo-v1.3/docs/demo-images/workshop-myfirstdashboard.png
inflating: perses-install-demo-v1.3/docs/demo-images/workshop.png
inflating: perses-install-demo-v1.3/init.bat
inflating: perses-install-demo-v1.3/init.sh
creating: perses-install-demo-v1.3/installs/
inflating: perses-install-demo-v1.3/installs/README
inflating: perses-install-demo-v1.3/installs/perses-0.41.1.zip
creating: perses-install-demo-v1.3/support/
extracting: perses-install-demo-v1.3/support/README
creating: perses-install-demo-v1.3/support/bin/
inflating: perses-install-demo-v1.3/support/bin/percli
inflating: perses-install-demo-v1.3/support/functions.sh
...
```

## Getting started with install

In our example here we will run the console-based installation script (note the VERSION text below is to be replace with 
the version of the project you have downloaded):

```shell
$ cd perses-install-demo-{VERSION}

$ ./init.sh
```

## Enjoy the welcome ascii art!

First, you are presented with welcome art and details about this project:

```text
#############################################################
##                                                         ##
##  Setting up the Perses Easy Install demo                ##
##                                                         ##
##           ####  ##### ####   #### #####  ####           ##
##           #   # #     #   # #     #     #               ##
##           ####  ###   ####   ###  ###    ###            ##
##           #     #     #  #      # #         #           ##
##           #     ##### #   # ####  ##### ####            ##
##                                                         ##
##                #####  ###   #### #   #                  ##
##                #     #   # #      # #                   ##
##                ###   #####  ###    #                    ##
##                #     #   #     #   #                    ##
##                ##### #   # ####    #                    ##
##                                                         ##
##        ##### #   #  #### #####  ###  #     #            ##
##          #   ##  # #       #   #   # #     #            ##
##          #   # # #  ###    #   ##### #     #            ##
##          #   #  ##     #   #   #   # #     #            ##
##        ##### #   # ####    #   #   # ##### #####        ##
##                                                         ##
##  brought to you by Eric D. Schabell                     ##
##                                                         ##
##  git@gitlab.com:o11y-workshops/perses-install-demo.git  ##
##                                                         ##
#############################################################
```

## Whoops... that's not right?

Note that there are many fail safe checks in this script and you found the first one! Read the help messages in the 
console output and fix it by running it with the right argument:

```shell
Checking the build mode arguments...

To use this installation script you have to provide one argument
indicating how you want to install the Perses server. You have the
option to install a container image or build it from source:

	$ ./init.sh {podman|source}

Both methods are validated by the install scripts.
```

## Not again! What went wrong?

As you scroll down the output you'll see the container image being installed, but after a few tries, it fails? Here, 
remember, we stopped the podman VM. Restart it to continue:

```text
Starting fresh perses container image...

Cannot connect to Podman. Please verify your connection to the Linux
system using `podman system connection list`, or try `podman machine
init` and `podman machine start` to manage a new Linux VM

Error occurred during 'podman run' starting perses container... make
sure you have started the Podman machine as follows and rerun this
installation script again:

$ podman machine start
```

## Starting VM and restart install

From the previous help message we saw that the Podman virtual machine must be started, so, assuming you have initialized 
a podman machine already:

```shell
$ podman machine start

$ ./init.sh podman
```

## Running Perses container image

Now we see the container image starting properly, followed by starting to apply the demo examples by first logging in to 
the server:

```text
Checking the build mode arguments...

Installing container image...

Installing Perses container using image...

Checking if Podman is installed...

Starting the perses container image...

61950b9eeb5285aea59b3a845e003a38f8bb11dc2fe671b577989946ec5946af

Waiting for container to start...

Setting up the Perses examples...

Logging in to Perses instance...
```

## Loading example dashboard project

The next steps are loading in our WorkShopProject which contains an example dashboard and data sources that we will use 
to query when building your first dashboard later:

```text
Applying the demo projects setup...

object "Project" "WorkshopProject" has been applied

Applying the dashboard setup...

object "Dashboard" "MyFirstDashboard" has been applied in the project "WorkshopProject"

Applying the variable setup...

object "Variable" "instance" has been applied in the project "WorkshopProject"

Applying the demo datasources...

object "Datasource" "dashboard-3000" has been applied in the project "WorkshopProject"
object "Datasource" "node-exporter-9100" has been applied in the project "WorkshopProject"
object "Datasource" "prometheus-8080" has been applied in the project "WorkshopProject"
```

## Sharing the end report

After a successful install, a final report is presented with instructions on how to open the Perses dashboard and how to 
manage the container when done with your exploration:

```text
======================================================
=                                                    =
=  Install complete, get ready to rock Perses!       =
=                                                    =
=  The Perses dashboard can be opened at:            =
=                                                    =
=           http://localhost:8080                    =
=                                                    =
=  Getting started workshop available online:        =
=                                                    =
=  https://o11y-workshops.gitlab.io/workshop-perses  =
=                                                    =
=  Note: When finished using the Perses container,   =
=  you can shut it down and come back later to       =
=  restart it:                                       =
=                                                    =
=      $ podman container stop perses                =
=                                                    =
=  To remove the perses container and start over:    =
=                                                    =
=      $ podman container rm perses                  =
=                                                    =
=  Also, remember to shut down the virtual machine:  =
=                                                    =
=      $ podman machine stop                         =
=                                                    =
======================================================
```

## Connect a browser

Open the Perses console at http://localhost:8080.

This time you are presented with a home dashboard with a pre-installed WorkshopProject, in light mode. For fun you can 
choose optionally to flip the switch in the top right corner to enable dark mode.


### [Next section - Exploring Perses Tooling] or [[Back to Index]](index.md)