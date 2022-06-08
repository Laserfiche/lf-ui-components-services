import { IEntriesClient, ITemplateDefinitionsClient } from "@laserfiche/lf-repository-api-client";
import { IRepositoryApiClientEx } from "../helper-types/repository-api-ex.js";

export class RepositoryApiClientMockBuilder {
    private _repoId: string | undefined;
    private _entriesClient: IEntriesClient;
    private _templateDefinitionsClient: ITemplateDefinitionsClient;

    build(): IRepositoryApiClientEx {
        return {
            entriesClient: this._entriesClient,
            templateDefinitionsClient: this._templateDefinitionsClient,
            repoId: this._repoId
        } as IRepositoryApiClientEx;
    }

    withRepoId(repoId: string): RepositoryApiClientMockBuilder {
        this._repoId = repoId;
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