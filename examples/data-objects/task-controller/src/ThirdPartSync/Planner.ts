import {
  PlannerService,
  PlannerTask,
  PlannerBucket,
  PlannerTaskDetails,
  People,
  PlannerPlan,
  PlannerTaskFormat
} from '../service/PlannerService';
import { ITelemetryBaseLogger } from '@fluidframework/common-definitions';

import { TaskDataSync, Task, Bucket, Board } from './ITaskDataSync';
import { PlannerStore, PlannerStoreTask, PlannerStoreBucket } from './PlannerStore';
import { DeltaHandler } from './DeltaHandler';
import { handleGraphTaskForStore, convertGraphTaskToTaskIntance } from './Conversion';

import {
  initializeStoreAndSharePlanWithUser,
  getTaskDetails,
  addTaskDetailsToTask,
  addTaskDetailsToPlannerTaskStore,
  getTaskStoreMap,
  identifyAssignee,
  UpdateTaskStoreMapForTask,
  checkIfAllFieldEmptyTask,
  cleanTaskNameField,
  UpdateTaskStoreMapForTaskWitoutDetails,
  updateStoreBucket,
  getMemberAndOwnersOfPlan,
  getGroupOfPlan
} from './PlannerAdapter';
/**
 *  Planner class that interact between sync bridge and the task component
 */
export enum TaskStatus {
  Completed = 100,
  InCompleted
}
export type membersOwnersType = { members: People[] | undefined; owners: People[] | undefined };

/**
 * Planner class acts as a thirdparty service, which can be called by a bridge and also to integrate Fluid with Planner
 *
 */
export class Planner implements TaskDataSync {
  private plannerService: PlannerService;
  public plannerStore: PlannerStore;
  private deltaService: DeltaHandler | undefined;
  public syncEnabled: Boolean = false;
  public isPlannerStoreInitialized: Boolean = false;
  private logger: ITelemetryBaseLogger | undefined;

  constructor(
    private tokenProvider: any | undefined,
    readonly loggerPromise: Promise<ITelemetryBaseLogger | undefined>
  ) {
    console.log(loggerPromise)
    loggerPromise
      .then((logger) => {
        this.logger = logger;
      })
      .catch(() => { });
    this.plannerService = new PlannerService(this.tokenProvider!);
    // tslint:disable-next-line: no-floating-promises
    this.plannerStore = new PlannerStore();
  }

  deleteBucket(listId: string): Promise<any> {
    console.log(listId);
    throw new Error('Method not implemented.');
  }

  authenticationToken?: string | undefined;
  authenticate(setLoginState: Function): void {
    console.log('Method not implemented.', setLoginState);
  }

  public enablesync() {
    this.syncEnabled = true;
  }

  public disablesync() {
    this.syncEnabled = false;
  }

  public async renameBucket(listId: string, bucketName: string): Promise<Response | undefined> {
    let retry_count = 3;
    let name = cleanTaskNameField(bucketName);
    while (retry_count > 0) {
      let storeBucket: PlannerStoreBucket | undefined = this.plannerStore.getPlanBucketMap(listId);
      if (!storeBucket) continue;
      const response = await this.plannerService.updateBucket(listId, name, storeBucket.etag!);
      if (response && (response.status === 409 || response.status === 412)) {
        await updateStoreBucket(listId, this.plannerStore, this.plannerService);
        retry_count = retry_count - 1;
      }
      if (response.ok) {
        this.plannerStore.setPlanBucketMap({ ...storeBucket, bucketName: name });
        return response;
      }
      if (retry_count === 0) {
        return response;
      }
    }
    return undefined;
  }

  public async getAllBuckets(boardId: string): Promise<any> {
    let result: PlannerBucket[] | undefined = await this.plannerService.getAllBucketsForPlan(boardId);
    if (result) {
      result.forEach((bucket) => {
        this.plannerStore.setPlanBucketMap({
          bucketId: bucket.id,
          bucketName: bucket.name,
          etag: bucket.etag
        } as PlannerStoreBucket);
      });
      return result;
    }
  }

  private async convertToTaskObjects(graphPlannerTasks: PlannerTask[]): Promise<Task[]> {
    let tasks: Array<Task> = [];
    for (let graphTask of graphPlannerTasks) {
      let newTask: Task = convertGraphTaskToTaskIntance(graphTask);
      let plannerStoreTask: PlannerStoreTask = handleGraphTaskForStore(graphTask);
      let taskDetail = await getTaskDetails(graphTask.id, this.plannerService);
      if (taskDetail) {
        newTask = await addTaskDetailsToTask(newTask, taskDetail);
        plannerStoreTask = await addTaskDetailsToPlannerTaskStore(plannerStoreTask, taskDetail);
      }
      tasks.push(newTask);
      this.plannerStore.setTaskObjectMap(newTask.id, plannerStoreTask);
    }
    return tasks;
  }

