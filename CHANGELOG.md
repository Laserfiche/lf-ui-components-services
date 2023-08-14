## 15.0.0

### Features

### Fixes

### Chore & Maintenance
 - Updated `types-lf-ui-components` to use the latest version 15.0.1
## 14.1.0

### Features
- `LfRepoTreeNodeService`: supports column
  - add `columnIds`
  - add `getSupportedColumnIdsAsync()`
  - method `getFolderChildrenAsync()` takes an additional optional argument `orderBy: ColumnOrderBy`
- `LfRepoTreeNodeService`: supports initialization with path
  - update `@laserfiche\types-lf-ui-components` to version `14.1.3`
  - add method `getTreeNodeByIdentifierAsync`, which determines the `LfRepoTreeNode` specified by the given path
  - this enables the user of the service to open the `lf-repository-browser` component to a certain initial node by calling
      `initAsync` with a path, not knowing other data about the folder.

### Fixes

### Chore & Maintenance
- Remove `jest-codemods` as dev dependency

## 14.0.0

### Features

### Fixes

### Chore & Maintenance
- Update build pipeline to use Node 16
- Update `@laserfiche/types-lf-ui-components` to version `14.0.0`

## 13.0.5

### Features
- support displayName property in `LfFieldInfo` and `TemplateInfo`
    - fallback to `name` property in API if `displayName` does not exist

### Fixes

### Chore & Maintenance
- Dependency `@laserfiche/types-lf-ui-components` version is `^13.1.6`

## 13.0.4

### Features
### Fixes

### Chore & Maintenance
- Dependency `@laserfiche/types-lf-ui-components` version is `^13.1.4`

## 13.0.3

### Features
### Fixes
- `LfRepoTreeNodeService`: fix isViewable showing not viewable shortcuts
### Chore & Maintenance

## 13.0.2

### Features
- `LfRepoTreeNodeService`: support RecordSeries
### Fixes

### Chore & Maintenance

## 13.0.1

### Features
- `LfRepoTreeNodeService`: add createLfRepoTreeNode

### Fixes

### Chore & Maintenance

## 13.0.0

### Features
- Add `LfRepoTreeNodeService`.
- **[BREAKING]** Remove `LfRepoTreeService` and corresponding types.

### Fixes

### Chore & Maintenance
- Update `@laserfiche/types-lf-ui-components` version to 13.1.1.
- Update `@laserfiche/lf-repository-api-client` version to 1.0.12.
- Make `@laserfiche/lf-js-utils` and `@laserfiche/lf-repository-api-client` peer dependencies.

## 3.0.1

### Features

### Fixes

### Chore & Maintenance

- Update dependency `@laserfiche/lf-js-utils` version to ^4.0.2.
- Make `@laserfiche/types-lf-ui-components` a peer dependency.
- Update `@laserfiche/types-lf-ui-components` version to ^12.0.2.

## 3.0.0

- Initial release to NPM. 
