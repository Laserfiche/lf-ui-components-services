import { IRepositoryApiClient } from "@laserfiche/lf-repository-api-client";

export interface IRepositoryApiClientEx extends IRepositoryApiClient {
    repoId: string;
    repoName?: string;
}
