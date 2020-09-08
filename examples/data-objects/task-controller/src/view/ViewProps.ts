import { IDirectory } from "@fluidframework/map";
import { ListComponent } from "@fluid-example/listexternal";

export interface ViewProps extends ViewBaseProps {
    callbacks: ViewCallbacks;
}

export interface ViewCallbacks {
    methodName?: () => void;
}

interface ViewBaseProps {
    dataModel: ListComponent | undefined;
    viewModel: IDirectory | undefined;
}
