import { IRepositoryApiClient } from "@laserfiche/lf-repository-api-client";

export interface IRepositoryApiClientEx extends IRepositoryApiClient {
    getCurrentRepoId: () => Promise<string>;
    getCurrentRepoName: () => Promise<string>;
}
