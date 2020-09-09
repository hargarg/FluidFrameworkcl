import {
  PlannerService,
  PlannerBucket,
  PlannerPlan,
  PlannerPlanDetails,
  PlannerTaskDetails,
  PlannerTask,
  People
} from '../service/PlannerService';
import { PlannerStore, PlannerStoreBucket, PlannerStoreTask, PlannerStorePlan } from './PlannerStore';
import { convertToPlannerStorePlan, handleGraphTaskForStore } from './Conversion';
import { Task } from './ITaskDataSync';
import { membersOwnersType } from './Planner';

export const getPlannerServicePlan = async (plannerService: PlannerService, planId: string) => {
  return await plannerService.getPlan(planId);
};

/**
 * Serve as Cache for the mapping of BoardId to GroupId
 */
let planGroups: { [boardId: string]: string | undefined } = {};
/**
 * get GroupId for BoardId- as each board is associated to group
 */

export const getGroupOfPlan = async (boardId: string, plannerStore: PlannerStore, plannerService: PlannerService) => {
  if (!planGroups[boardId]) {
    let storePlan: PlannerStorePlan | undefined = plannerStore.getPlannerPlan();
    if (storePlan) planGroups[boardId] = storePlan.groupId;
    let result: PlannerPlan | undefined = await plannerService.getPlan(boardId);
    if (result) {
      planGroups[boardId] = result.owner!;
    }
  }
  return planGroups[boardId];
};

/* Store Members and Owners of Plan */
let membersPlan: { [boardId: string]: People[] | undefined } = {};
let ownersPlan: { [boardId: string]: People[] | undefined } = {};
/**
 *get members and owners of the plan
 */
export const getMemberAndOwnersOfPlan = async (
  boardId: string,
  plannerStore: PlannerStore,
  plannerService: PlannerService
): Promise<membersOwnersType> => {
  let result: string | undefined = await getGroupOfPlan(boardId, plannerStore, plannerService);
  if (!result) return { members: undefined, owners: undefined };
  if (!membersPlan[boardId]) {
    membersPlan[boardId] = await plannerService.getGroupMembers(result);
  }
  if (!ownersPlan[boardId]) {
    ownersPlan[boardId] = await plannerService.getGroupOwners(result);
  }
  return { members: membersPlan[boardId], owners: ownersPlan[boardId] };
};

/**
 * Initialize planner Local storage(PlannerStore) with existing data from Planner
 * Also share the particular plan with a User
 * @param boardID
 * @param plannerStore
 * @param plannerService
 */
export const initializeStoreAndSharePlanWithUser = async (
  boardID: string,
  plannerStore: PlannerStore,
  plannerService: PlannerService
) => {
  await initializePlannerStorePlan(boardID, plannerStore, plannerService);
  await initializePlannerStoreBuckets(boardID, plannerStore, plannerService);
  await sharePlanWithCurrentUser(plannerStore, plannerService);
};

/**
 * Used to share the plan with the current LoggedIn user
 * @param plannerStore
 * @param plannerService
 */
export const sharePlanWithCurrentUser = async (plannerStore: PlannerStore, plannerService: PlannerService) => {
  let storePlan = plannerStore.getPlannerPlan();
  if (!storePlan) return undefined;
  const getCurrentUser = await plannerService.getMe();
  if (!storePlan.sharedWith?.includes(getCurrentUser.id)) {
    if (!storePlan.members?.includes(getCurrentUser.id)) {
      await plannerService.addMemberGroup(storePlan!.groupId, getCurrentUser.id);
    }
    const response = await plannerService.updatePlanSharingDetails(
      storePlan.boardId,
      [getCurrentUser.id],
      storePlan.planDetailEtag!
    );
    return response;
  }
  return [];
};

/**
 * Add member in the Group related to Plan and also add to local store(Planner Store)
 * @param userId
 * @param plannerStore
 * @param plannerService
 */
export const addMemberInPlan = async (userId: string, plannerStore: PlannerStore, plannerService: PlannerService) => {
  let storePlan = plannerStore.getPlannerPlan();
  if (!storePlan) return;
  const response = await plannerService.addMemberGroup(storePlan.groupId, userId);
  if (response.ok) {
    plannerStore.addMembertToStorePlan(userId);
  }
  return storePlan.members;
};

/**
 * Fill all data from the Planner to the local Storage Buckets
 * @param boardID
 * @param plannerStore
 * @param plannerService
 */
export const initializePlannerStoreBuckets = async (
  boardID: string,
  plannerStore: PlannerStore,
  plannerService: PlannerService
) => {
  let result: PlannerBucket[] | undefined = await plannerService.getAllBucketsForPlan(boardID);
  if (result) {
    result.forEach((bucket) => {
      plannerStore.setPlanBucketMap({
        boardId: boardID,
        bucketId: bucket.id,
        bucketName: bucket.name,
        etag: bucket.etag,
        tasks: []
      } as PlannerStoreBucket);
    });
  }
};

