import { PlannerService } from '../service/PlannerService';
import { PlannerStore, PlannerStoreTask, PlannerStoreBucket } from './PlannerStore';
import { Task, Bucket, Board } from './ITaskDataSync';

/**
 * Type of Operation To identify by the Bridge
 */
enum DeltaDataType {
  PLANTASK = '#microsoft.graph.plannerTask',
  PLANTASKDETAILS = '#microsoft.graph.plannerTaskDetails',
  PLANBUCKET = '#microsoft.graph.plannerBucket'
}

export enum DeltaType {
  TASK_DELETE = 'DELETE',
  TASK_UPDATE = 'UPDATE',
  TASK_INSERT = 'INSERT',
  BUCKET_DELETE = 'BUCKET_DELETE',
  BUCKET_UPDATE = 'BUCKET_UPDATE'
}
export type DeltaTask = {
  title?: string;
  bucketId?: string;
  planId?: string;
  id: string;
  orderHint?: string;
  percentComplete?: number;
  dueDateTime?: string;
  assignments?: any;
  '@odata.etag'?: string;
  createdDateTime?: string;
  createdBy?: string;
  '@removed'?: any;
};

export type DeltBucket = { id: string; name?: string; '@removed': string };

export type DeltaTaskDetails = { id: string; '@odata.etag'?: string; description?: string };

interface Delta {
  /**
   * This is the delta link corresponding to the next changes we are going to receive
   */
  deltaLink: string;

  /**
   *  This contains the changes received for an old Delta Link
   */
  changeValues: any | undefined;
}

/**
 * Handles all Delta related to Planner
 */
export class DeltaHandler {
  private readonly plannerService: PlannerService;
  private plannerStore: PlannerStore;
  private deltaData!: Delta;

  constructor(plannerService: PlannerService, plannerStore: PlannerStore) {
    this.plannerService = plannerService;
    this.plannerStore = plannerStore;
    this.subscribeToDelta().catch((err) => console.log(err));
  }

  /**
   * Subscribe for Deltas(Changes going at Planner side) from Graph Planner Service
   */
  public async subscribeToDelta() {
    const response = await this.plannerService.subscribeToDelta();
    if (response) {
      this.deltaData = { deltaLink: response, changeValues: undefined };
    }
  }

  /**
   *
   * @param plan This function returns Three Values:
   * 1. Full Tasks data which are updated or newly added in Planner
   * 2. All the tasks present in the local Storage
   * 3. Tasks data which got updated or newly Added but returns only field which got changed
   */
  public async getDelta(plan: Board) {
    if (!this.deltaData?.deltaLink) {
      return undefined;
    }
    const result = await this.plannerService.getPlanDelta(this.deltaData.deltaLink);
    let newDeltaLink = result['@odata.deltaLink'];
    this.deltaData = { deltaLink: newDeltaLink, changeValues: result.value } as Delta;
    let [taskChanges, bucketChanges] = await this.identifyDeltaChange(result);
    let taskDetailChanges = await this.getPlanTaskDetailChanges(result);
    let [changedAndNewtasks, columnchanged] = await this.parseTaskChanges(taskChanges, plan);
    let [changedAndNewtaskDetails, columnChangedTaskDetails] = await this.parseTaskDetailChanges(taskDetailChanges);
    let bucketChanged = await this.parseBucketChanges(bucketChanges);
    let allTasks: Array<Task> = this.plannerStore.getAllTaskObject();
    return {
      changedAndNewtasks: this.mergeInsertAndUpdate(changedAndNewtasks, changedAndNewtaskDetails, 'id'),
      all_tasks: allTasks,
      columnChanged: [...this.mergeInsertAndUpdate(columnchanged, columnChangedTaskDetails, 'id'), ...bucketChanged]
    };
  }

