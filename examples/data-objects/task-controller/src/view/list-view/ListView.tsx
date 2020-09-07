import * as React from "react";
import { ViewProps } from "../ViewController";

export interface ListViewState {
    demo: string;
}

export class ListView extends React.Component<ViewProps, ListViewState> {
    constructor(props: ViewProps) {
        super(props);
    }

    componentDidMount() {
        console.log("inside view");
        console.log(this.props);
    }

    render() {
        return <div>List View component 1</div>;
    }
}
