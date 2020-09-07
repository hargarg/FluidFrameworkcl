/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DataObjectFactory } from "@fluidframework/aqueduct";
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pkg = require("../package.json");
export const controllerName = pkg.name as string;
import { Controller } from './model/DataController';

export const ClickerInstantiationFactory = new DataObjectFactory(
    controllerName,
    Controller,
    [],
    {},
);

export const fluidExport = ClickerInstantiationFactory;
