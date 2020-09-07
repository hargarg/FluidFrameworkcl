/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DataObjectFactory } from "@fluidframework/aqueduct";
import { SharedDirectory } from "@fluidframework/map";
import { ListComponent } from "./listComponent";

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pkg = require("../package.json");
export const ListComponentName = pkg.name as string;

// ----- FACTORY SETUP -----

export const ListComponentInstantiationFactory = new DataObjectFactory(
    ListComponentName,
    ListComponent,
    [SharedDirectory.getFactory()],
    {},
);
export * from "./listComponent";
export const fluidExport = ListComponentInstantiationFactory;