  private mergeInsertAndUpdate(insertedOps: Array<Partial<Task>>, updatedops: Array<Partial<Task>>, uniqueid: string) {
    let filterdUpdated: any = [];
    for (let index in updatedops) {
      let insertIndex = insertedOps.findIndex((el) => el[uniqueid] === updatedops[index][uniqueid]);
      if (
        insertIndex >= 0 &&
        'type' in insertedOps[insertIndex] &&
        insertedOps[insertIndex].type === DeltaType.TASK_INSERT
      ) {
        insertedOps[insertIndex] = { ...insertedOps[insertIndex], ...updatedops[index], type: DeltaType.TASK_INSERT };
      } else if (
        insertIndex >= 0 &&
        'type' in insertedOps[insertIndex] &&
        insertedOps[insertIndex].type === DeltaType.TASK_UPDATE
      ) {
        insertedOps[insertIndex] = { ...insertedOps[insertIndex], ...updatedops[index], type: DeltaType.TASK_UPDATE };
      } else if (insertIndex >= 0) {
        insertedOps[insertIndex] = { ...insertedOps[insertIndex], ...updatedops[index] };
      } else {
        filterdUpdated.push(updatedops[index]);
      }
    }

    return [...insertedOps, ...filterdUpdated];
  }

  /**
   * Identify type of changes from all Deltas
   * Currrently use changes related to Task and Bucket
   * @param result
   */
  private async identifyDeltaChange(result: any) {
    let taskChanges = result.value.filter((val: any) => {
      if (val['@odata.type'] === DeltaDataType.PLANTASK) {
        return val;
      }
    });
    let bucketChanges = result.value.filter((val: any) => {
      if (val['@odata.type'] === DeltaDataType.PLANBUCKET) {
        return val;
      }
    });
    return [taskChanges, bucketChanges];
  }

  private async getPlanTaskDetailChanges(result: any) {
    return result.value.filter((val: any) => {
      if (val['@odata.type'] === DeltaDataType.PLANTASKDETAILS) {
        return val;
      }
    });
  }

  private async parseTaskDetailChanges(taskDetailChanges: Array<DeltaTaskDetails>) {
    let taskChanged: Array<Task> = [];
    let columnChanged: Array<Partial<Task>> = [];
    for (let taskDetail of taskDetailChanges) {
      let storetask: PlannerStoreTask | undefined = this.plannerStore.getTaskStoreMap(taskDetail.id);
      let updatedTaskProp: Partial<PlannerStoreTask> = {
        id: storetask?.id,
        bucketId: storetask?.bucketId,
        boardId: storetask?.boardId
      };
      if (!storetask) {
        return [];
      }
      if ('description' in taskDetail && storetask.description !== taskDetail.description) {
        storetask.description = taskDetail.description;
        updatedTaskProp.description = taskDetail.description;
      }

      if ('@odata.etag' in taskDetail) {
        storetask.taskDetailsEtag = taskDetail['@odata.etag'];
      }
      this.plannerStore.setTaskObjectMap(taskDetail['id'], storetask);
      updatedTaskProp['type'] = DeltaType.TASK_UPDATE;
      let indexOfTaskInChanges = taskChanged.findIndex((element) => element?.id === taskDetail['id']);
      if (indexOfTaskInChanges >= 0) {
        taskChanged[indexOfTaskInChanges] = { ...taskChanged[indexOfTaskInChanges], ...storetask };
        columnChanged[indexOfTaskInChanges] = { ...columnChanged[indexOfTaskInChanges], ...updatedTaskProp };
      } else {
        taskChanged.push({ ...storetask });
        columnChanged.push({ ...updatedTaskProp });
      }
    }
    return [taskChanged, columnChanged];
  }
  /**
   * When a new task is added on planner Side
   * @param task
   * @param taskChanged
   * @param columnChanged
   */
  private handleNewTask(task: DeltaTask, taskChanged: Array<Task>, columnChanged: Array<Partial<Task>>) {
    if (this.plannerStore.getTaskStoreMap(task['id'])) {
      return;
    }
    this.plannerStore.setTaskObjectMap(task['id'], {
      taskName: task.title,
      boardId: task.planId,
      bucketId: task.bucketId,
      id: task['id'],
      status: task.percentComplete === 100 ? true : false,
      dueDate: task.dueDateTime ? new Date(task.dueDateTime) : undefined,
      assignee: task.assignments ? Object.keys(task['assignments']) : undefined,
      etag: task['@odata.etag'],
      order: task.orderHint,
      type: DeltaType.TASK_INSERT
    } as PlannerStoreTask);
    let storeTask = this.plannerStore.getTaskStoreMap(task['id']);
    if (storeTask) {
      taskChanged.push(storeTask);
      columnChanged.push(storeTask);
    }
  }