  public async addTask(task: Task, laneId: string): Promise<Task | undefined> {
    if (!this.syncEnabled) {
      return undefined;
    }
    if (checkIfAllFieldEmptyTask(task)) {
      return Promise.reject('ALL Fields Empty');
    }
    task.taskName = cleanTaskNameField(task.taskName);

    if (task.assignee) {
      await this.handleAssignee(task.assignee);
    }
    const taskPlanner: PlannerTask = {
      bucketId: laneId,
      title: task.taskName,
      planId: task.boardId,
      id: '',
      assignee: task.assignee ? task.assignee : [],
      dueDate: task.dueDate
    } as PlannerTask;


    const response = await this.plannerService.createTaskInBucket(taskPlanner);
    if (response.status === 403) {

      return undefined;
    }
    const data = response.ok ? await response.json() : undefined;
    if (!data) {

      return undefined;
    }
    task.id = data.id;
    let bucketTaskBoardFormat: PlannerTaskFormat | undefined = await this.plannerService.getBucketTaskBoardFormat(
      task.id
    );
    if (bucketTaskBoardFormat && task.order) {
      await this.plannerService.updateBucketTaskBoardFormat(task.id, task.order, bucketTaskBoardFormat.etag);
    }
    let taskDetail = await getTaskDetails(task.id, this.plannerService);
    let plannerStoreTask: PlannerStoreTask = handleGraphTaskForStore(data);
    if (taskDetail) {
      plannerStoreTask = await addTaskDetailsToPlannerTaskStore(plannerStoreTask, taskDetail);
    }
    this.plannerStore.setTaskObjectMap(data.id, plannerStoreTask);


    return task;
  }

  /**
   *
   * @param boardName
   */
  public async createBoard(boardName: string) {
    if (!this.syncEnabled) {
      return undefined;
    }

    const getCurrentUser = await this.plannerService.getMe();
    const groupResponse = await this.plannerService.createGroup(getCurrentUser.id, boardName);
    const response = await this.plannerService.createPlan(groupResponse['id'], boardName);
    const data = response.ok ? await response.json() : undefined;
    this.plannerStore.setPlannerPlan({
      boardId: data['id'],
      boardName: data['title'],
      buckets: [],
      etag: data['@odata.etag'],
      groupId: data['owner']
    });

    return { boardId: data['id'], boardName: data['title'] } as Board;
  }

  /**
   * Create Bucket in a Planner
   * @param boardId
   * @param name
   */
  public async createBucket(boardId: string, name: string): Promise<Bucket | undefined> {
    if (!this.syncEnabled) {
      return undefined;
    }

    const plannerBucket: PlannerBucket = { planId: boardId, name, id: '' } as PlannerBucket;
    const response = await this.plannerService.createBucketForPlan(plannerBucket);
    const data = response ? await response.json() : undefined;
    const bucket: Bucket = {
      boardId,
      bucketId: data['id'],
      bucketName: data['name'],
      tasks: []
    };
    this.plannerStore.setPlanBucketMap(bucket);

    return bucket;
  }

  /**
   *
   * @param task
   */
  public async updateTask(task: Task): Promise<any> {
    if (!this.syncEnabled) {
      return undefined;
    }
    if ('taskName' in task) {
      task.taskName = cleanTaskNameField(task.taskName);
    }
    let assigneeToBeRemoved: Array<string> = [];
    await UpdateTaskStoreMapForTask(task.id, this.plannerStore, this.plannerService);

    let plannerStoreTask: PlannerStoreTask | undefined = await getTaskStoreMap(
      task.id,
      this.plannerStore,
      this.plannerService
    );

    let etag_val = plannerStoreTask?.etag;
    const plan = this.plannerStore.getPlannerPlan();

    // Handles indentifying if some assignees to be removed while updating task
    // and Adding user to the Plan Group
    if ('assignee' in task && plan) {
      assigneeToBeRemoved = await identifyAssignee(task, this.plannerStore);
      await this.handleAssignee(task.assignee);
    }

    const taskplan: PlannerTask = {
      id: task.id,
      title: task.taskName,
      assignee: task.assignee,
      dueDate: task.dueDate ? task.dueDate : undefined,
      etag: etag_val,
      status: task.status === false ? 0 : 100
    } as PlannerTask;

    const response = await this.plannerService.updateTask(taskplan, assigneeToBeRemoved);

    if (task.description !== undefined && plannerStoreTask?.description !== task.description) {
      let taskDetailsEtag = plannerStoreTask?.taskDetailsEtag;
      await this.plannerService.updateTaskDetails({
        id: task.id,
        etag: taskDetailsEtag,
        description: task.description
      } as PlannerTaskDetails);
    }
    if (response.status === 412 || response.status === 409) {
      await UpdateTaskStoreMapForTask(task.id, this.plannerStore, this.plannerService);
      // tslint:disable-next-line: no-floating-promises
      await this.updateTask(task);
    }
    if (response.ok && task.id) {
      plannerStoreTask = { ...plannerStoreTask, ...task };
      plannerStoreTask.etag = etag_val;
      this.plannerStore.setTaskObjectMap(task.id, plannerStoreTask);
    }
    return response;
  }

