export class UrlBuilderUtil {
  private prefixAPI = '/api/v1';
  private resource = '';
  private project = '';
  private name = ' ';

  constructor() {
  }

  setProject(project: string): UrlBuilderUtil {
    this.project = project;
    return this;
  }

  setName(name: string): UrlBuilderUtil {
    this.name = name;
    return this;
  }

  setResource(resource: string): UrlBuilderUtil {
    this.resource = resource;
    return this;
  }

  build(): string {
    let url = this.prefixAPI;
    if (this.project && this.project.length > 0) {
      url = url + '/projects/' + this.project;
    }
    url = url + '/' + this.resource;
    if (this.name && this.name.length > 0) {
      url = url + '/' + this.name;
    }
    return url;
  }
}