/**
 * Retrieve data from Planner and Set to Planner Store Plan mapping
 * retrieves all members belonged to a Group related to Plan
 * Retrives with whom the plan is shared With- We need to add a userId in SharedWith to retrieve delta for the Particular Plan
 * @param boardID
 * @param plannerStore
 * @param plannerService
 */
export const initializePlannerStorePlan = async (
  boardID: string,
  plannerStore: PlannerStore,
  plannerService: PlannerService
) => {
  let result: PlannerPlan | undefined = await plannerService.getPlan(boardID);
  if (result) {
    let storePlan = convertToPlannerStorePlan(result);
    let groupMembers: Array<any> | undefined = await plannerService.getGroupMembers(storePlan.groupId);
    let planDetails: PlannerPlanDetails | undefined = await plannerService.getPlanDetails(boardID);
    if (planDetails) {
      storePlan.planDetailEtag = planDetails.etag;
      storePlan.sharedWith = planDetails.sharedWith;
    }
    storePlan.members = groupMembers ? groupMembers.map((element) => element.id) : [];
    plannerStore.setPlannerPlan(storePlan);
  }
};

export const getTaskDetails = async (taskId: string, plannerService: PlannerService) => {
  const taskDetails: PlannerTaskDetails | undefined = await plannerService.getTaskDetails(taskId);
  if (!taskDetails) return undefined;
  return taskDetails;
};

export const addTaskDetailsToTask = async (task: Task, taskDetails: PlannerTaskDetails): Promise<Task> => {
  if (!taskDetails) {
    return task;
  }
  return { ...task, description: taskDetails.description };
};

export const addTaskDetailsToPlannerTaskStore = async (
  task: PlannerStoreTask,
  taskDetails: PlannerTaskDetails
): Promise<PlannerStoreTask> => {
  if (!taskDetails) {
    return task;
  }
  return { ...task, description: taskDetails.description, taskDetailsEtag: taskDetails.etag };
};

export const handleDescription = async () => { };

export const UpdateTaskStoreMapForTask = async (
  taskId: string,
  plannerStore: PlannerStore,
  plannerService: PlannerService
) => {
  let task: PlannerTask | undefined = await plannerService.getTask(taskId);
  if (!task) {
    return undefined;
  }
  let storeTask = handleGraphTaskForStore(task);
  let taskDetail = await plannerService.getTaskDetails(taskId);
  if (taskDetail) {
    storeTask = await addTaskDetailsToPlannerTaskStore(storeTask, taskDetail);
  }
  plannerStore.setTaskObjectMap(task.id, storeTask);
  return storeTask;
};

export const UpdateTaskStoreMapForTaskWitoutDetails = async (
  taskId: string,
  plannerStore: PlannerStore,
  plannerService: PlannerService
) => {
  let task: PlannerTask | undefined = await plannerService.getTask(taskId);
  if (!task) {
    return undefined;
  }
  let graphStoreTask = handleGraphTaskForStore(task);
  let storeTask: PlannerStoreTask | undefined = plannerStore.getTaskStoreMap(taskId);
  let updatedStoreTask = { ...storeTask, ...graphStoreTask };
  plannerStore.setTaskObjectMap(task.id, updatedStoreTask);
  return updatedStoreTask;
};

export const getTaskStoreMap = async (taskId: string, plannerStore: PlannerStore, plannerService: PlannerService) => {
  let storeTask: PlannerStoreTask | undefined = plannerStore.getTaskStoreMap(taskId);
  if (!storeTask) {
    storeTask = await UpdateTaskStoreMapForTask(taskId, plannerStore, plannerService);
  }
  return storeTask;
};

export const identifyAssignee = async (task: Task, plannerStore: PlannerStore) => {
  let storeAssignee = plannerStore.getTaskStoreMap(task.id)!.assignee!;
  let assigneeToBeRemoved: any = [];
  let newAssignee = task.assignee ? task.assignee : [];
  assigneeToBeRemoved = storeAssignee.filter((user) => !newAssignee.includes(user));
  return assigneeToBeRemoved ? assigneeToBeRemoved : [];
};

export const checkIfAllFieldEmptyTask = (task: Task) => {
  if (
    (!task.assignee || task.assignee.length === 0) &&
    !task.taskName &&
    !task.description &&
    !task.status &&
    !task.dueDate
  ) {
    return true;
  }
  return false;
};

export const updateStoreBucket = async (
  bucketId: string,
  plannerStore: PlannerStore,
  plannerService: PlannerService
) => {
  let bucket = await plannerService.getBucket(bucketId);
  if (!bucket) {
    return undefined;
  }
  let storeBucket: PlannerStoreBucket | undefined = plannerStore.getPlanBucketMap(bucketId);
  if (!storeBucket) return;
  let updatedStoreBucket: PlannerStoreBucket = {
    ...storeBucket,
    etag: bucket.etag,
    bucketName: bucket.name,
    boardId: bucket.planId
  };
  plannerStore.setPlanBucketMap(updatedStoreBucket);
  return updatedStoreBucket;
};

export const cleanTaskNameField = (taskName: string | undefined) => {
  if (taskName === undefined || taskName.trim() === '') {
    return 'untitled';
  }
  return taskName.trim().slice(0, 255);
};
