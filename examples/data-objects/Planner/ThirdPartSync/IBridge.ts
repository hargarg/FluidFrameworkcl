import { Board } from './ITaskDataSync';
export interface BridgeInterface {
  startSync: (board: Board, syncCallBack: Function) => Promise<any>;

  stopSync: () => void;
}
