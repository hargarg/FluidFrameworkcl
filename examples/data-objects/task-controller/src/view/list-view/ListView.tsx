import * as React from "react";
import Board from "react-trello";
import { ViewProps } from "../index";

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
      const data: any = {
            lanes: [
              {
                id: "lane1",
                title: "Planned Tasks",
                label: "2/2",
                cards: [
                  { id: "Card1", title: "Write Blog",
                  description: "Can AI make memes", label: "30 mins", draggable: false },
                  { id: "Card2", title: "Pay Rent",
                  description: "Transfer via NEFT", label: "5 mins", metadata: { sha: "be312a1" } },
                ],
              },
              {
                id: "lane2",
                title: "Completed",
                label: "0/0",
                cards: [],
              },
            ],
            editable: true,
      };
      return <Board data={data} editable={true} />;
    }
}
