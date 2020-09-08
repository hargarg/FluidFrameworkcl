/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DataObjectFactory, ContainerRuntimeFactoryWithDefaultDataStore } from "@fluidframework/aqueduct";
import { ListComponentName } from "@fluid-example/listexternal";
import { MainController } from "./model";
import { ViewControllerType } from "./componentTypes";
import { getViewControllerPromise } from "./view";

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pkg = require("../package.json");
export const controllerName = pkg.name as string;

export const ClickerInstantiationFactory = new DataObjectFactory(
    controllerName,
    MainController,
    [],
    {},
    [
        [ViewControllerType, getViewControllerPromise().then((m) => m.getFactory())],
        [ListComponentName, import("@fluid-example/listexternal").then((m) => m.ListComponent.getFactory())],
    ],
);
export const fluidExport = new ContainerRuntimeFactoryWithDefaultDataStore(
    controllerName,
    new Map([
        [controllerName, Promise.resolve(ClickerInstantiationFactory)],
    ]),
);
