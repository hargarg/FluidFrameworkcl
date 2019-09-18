/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IAlfredTenant, IDocumentStorage } from "@microsoft/fluid-server-services-core";
import { Router } from "express";
import { getParam } from "../../utils";

export function create(storage: IDocumentStorage, appTenants: IAlfredTenant[]): Router {

    const router: Router = Router();

    router.get("/:tenantId?/:id", (request, response, next) => {
        const documentP = storage.getDocument(
            getParam(request.params, "tenantId") || appTenants[0].id,
            getParam(request.params, "id"));
        documentP.then(
            (document) => {
                response.status(200).json(document);
            },
            (error) => {
                response.status(400).json(error);
            });
    });

    /**
     * Lists all forks of the specified document
     */
    router.get("/:tenantId?/:id/forks", (request, response, next) => {
        const forksP = storage.getForks(
            getParam(request.params, "tenantId") || appTenants[0].id,
            getParam(request.params, "id"));
        forksP.then(
            (forks) => {
                response.status(200).json(forks);
            },
            (error) => {
                response.status(400).json(error);
            });
    });

    /**
     * Creates a new fork for the specified document
     */
    router.post("/:tenantId?/:id/forks", (request, response, next) => {
        const forkIdP = storage.createFork(
            getParam(request.params, "tenantId") || appTenants[0].id,
            getParam(request.params, "id"));
        forkIdP.then(
            (forkId) => {
                response.status(201).json(forkId);
            },
            (error) => {
                response.status(400).json(error);
            });
    });

    return router;
}
