import { IEntriesClient, ITemplateDefinitionsClient } from "@laserfiche/lf-repository-api-client";
import { IRepositoryApiClientEx } from "../helper-types/repository-api-ex.js";

export class RepositoryApiClientMockBuilder {
    private _entriesClient: IEntriesClient;
    private _templateDefinitionsClient: ITemplateDefinitionsClient;
    private _repoId: () => Promise<string>;
    private _repoName: () => Promise<string>;

    build(): IRepositoryApiClientEx {
        return {
            entriesClient: this._entriesClient,
            templateDefinitionsClient: this._templateDefinitionsClient,
            getCurrentRepoId: this._repoId,
            getCurrentRepoName: this._repoName
        } as IRepositoryApiClientEx;
    }

    withGetCurrentRepoId(repoId: () => Promise<string>): RepositoryApiClientMockBuilder {
        this._repoId = repoId;
        return this;
    }

    withGetCurrentRepoName(repoName: () => Promise<string>): RepositoryApiClientMockBuilder {
        this._repoName = repoName;
        return this;
    }

    withEntriesClient(entriesClient: Partial<IEntriesClient>): RepositoryApiClientMockBuilder {
        this._entriesClient = entriesClient as IEntriesClient;
        return this;
    }

    withTemplateDefinitionsClient(templateDefinitionsClient: Partial<ITemplateDefinitionsClient>): RepositoryApiClientMockBuilder {
        this._templateDefinitionsClient = templateDefinitionsClient as ITemplateDefinitionsClient;
        return this;
    }
}