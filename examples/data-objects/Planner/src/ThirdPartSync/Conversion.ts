import { PlannerTask, PlannerPlan } from '../service/PlannerService';
import { TaskStatus } from './Planner';
import { PlannerStoreTask, PlannerStorePlan } from './PlannerStore';
import { Task } from './ITaskDataSync';

/**
 * Convert Task retrieved from Graph Planner Service to the Planner Store Format
 * @param task
 */
export function handleGraphTaskForStore(task: PlannerTask): PlannerStoreTask {
  let newTask: PlannerStoreTask = {
    taskName: task.title,
    assignee: task.assignee,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    status: task.status === TaskStatus.Completed ? true : false,
    id: task.id,
    boardId: task.planId,
    bucketId: task.bucketId,
    etag: task.etag,
    order: task.orderHint
  };
  return newTask;
}

/**
 * Convert Plan retrieved from Graph Planner Service to the Planner Store Format
 * @param plan
 */
export function convertToPlannerStorePlan(plan: PlannerPlan): PlannerStorePlan {
  let final_plan: PlannerStorePlan = {
    boardId: plan.id,
    boardName: plan.title,
    groupId: plan.owner!,
    etag: plan.etag
  };
  return final_plan;
}

export function convertGraphTaskToTaskIntance(task: PlannerTask): Task {
  let newTask: Task = {
    taskName: task.title,
    assignee: task.assignee,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    status: task.status === TaskStatus.Completed ? true : false,
    id: task.id,
    boardId: task.planId,
    bucketId: task.bucketId,
    order: task.orderHint
  };
  return newTask;
}
