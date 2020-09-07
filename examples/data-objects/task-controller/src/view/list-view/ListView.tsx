import * as React from "react";

export interface ListViewProps {
    demoProp: string;
}

export interface ListViewState {
    demo: string;
}

export class ListView extends React.Component<ListViewProps, ListViewState> {
    constructor(props: ListViewProps) {
        super(props);
    }

    render() {
        return (
            <div>List View component</div>
        );
    }
} 
