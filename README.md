# lf-ui-components-services

This library contains the data sources implementation to connect the [Laserfiche UI Components](https://www.npmjs.com/package/@laserfiche/lf-ui-components) to live data from Laserfiche API services.

You can use these pre-built services to display data using the UI components.

[Documentation](https://developer.laserfiche.com/)

## Getting started

1. `npm install @laserfiche/lf-ui-components-services`
1. Create an instance of IRepositoryClientEx. See [IRepositoryClient documentation](https://developer.laserfiche.com/) to create partialRepoClient.

    ```ts
    const partialRepoClient = IRepositoryClient.createFromHttpHandler({...});
    const repositoryClient: IRepositoryClientEx = {
        ...partialRepoClient,
        getCurrentRepoId: async () => {return await partialRepoClient.repositoriesClient.getRepositoryInfo()[0].repoId},
        getCurrentRepoName: async () => {return await partialRepoClient.repositoriesClient.getRepositoryInfo()[0].repoName},
    }
    ```

1. Initialize your chosen service

    ```ts
    const fieldsService = new LfFieldsService(repositoryClient);
    ```

1. Use service with the corresponding UI Component

    ```ts
    await this.metadataContainer.initAsync({fieldsService});
    ```

For detailed information about how to utilize these services see the sample projects available in Github (in [Angular](https://github.com/Laserfiche/lf-sample-OAuth-SPA-angular) and [React](https://github.com/Laserfiche/lf-sample-OAuth-SPA-react))

## Change Log

See CHANGELOG [here](./CHANGELOG.md).

## Contribution

We welcome contributions and feedback. Please follow our [contributing guidelines](./CONTRIBUTING.md).

### Development prerequisite

See .github/workflows/main.yml for Node and NPM version used.
