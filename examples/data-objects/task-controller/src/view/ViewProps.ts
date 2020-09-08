import { IDirectory } from "@fluidframework/map";
import { ListComponent } from "@fluid-example/listexternal";

export interface ViewProps extends ViewBaseProps {
    methods: ViewMethods;
}

export interface ViewMethods {
    methodName?: () => void;
}

interface ViewBaseProps {
    dataModel: ListComponent | undefined;
    viewModel: IDirectory | undefined;
}
