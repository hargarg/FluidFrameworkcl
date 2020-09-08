/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DataObjectFactory, ContainerRuntimeFactoryWithDefaultDataStore } from "@fluidframework/aqueduct";
import { ListComponentName } from "@fluid-example/listexternal";
import { Controller } from "./model";

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pkg = require("../package.json");
export const controllerName = pkg.name as string;

export const ClickerInstantiationFactory = new DataObjectFactory(
    controllerName,
    Controller,
    [],
    {},
    [
        [ListComponentName, import("@fluid-example/listexternal").then((m) => m.ListComponent.getFactory())],
    ],
);
export const fluidExport = new ContainerRuntimeFactoryWithDefaultDataStore(
    controllerName,
    new Map([
        [controllerName, Promise.resolve(ClickerInstantiationFactory)],
    ]),
);
