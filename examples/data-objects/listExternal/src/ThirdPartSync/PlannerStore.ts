import { Task, Board, Bucket } from './ITaskDataSync';
import { People } from '../service/PlannerService';

// tslint:disable-next-line: interface-name
/**
 *
 */
export interface PlannerStorePlan extends Board {
  groupId: string;
  etag?: string;
  members?: Array<string>;
  sharedWith?: Array<string>;
  planDetailEtag?: string;
}

/**
 * Interface for a Bucket of Planner in LocalSTore
 */
// tslint:disable-next-line: interface-name
export interface PlannerStoreBucket extends Bucket {
  etag?: string;
}

// tslint:disable-next-line: interface-name
export interface PlannerStoreTask extends Task {
  etag?: string;
  rowid?: string;
  taskDetailsEtag?: string;
}

/**
 * This class is Local Planner Store which gets stored locally
 * and used to identify changes occured to present tasks or new Tasks Added
 */
export class PlannerStore {
  private plannerPlan: PlannerStorePlan | undefined;
  private planBucketMap: Map<string, PlannerStoreBucket> = new Map();
  private taskStoreMap: Map<string, PlannerStoreTask> = new Map();
  private peopleList: Map<string, People> = new Map();

  constructor() {}

  /**
   * Add People information related in the Board, working as a cache for user information
   * @param userId
   * @param userDetails
   */
  public setPeopleInStore(userId: string, userDetails: People) {
    this.peopleList.set(userId, userDetails);
  }

  /**
   * Returns with Details for a User
   * @param userId
   */
  public getPeopleFromStore(userId: string): People | undefined {
    return this.peopleList.get(userId);
  }

  /**
   * Add and update tasks in the store
   * @param id
   * @param storeTask
   */
  public setTaskObjectMap(id: string, storeTask: PlannerStoreTask) {
    let bucket = this.getPlanBucketMap(storeTask.bucketId);
    if (!bucket) {
      bucket = { bucketId: storeTask.bucketId } as Bucket;
      this.setPlanBucketMap(bucket);
    }
    let new_task: Boolean = true;
    bucket.tasks = bucket.tasks?.map((taskIns: Task) => {
      if (storeTask.id === taskIns.id) {
        new_task = false;
        return storeTask;
      }
      return taskIns;
    });
    if (new_task) {
      if (!bucket.tasks) {
        bucket.tasks = [];
      }
      bucket.tasks.push(storeTask);
      this.setPlanBucketMap(bucket);
    }

    this.taskStoreMap.set(id, storeTask);
  }

  /**
   * Returns information of task for a particular Id
   * @param id
   */
  public getTaskStoreMap(id: string) {
    return this.taskStoreMap.get(id);
  }

  /**
   * Delete tasks from a Store
   * @param taskObj
   */
  public deleteTaskFromStore(taskObj: PlannerStoreTask) {
    let bucket = this.getPlanBucketMap(taskObj.bucketId);
    if (bucket) {
      bucket.tasks = bucket.tasks.filter((task: Task) => task.id !== taskObj.id);
      this.setPlanBucketMap(bucket);
    }
    return this.taskStoreMap.delete(taskObj.id);
  }

  /**
   *  return bucket from Store
   * @param id
   */
  public getPlanBucketMap(id: string) {
    return this.planBucketMap.get(id);
  }

  public setPlanBucketMap(bucket: PlannerStoreBucket) {
    let bucketIndex = this.plannerPlan?.buckets?.findIndex((el) => el.bucketId === bucket.bucketId);
    if (bucketIndex && bucketIndex < 0) {
      this.plannerPlan?.buckets?.push(bucket);
    }
    this.planBucketMap.set(bucket.bucketId, bucket);
  }

  public setPlannerPlan(plan: PlannerStorePlan) {
    this.plannerPlan = plan;
  }

  /**
   * gives with plannerPlan
   */
  public getPlannerPlan() {
    return this.plannerPlan;
  }

  /**
   *
   * @param bucket
   */
  public getAllTaskObjectOfBucket(bucket: PlannerStoreBucket) {
    return this.getPlanBucketMap(bucket.bucketId)?.tasks;
  }

  /**
   * Get all tasks related to a board
   */
  public getAllTaskObject() {
    return [...this.taskStoreMap.values()];
  }

  /**
   * prepare of list of members have access to board
   */
  public addMembertToStorePlan(member: string) {
    if (!this.plannerPlan) {
      return;
    }
    this.plannerPlan.members?.push(member);
  }
}