  /**
   *
   * @param taskId
   */
  public async deleteTask(taskId: string): Promise<any> {
    if (!this.syncEnabled) {
      return undefined;
    }

    let retry_count = 3;
    while (retry_count > 0) {
      await UpdateTaskStoreMapForTaskWitoutDetails(taskId, this.plannerStore, this.plannerService);
      let etag_val = this.plannerStore.getTaskStoreMap(taskId)?.etag;
      let plannerTask: PlannerTask = {
        id: taskId,
        etag: etag_val
      } as PlannerTask;
      const response = await this.plannerService.deletetask(plannerTask);
      if (!response) {
        return undefined;
      }
      if (response.status === 412 || response.status === 409) {
        retry_count = retry_count - 1;
      }
      if (response.ok) {
        const task = this.plannerStore.getTaskStoreMap(taskId);
        if (task) this.plannerStore.deleteTaskFromStore(task);
        return response;
      }
    }
    return undefined;
  }

  /**
   *
   * @param id
   */
  public async getUserFromId(id: string): Promise<People | undefined> {
    let userFromStore: People | undefined = this.plannerStore.getPeopleFromStore(id);
    if (userFromStore) {
      return userFromStore;
    }
    const response: People | undefined = await this.plannerService.getUserFromId(id);
    if (response) {
      this.plannerStore.setPeopleInStore(id, response);
    }
    return response;
  }

  private async handleAssignee(assignees: Array<string> | undefined) {
    let plan = this.plannerStore.getPlannerPlan();
    if (!plan || !assignees) {
      return;
    }
    let planMembers: Array<string> = plan.members ? plan.members : [];
    let newMembers: Array<string> = assignees.filter((user) => !planMembers.includes(user));
    newMembers.forEach(async (member) => await this.plannerService.addMemberGroup(plan!.groupId, member));
    plan.members = [...planMembers, ...newMembers];
    this.plannerStore.setPlannerPlan(plan);
  }

  /**
   *
   * @param laneId
   */
  public async getAllTasks(boardID: string, laneId?: string) {
    if (!boardID) {
      return [];
    }
    if (!this.isPlannerStoreInitialized) {
      await initializeStoreAndSharePlanWithUser(boardID, this.plannerStore, this.plannerService);
      this.isPlannerStoreInitialized = true;
    }
    const response = !laneId
      ? await this.plannerService.getAllTasksForPlan(boardID)
      : await this.plannerService.getAllTasksForBucket(laneId);
    const result = response ? await response : undefined;
    if (result) {
      return this.convertToTaskObjects(result);
    }
    return [];
  }

  public async addMemberToBoard(boardId: string, memberId: string): Promise<Response | undefined> {
    let groupId: string | undefined = await getGroupOfPlan(boardId, this.plannerStore, this.plannerService);
    if (!groupId) return undefined;
    let response: Response = await this.plannerService.addMemberGroup(groupId, memberId);
    if (response && response.ok) {
      return Promise.resolve(response);
    }
    return undefined;
  }

  public async getMemberAndOwnersOfBoard(boardId: string): Promise<membersOwnersType> {
    return getMemberAndOwnersOfPlan(boardId, this.plannerStore, this.plannerService);
  }

  /**
   *
   * @param boardID
   */
  public async getBoard(boardID: string): Promise<Board | undefined> {
    let result: PlannerPlan | undefined = await this.plannerService.getPlan(boardID);
    if (!result) return undefined;
    let board: Board = { boardId: result.id, boardName: result.title, owner: result.owner };
    return board;
  }

  public async getDelta(plan: Board) {
    if (!this.syncEnabled) {
      return undefined;
    }
    if (!this.deltaService) {
      this.deltaService = new DeltaHandler(this.plannerService, this.plannerStore);
    }
    return await this.deltaService.getDelta(plan);
  }

  public async getLocalStore(): Promise<PlannerStore> {
    return await this.plannerStore;
  }
}
