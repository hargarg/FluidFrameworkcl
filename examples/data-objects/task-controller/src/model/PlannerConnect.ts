import { DeltaType } from '../ThirdPartSync/DeltaHandler';
import { Task } from '../ThirdPartSync/ITaskDataSync';

export class PlannerConnector {
  private boardId: any;
  public bucketId: any;
  private retryCount: number = 0;
  private tasksListMap: any = {};
  constructor(
    private dataModel: any,
    private Bridge: any,
    private Planner: any,
    private root: any
  ) {

    this.dataModel?.on("listChanged", async (changed) => {
      await this.getAllItems();
    });
    this.dataModel.on("createdList", (changed) => {

    })
    this.getBoardInfo();

  }
  async getBoardInfo() {
    this.boardId = await this.getBoardId();
    this.bucketId = await this.getBucketId();
    const board: any = {
      boardId: this.boardId
    };
    this.Bridge.startSync(board, this.handleAllUpdatesFromPlanner.bind(this), this.handleDeltaUpdatesFromPlanner.bind(this));
    await this.getAllItems();

  }
  async handleAllUpdatesFromPlanner(tasks: Task[]) {
    console.log('handleAllUpdatesFromPlanner............', tasks)
    for (let task of tasks) {
      let row = this.tasksListMap[task.id];
      if (this.ifTaskAlreadyPresent(task)) { continue; }
      if (row) {
        this.dataModel?.insertValueInListItem(row.id, "title", task.taskName);
      } else {
        let id = this.dataModel?.createListItem();
        if (id) {
          this.dataModel?.insertValueInListItem(id, "title", task.taskName);
          this.dataModel?.insertValueInListItem(id, "plannerTaskId", task.id);
        }
      }

    }
  }
  async handleDeltaUpdatesFromPlanner(tasks: Task[]) {
    console.log("handleDeltaUpdatesFromPlanner.....................", tasks)
    for (let task of tasks) {
      let row = this.tasksListMap[task.id];
      switch (task.type) {
        case DeltaType.TASK_UPDATE: {
          this.dataModel?.insertValueInListItem(row.id, "title", task.taskName);
          break;
        }
        case DeltaType.TASK_INSERT: {
            if (this.ifTaskAlreadyPresent(task)) { continue; }
          if (!row) {
            let id = this.dataModel?.createListItem();
            if (id) {
              this.dataModel?.insertValueInListItem(id, "title", task.taskName);
              this.dataModel?.insertValueInListItem(id, "plannerTaskId", task.id);
            }
          }
          break;
        }
        case DeltaType.TASK_DELETE: {
          //
        }
      }
    }
  }
  async getAllItems() {
    const lists = await this.dataModel?.getAllListItems();
    if (lists) {
      for (let i in lists) {
        //console.log(key, value);
        if (!lists[i].plannerTaskId) {
          console.log("create task called")
          console.log(lists, i)
          await this.createTask(lists[i], i);
        } else {
          this.tasksListMap[lists[i].plannerTaskId] = { id: i, value: lists[i] };
        }
      }
    }
  }

  async ifTaskAlreadyPresent(task) {
    const lists = await this.dataModel?.getAllListItems();
    if (lists) {
      for (let i in lists) {
        if (lists[i].plannerTaskId && lists[i].plannerTaskId === task.id) {
          return true;
        }
      }
    }
    return false;
  }

  async createTask(item, id) {
    const plannerTask = await this.Planner.addTask({
      taskName: item.title,
      assignee: [],
      dueDate: undefined,
      status: undefined,
      id: "",
      boardId: this.boardId,
      bucketId: this.bucketId,
    }, this.bucketId)
    await this.dataModel?.insertValueInListItem(id, "plannerTaskId", plannerTask.id);
    this.tasksListMap[plannerTask.id] = { id, value: item };

  }
  async wait(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
  async getBoardId() {
    if (this.root.get("boardId")) {
      return this.root.get("boardId");
    }
    const boardName = this.root.get("boardName");//window.location.pathname.split("/doc/")[1];

    if (!boardName && this.retryCount++ < 30) {
      await this.wait(1000);
      return await this.getBoardId();
    }
    const boardId = await this.Planner.createBoard(boardName);
    this.root.set('boardId', boardId.boardId);
    return boardId.boardId;
  }
  async getBucketId() {
    if (this.root.get("bucketId")) {
      return this.root.get("bucketId");
    }
    const bucketId = await this.createBucket(this.boardId);
    this.root.set('bucketId', bucketId.bucketId);
    this.bucketId = bucketId.bucketId;
    return this.bucketId;
  }
  createBucket(boardId) {
    return this.Planner.createBucket(boardId, "first list");
  }

}
