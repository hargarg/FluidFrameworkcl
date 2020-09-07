/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { LocalDocumentServiceFactory, LocalResolver } from "@fluidframework/local-driver";
import { LocalDeltaConnectionServer } from "@fluidframework/server-local-server";
import { v4 as uuid } from "uuid";
import { Loader } from "@fluidframework/container-loader";
import { ContainerRuntimeFactoryWithDefaultDataStore } from "@fluidframework/aqueduct";
import { initializeContainerCode } from "@fluidframework/base-host";
import { HTMLViewAdapter } from "@fluidframework/view-adapters";
export async function createLocalContainerFactory(entryPoint) {
    const urlResolver = new LocalResolver();
    const deltaConn = LocalDeltaConnectionServer.create();
    const documentServiceFactory = new LocalDocumentServiceFactory(deltaConn);
    const factory = entryPoint.fluidExport ? entryPoint.fluidExport : entryPoint;
    const runtimeFactory = factory.IRuntimeFactory ?
        factory.IRuntimeFactory :
        new ContainerRuntimeFactoryWithDefaultDataStore("default", [["default", Promise.resolve(factory.IFluidDataStoreFactory)]]);
    const codeLoader = {
        load: async () => ({ fluidExport: runtimeFactory }),
    };
    const loader = new Loader(urlResolver, documentServiceFactory, codeLoader, {}, {}, new Map());
    const documentId = uuid();
    const url = `fluid://localhost/${documentId}`;
    return async () => {
        const container = await loader.resolve({ url });
        await initializeContainerCode(container, {});
        // If we're loading from ops, the context might be in the middle of reloading.  Check for that case and wait
        // for the contextChanged event to avoid returning before that reload completes.
        if (container.hasNullRuntime()) {
            await new Promise((resolve) => container.once("contextChanged", () => resolve()));
        }
        return container;
    };
}
export async function renderDefaultFluidObject(container, div) {
    const response = await container.request({ url: "" });
    if (response.status !== 200 ||
        !(response.mimeType === "fluid/component" ||
            response.mimeType === "fluid/object")) {
        div.innerText = "Fluid object not found";
        return;
    }
    // Render the Fluid object with an HTMLViewAdapter to abstract the UI framework used by the Fluid object
    const fluidObject = response.value;
    const embed = new HTMLViewAdapter(fluidObject);
    embed.render(div, { display: "block" });
}
//# sourceMappingURL=index.js.map