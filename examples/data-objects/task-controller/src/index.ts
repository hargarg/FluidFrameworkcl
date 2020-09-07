/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DataObject, DataObjectFactory } from "@fluidframework/aqueduct";

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pkg = require("../package.json");
export const controllerName = pkg.name as string;

export class Controller extends DataObject {

}

export const ClickerInstantiationFactory = new DataObjectFactory(
    controllerName,
    Controller,
    [],
    {},
);

export const fluidExport = ClickerInstantiationFactory;
