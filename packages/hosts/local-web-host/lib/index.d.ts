/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { IProvideRuntimeFactory, IFluidModule } from "@fluidframework/container-definitions";
import { Container } from "@fluidframework/container-loader";
import { IProvideFluidDataStoreFactory } from "@fluidframework/runtime-definitions";
export declare function createLocalContainerFactory(entryPoint: Partial<IProvideRuntimeFactory & IProvideFluidDataStoreFactory & IFluidModule>): Promise<() => Promise<Container>>;
export declare function renderDefaultFluidObject(container: Container, div: HTMLElement): Promise<void>;
//# sourceMappingURL=index.d.ts.map