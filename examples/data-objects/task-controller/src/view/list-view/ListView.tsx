import * as React from "react";
import { IValueChanged, SharedDirectory } from "@fluidframework/map";
import Board from "react-trello";
import { v4 as uuid } from "uuid";

import { ViewProps } from "../index";

export interface ListViewState {
  boardData: any;
}

export class ListView extends React.Component<ViewProps, ListViewState> {
  // private eventBus: any;

  constructor(props: ViewProps) {
    super(props);
    this.state = {
      boardData: {
        lanes: [],
      },
    };
  }
  private readonly handleDataModelChange = (valueChanged: IValueChanged) => {
    const data: any = {
      lanes: [
        {
          id: "lane1",
          title: "Planned Tasks",
          label: "2/2",
          cards: [
            // { id: "Card1", title: "Write Blog",
            // description: "Can AI make memes", label: "30 mins", draggable: false },
            // { id: "Card2", title: "Pay Rent",
            // description: "Transfer via NEFT", label: "5 mins", metadata: { sha: "be312a1" } },
          ],
        },
      ],
      editable: true,
    };
    const dataModel = this.props.dataModel;
    const lists: SharedDirectory | undefined = dataModel?.getAllListItems();
    for (let [key, value] of lists?.subdirectories()!) {
      console.log(key, value);
      data.lanes[0].cards.push({
        title: value.get("title"),
      });
    }
    this.setState({ boardData: data });
  };

  private readonly convertDataModel = () => {
    const data: any = {
      lanes: [
        {
          id: "lane1",
          title: "Planned Tasks",
          label: "2/2",
          cards: [
            // { id: "Card1", title: "Write Blog",
            // description: "Can AI make memes", label: "30 mins", draggable: false },
            // { id: "Card2", title: "Pay Rent",
            // description: "Transfer via NEFT", label: "5 mins", metadata: { sha: "be312a1" } },
          ],
        },
      ],
      editable: true,
    };
    const dataModel = this.props.dataModel;
    const lists: SharedDirectory | undefined = dataModel?.getAllListItems();
    for (let [key, value] of lists?.subdirectories()!) {
      console.log(key, value);
      data.lanes[0].cards.push({
        title: value.get("title"),
      });
    }
    this.setState({ boardData: data });
  };

  private readonly onDataChange = (newData: any) => {
    console.log(newData);
  };

  private readonly onCardAdd = (newData: any) => {
    console.log(newData);
    const dataModel = this.props.dataModel;
    const id = uuid();
    dataModel?.createListItem(id);
    dataModel?.insertValueInListItem(id, "title", newData.title);
  };

  private readonly onCardDelete = (newData: any) => {
    console.log(newData);
  };

  private readonly onCardMoveAcrossLanes = (newData: any) => {
    console.log(newData);
    console.log(this.handleDataModelChange);
    console.log(this.convertDataModel);
  };

  // private readonly setEventBus = (handle) => {
  //     this.eventBus = handle;
  // };

  render() {
    return <Board
      data={this.state.boardData}
      editable={true}
      onDataChange={this.onDataChange}
      onCardAdd={this.onCardAdd}
      onCardDelete={this.onCardDelete}
      onCardMoveAcrossLanes={this.onCardMoveAcrossLanes}
    // eventBusHandle={this.setEventBus}
    />;
  }
}

// let eventBus = undefined

// const setEventBus = (handle) => {
//   eventBus = handle
// }
// //To add a card
// eventBus.publish({type: 'ADD_CARD', laneId: 'COMPLETED', card: {id: "M1", title: "Buy Milk", label: "15 mins",
// description: "Also set reminder"}})

// //To update a card
// eventBus.publish({type: 'UPDATE_CARD', laneId: 'COMPLETED', card: {id: "M1", title: "Buy Milk (Updated)",
// label: "20 mins", description: "Also set reminder (Updated)"}})

// //To remove a card
// eventBus.publish({type: 'REMOVE_CARD', laneId: 'PLANNED', cardId: "M1"})

// //To move a card from one lane to another. index specifies the position to move the card to in the target lane
// eventBus.publish({type: 'MOVE_CARD', fromLaneId: 'PLANNED', toLaneId: 'WIP', cardId: 'Plan3', index: 0})

// //To update the lanes
// eventBus.publish({type: 'UPDATE_LANES', lanes: newLaneData})

// <Board data={data} eventBusHandle={setEventBus}/>
