import { TaskDataSync, Board, Task } from './ITaskDataSync';
import { BridgeInterface } from './IBridge';
import { BridgeScheduler } from './BridgeScheduler';

export enum syncType {
  /**
   * When we want to have all board data sent when ever data is changed on Third Party side
   */
  fullDeltaSync = 'FULL_DATA_SYNC',

  /**
   * Send only tasks updated in the third party side with all data for a particular task
   */
  RowsUpdatedDelta = 'ROWS_UPDATED_SYNC',

  /**
   * Send onlty tasks column which is updated
   */
  ColumnUpdatedData = 'COLUMNS_UPDATED_SYNC'
}

/**
 * Bridge would get instantiated with the Fluid which pulls the data from the Planner and Call the callback function in the Fluid
 *
 */
export class Bridge implements BridgeInterface {
  private timer: any;
  private thirdParty: TaskDataSync;
  private defaultTimeFreq: number = 5000;
  private bridgeScheduler: BridgeScheduler;

  constructor(thirdparty: TaskDataSync, defaultTimerInMilliSec: number) {
    this.thirdParty = thirdparty;
    this.defaultTimeFreq = defaultTimerInMilliSec;
    this.bridgeScheduler = new BridgeScheduler(this.defaultTimeFreq);
  }

  /**
   * this returns with the localStore of the data from Third party
   */
  public async getLocalStore() {
    return this.thirdParty.getLocalStore();
  }

  public async allowThirdPartySync() {
    this.thirdParty.syncEnabled = true;
  }
  /**
   *
   * @param mergeTasks (This function is callback function to the task)
   * @param taskMap
   */
  public async startSync(board: Board, mergeTasks: Function, deltaHandle?: Function) {
    if (!this.isSyncEnabled) return;
    await this.thirdParty
      .getAllTasks(board.boardId)
      .then((data: any) => {
        mergeTasks(data);
      })
      .catch((error: any) => {
        console.error('Sync error - retrying', error);
        setTimeout(async () => {
          await this.startSync(board, mergeTasks, deltaHandle);
        }, this.defaultTimeFreq);
      });

    if (deltaHandle) {
      this.timer = await setTimeout(() => {
        // tslint:disable-next-line: no-floating-promises
        this.startDeltaSync(board, deltaHandle);
      }, this.defaultTimeFreq);
    } else {
      this.timer = await setTimeout(() => {
        // tslint:disable-next-line: no-floating-promises
        this.startFullSync(board, mergeTasks);
      }, this.defaultTimeFreq);
    }
  }

  /**
   *
   */
  private isSyncEnabled(): Boolean {
    if (!this.thirdParty.syncEnabled) {
      return false;
    }
    return true;
  }

  /**
   *
   * @param mergeTasks
   */
  private async startFullSync(board: Board, mergeTasks: Function) {
    if (!this.isSyncEnabled) return;
    await this.thirdParty.getAllTasks(board.boardId).then((data: any) => {
      mergeTasks(data);
    });
    this.timer = await setTimeout(() => {
      // tslint:disable-next-line: no-floating-promises
      this.startFullSync(board, mergeTasks);
    }, this.defaultTimeFreq);
  }

  /**
   *
   * @param deltaHandle
   */
  private async startDeltaSync(board: Board, deltaHandle: Function) {
    if (!this.isSyncEnabled) return undefined;
    let result = await this.thirdParty.getDelta!(board);
    try {
      let changes: Array<Task> = result.changedAndNewtasks;
      let columnchanged: any = result.columnChanged;
      let freq: number = this.bridgeScheduler.getTimer(changes.length);
      if (columnchanged.length > 0) {
        deltaHandle(columnchanged);
      }
      this.timer = await setTimeout(async () => {
        await this.startDeltaSync(board, deltaHandle);
      }, freq);
    } catch (error) {
      this.timer = await setTimeout(async () => {
        await this.startDeltaSync(board, deltaHandle);
      }, this.defaultTimeFreq);
    }

    return undefined;
  }

  /**
   *
   * @param taskMap
   */
  public stopSync() {
    clearTimeout(this.timer);
    if (this.thirdParty.syncEnabled) {
      this.thirdParty.syncEnabled = false;
    }
  }
}
