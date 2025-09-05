# Project

## What it is

A project can be defined as a workspace and it can be both personal or collaborative.

## Why you will need it

It's the place where users spend most of their time creating dashboards, variables and datasources.
You have to own a project to be able to create a dashboard in Perses.

## How it can be used

### In the Perses UI:

#### Search for a project

Retrieve and display all available projects using the search bar.

![search project](https://github.com/user-attachments/assets/6f0f0b96-db18-4c31-999f-5e0d88b5d29c)

#### Create a project

To create your project:
-  Use directly the ADD PROJECT button.

![create project](https://github.com/user-attachments/assets/b0716b24-4fc5-42d9-9834-c7af52527168)

- The Add Project pop-up will be displayed and you can provide a name for your new project and click on Add.

![add project](https://github.com/user-attachments/assets/e8123a57-3e82-4508-b7de-52729a92e29b)

You will then be redirected in your newly created project workspace.
 
 ![project workspace](https://github.com/user-attachments/assets/0d642482-d3dc-4177-89e2-cbbaae9c7ebc)

#### Edit Project

When you are inside your project, you have the options to rename or delete your project by clicking to the equivalent buttons.

![rename delete project](https://github.com/user-attachments/assets/3d18082a-5790-43ec-8ad4-df1deeaa6d3a)

### In the CLI:

You can create, read, update, or delete projects using the CLI. Refer to the [Project API](../api/project.md) documentation for the data model.

### Project Permissions

When a user creates a project, they are automatically assigned the Owner role for that project.
Users with the owner role can edit, rename and delete a project.

## Related Documentation
[Project API](../api/project.md)
[Perses CLI](../cli.md)