  /**
   * Handles whenever there is any update of Task from planner Side
   * @param task
   * @param taskChanged
   * @param columnChanged
   */
  private handleUpdateTask(
    task: DeltaTask,
    taskChanged: Array<Task | undefined>,
    columnChanged: Array<Partial<Task> | undefined>
  ) {
    if (!this.plannerStore.getTaskStoreMap(task['id'])) {
      return;
    }

    let anyColumnUpdated: Boolean = false;
    let storeTaskObj = this.plannerStore.getTaskStoreMap(task['id']);

    let updatedTaskProp: Partial<PlannerStoreTask> = {
      id: storeTaskObj?.id,
      bucketId: storeTaskObj?.bucketId,
      boardId: storeTaskObj?.boardId
    };
    if (!storeTaskObj) {
      // As plannerstore currently contains tasks for one Planner so if it is not present in the plannerstore then task does not belongs to that particular planner
      return;
    }

    if (task['@odata.etag']) {
      storeTaskObj.etag = task['@odata.etag'];
      this.plannerStore.setTaskObjectMap(task['id'], storeTaskObj);
    }
    // flow to handle if task object does not exist in local needs to be implemented
    if (task.assignments && this.isAssigneesChanged(storeTaskObj, task.assignments)) {
      let { removed_assignees, new_assignees } = this.handleAssignments(task.assignments);
      if (!storeTaskObj['assignee']) {
        storeTaskObj['assignee'] = new_assignees;
      }
      let final_assignee: string[] = storeTaskObj['assignee']!.filter((user) => !removed_assignees.includes(user));
      for (let user of new_assignees) {
        if (final_assignee.indexOf(user) === -1) {
          final_assignee.push(user);
        }
      }
      storeTaskObj['assignee'] = final_assignee;
      updatedTaskProp['assignee'] = final_assignee;
      anyColumnUpdated = true;
    }

    if ('title' in task && storeTaskObj['taskName'] !== task['title']) {
      storeTaskObj['taskName'] = task['title'];
      updatedTaskProp['taskName'] = task['title'];
      anyColumnUpdated = true;
    }

    if ('dueDateTime' in task && this.isDueDateChanged(storeTaskObj, task.dueDateTime)) {
      storeTaskObj['dueDate'] = task.dueDateTime ? new Date(task.dueDateTime) : undefined;
      updatedTaskProp['dueDate'] = task.dueDateTime ? new Date(task.dueDateTime) : undefined;
      anyColumnUpdated = true;
    }

    if ('percentComplete' in task && storeTaskObj['status'] !== (task.percentComplete === 100 ? true : false)) {
      storeTaskObj['status'] = task.percentComplete === 100 ? true : false;
      updatedTaskProp['status'] = task.percentComplete === 100 ? true : false;
      anyColumnUpdated = true;
    }

    if (task.planId && storeTaskObj['boardId'] !== task['planId']) {
      storeTaskObj['boardId'] = task['planId'];
      updatedTaskProp['boardId'] = task['planId'];
      anyColumnUpdated = true;
    }

    if (task.bucketId && storeTaskObj['bucketId'] !== task['bucketId']) {
      storeTaskObj['bucketId'] = task['bucketId'];
      updatedTaskProp['bucketId'] = task['bucketId'];
      anyColumnUpdated = true;
    }

    if (task['@removed']) {
      this.plannerStore.deleteTaskFromStore(storeTaskObj);
      updatedTaskProp['type'] = DeltaType.TASK_DELETE;
      columnChanged.push(updatedTaskProp);
      return;
    }

    if (anyColumnUpdated) {
      this.plannerStore.setTaskObjectMap(task['id'], storeTaskObj);
      updatedTaskProp['type'] = DeltaType.TASK_UPDATE;
      let indexOfTaskInChanges = taskChanged.findIndex((element) => element?.id === task['id']);
      if (indexOfTaskInChanges >= 0) {
        taskChanged[indexOfTaskInChanges] = { ...taskChanged[indexOfTaskInChanges], ...storeTaskObj };
        columnChanged[indexOfTaskInChanges] = { ...columnChanged[indexOfTaskInChanges], ...updatedTaskProp };
      } else {
        taskChanged.push(storeTaskObj);
        columnChanged.push(updatedTaskProp);
      }
    }
  }

  private isAssigneesChanged(storeTask: PlannerStoreTask, assignments: any) {
    let { removed_assignees, new_assignees } = this.handleAssignments(assignments);
    if (!storeTask['assignee']) {
      return true;
    }
    let userPresentInStoreAndRemoved = removed_assignees.filter((user: any) => storeTask['assignee']?.includes(user));
    let UserNotPresentInstore = new_assignees.filter((user: any) => !storeTask['assignee']?.includes(user));
    if (userPresentInStoreAndRemoved.length > 0 || UserNotPresentInstore.length > 0) {
      return true;
    }
    return false;
  }

  private handleAssignments(assignments: any) {
    let removed_assignees: Array<string> = Object.keys(assignments).filter((user) => assignments[user] === null);
    let new_assignees: Array<string> = Object.keys(assignments).filter((user) => assignments[user] !== null);
    return { removed_assignees, new_assignees };
  }

  private isDueDateChanged(storeTask: PlannerStoreTask, newDate: string | null | undefined) {
    if (!storeTask['dueDate'] && !newDate) {
      return false;
    }
    if (storeTask['dueDate'] && !newDate) {
      return true;
    }
    if (!storeTask['dueDate'] && newDate) {
      return true;
    }
    if (storeTask['dueDate'] && newDate && storeTask['dueDate'].valueOf() !== new Date(newDate).valueOf()) {
      return true;
    }
    return false;
  }

  private async parseTaskChanges(taskChanges: Array<DeltaTask>, plan: Board) {
    let taskChanged: Array<Task> = [];
    let columnChanged: Array<Partial<Task>> = [];

    for (let task of taskChanges) {
      if (task.createdDateTime && task.createdBy && task.planId === plan.boardId) {
        this.handleNewTask(task, taskChanged, columnChanged);
      } else {
        this.handleUpdateTask(task, taskChanged, columnChanged);
      }
    }
    return [taskChanged, columnChanged];
  }

  private async parseBucketChanges(bucketChanges: Array<DeltBucket>) {
    let bucketChanged: Array<Partial<Bucket> | undefined> = [];
    for (let bucket of bucketChanges) {
      this.handleBucketDeltaUpdate(bucket, bucketChanged);
      this.handleBucketDeltaDelete(bucket, bucketChanged);
    }
    return bucketChanged;
  }

  /**
   * Checks if there is any update in the bucket By parsing delta
   * @param bucket - This is delta realted to a bucket
   * @param bucketChanged - This Array contains Buckets and fields which are changed
   */
  private handleBucketDeltaUpdate(bucket: DeltBucket, bucketChanged: Array<Partial<Bucket> | undefined>) {
    if ('name' in bucket) {
      let storeBucket = this.plannerStore.getPlanBucketMap(bucket.id);
      if (!storeBucket) return;
      if (storeBucket?.bucketName !== bucket.name) {
        let updatedTaskProp: Partial<PlannerStoreBucket> = {
          bucketId: storeBucket?.bucketId,
          boardId: storeBucket?.boardId,
          bucketName: bucket.name,
          type: DeltaType.BUCKET_UPDATE
        };
        let indexOfBucketInChanges = bucketChanged.findIndex((element) => element?.bucketId === bucket['id']);
        if (indexOfBucketInChanges >= 0) {
          bucketChanged[indexOfBucketInChanges] = { ...bucketChanged[indexOfBucketInChanges], ...updatedTaskProp };
        } else {
          bucketChanged.push(updatedTaskProp);
        }
      } else {
        let indexOfBucketInChanges = bucketChanged.findIndex((element) => element?.bucketId === bucket['id']);
        if (indexOfBucketInChanges >= 0) {
          bucketChanged.splice(indexOfBucketInChanges, 1);
        }
      }
    }
  }

  private handleBucketDeltaDelete(bucket: DeltBucket, bucketChanged: Array<Partial<Bucket> | undefined>) {
    if ('@removed' in bucket) {
      let storeBucket = this.plannerStore.getPlanBucketMap(bucket.id);
      let updatedTaskProp: Partial<PlannerStoreBucket> = {
        bucketId: storeBucket?.bucketId,
        boardId: storeBucket?.boardId,
        type: DeltaType.BUCKET_DELETE
      };
      bucketChanged.push(updatedTaskProp);
    }
  }
}
