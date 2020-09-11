import { ITelemetryBaseLogger } from "@fluidframework/common-definitions";
import * as uuid from "uuid/v4";
import * as qs from "querystring";
import axios from "axios";
import { graphFetch } from "../../utils/graph/graph";

interface Entity {
    id: string;
}

/**
 * People represents User
 */
export interface People extends Entity {
    userPrincipalName?: string;
    displayName?: string;
}

/**
 * Represents bucket in a planner
 */
export interface PlannerBucket extends Entity {
    name: string;
    planId: string;
    tasks?: PlannerTask[];
    etag?: string;
}

/**
 * Represents details in a Plan
 */
export interface PlannerPlanDetails extends Entity {
    sharedWith?: Array<string>;
    etag?: string;
}

/**
 * Represents Plan in a Planner
 */
export interface PlannerPlan extends Entity {
    title: string;
    owner?: string;
    tasks?: PlannerTask[];
    buckets?: PlannerBucket[];
    etag?: string;
}

/**
 * Represents task in a Planner
 */
export interface PlannerTask extends Entity {
    bucketId: string;
    planId: string;
    title?: string;
    created_by?: People;
    assignee?: Array<any>;
    etag?: string;
    status?: any;
    dueDate?: string | null;
    orderHint?: string;
    hasDescription?: boolean;
}

export interface PlannerTaskDetails extends Entity {
    description: string;
    etag: string;
}

/**
 * Represents order of Task in bucket
 */
export interface PlannerTaskFormat extends Entity {
    etag: string;
    orderHint: string;
}

/**
 * Planner Data fetched using Microsoft Graph Service
 *
 */
export class PlannerService {
    private logger: ITelemetryBaseLogger | undefined;

    constructor(
        private tokenProvider: any,
        private loggerPromise?: Promise<ITelemetryBaseLogger | undefined>
    ) {
        if (true) {
            this.tokenProvider = this.getAuthToken();
            this.loggerPromise
                .then((logger: ITelemetryBaseLogger | undefined) => {
                    this.logger = logger;
                })
                .catch(() => { });
        }
    }

    public async getAuthToken() {
        const tenantId = "112b9a0f-232b-4fd9-afff-8a905a467020";
        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const bodyData = {
            grant_type: "password",
            client_id: "f416be8a-da8a-4d94-8504-ab1821757ff3",
            client_secret: "GhurZ0_9S-9W.~NaW-U--za02Em8FCyogE",
            scope: "https://graph.microsoft.com/.default",
            username: "harshitgarg@taskfluidtest.onmicrosoft.com",
            password: "Woku09400",
        };
        const fetchResponse = await axios({
            method: "POST",
            url: tokenUrl,
            data: qs.stringify(bodyData),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;",
            },
        });
        console.log(fetchResponse);
        return fetchResponse.data["access_token"];
    }

    /**
     * Return User Information
     *
     */
    public async getMe(): Promise<any | undefined> {
        const graphUrl = `me`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getMyprofile",
            this.logger
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        const result: any = await response.json();
        return {
            id: result.id,
            userPrincipalName: result.userPrincipalName,
        };
    }

    /**
     * gives basic information of user
     * @param userId
     */
    public async getUserFromId(userId: string): Promise<People | undefined> {
        const graphUrl = `users/${userId}?$select=id,userPrincipalName,displayName`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getUserprofile",
            this.logger
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        const result: People = response.ok ? await response.json() : undefined;
        return result;
    }

    /**
     * Gives all groups to which the Member belongs to
     */
    public async getMemberOf(): Promise<People | undefined> {
        const graphUrl = `me/memberOf`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getMemberOf",
            this.logger
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        const result: any = await response.json();
        return result.value ? result.value : undefined;
    }

    /**
     * Get all Members of Group
     * @param groupId
     */
    public async getGroupMembers(
        groupId: string
    ): Promise<People[] | undefined> {
        const graphUrl = `groups/${groupId}/members?$select=id,userPrincipalName,displayName`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getGroupMembers",
            this.logger
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        const result: any = await response.json();
        let members: People[] = [];
        result.value.forEach((element: any) => {
            members.push({
                id: element.id,
                userPrincipalName: element.userPrincipalName,
                displayName: element.displayName,
            });
        });
        return members;
    }

    /**
     * Get all owners of Group
     * @param groupId
     */
    public async getGroupOwners(
        groupId: string
    ): Promise<People[] | undefined> {
        const graphUrl = `groups/${groupId}/owners?$select=id,userPrincipalName,displayName`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "GetGroupOwners",
            this.logger
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        const result: any = await response.json();
        let owners: People[] = [];
        result.value.forEach((element: any) => {
            owners.push({
                id: element.id,
                userPrincipalName: element.userPrincipalName,
                displayName: element.displayName,
            });
        });
        return owners;
    }

    /**
     * Returns Information related to a Particular Group
     */
    public async getGroupInfo(groupId: string): Promise<People | undefined> {
        const graphUrl = `groups/${groupId}`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getGroupInfo",
            this.logger
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        const result: any = await response.json();
        return result;
    }

    /**
     * Return all plans for group id or user id
     * @param GroupId
     */
    public async getPlansForGroup(
        GroupId: string
    ): Promise<PlannerPlan[] | undefined> {
        const graphUrl = `groups/${GroupId}/planner/plans`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getPlansForGroup",
            this.logger
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        const result: any = await response.json();
        const plans: PlannerPlan[] = [];
        for (let plan of result.value) {
            plans.push({ id: plan.id, title: plan.title } as PlannerPlan);
        }
        return plans;
    }

    /**
     * Create Plan in planner
     * @param groupId
     * @param title
     */
    public async createPlan(groupId: string, title: string): Promise<Response> {
        const graphUrl = `planner/plans`;
        const data = {
            owner: groupId,
            title,
        };
        const retryPolicy = {
            maxRetries: 20,
            backoffFn: constantBackoff(3000),
            filter: whitelist([403, 500, 503, 404]),
        };
        const requestInit = {
            method: "Post",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        } as RequestInit;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "createPlan",
            this.logger,
            requestInit,
            retryPolicy
        );
        return response;
    }

    /**
     * Add member to the group and used in planner when assigning a user to a task
     * @param groupId
     * @param user
     */
    public async addMemberGroup(
        groupId: string,
        userId: string
    ): Promise<Response> {
        const graphUrl = `groups/${groupId}/members/$ref`;
        const userdirectoryurl =
            "https://graph.microsoft.com/v1.0/users/" + userId;
        const data = { "@odata.id": userdirectoryurl };
        const requestInit = {
            method: "Post",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        } as RequestInit;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "addMemberGroup",
            this.logger,
            requestInit
        );
        return response;
    }

    /**
     * Create group in the Active directory
     * @param userId
     * @param groupName
     */
    public async createGroup(userId: string, groupName: string) {
        const graphUrl = `groups`;
        const nickname = `${uuid()}`;
        let data = {
            displayName: groupName,
            mailEnabled: false,
            mailNickname: nickname,
            securityEnabled: false,
            groupTypes: ["Unified"],
            "members@odata.bind": [
                "https://graph.microsoft.com/v1.0/users/" + userId,
            ],
            "owners@odata.bind": [
                "https://graph.microsoft.com/v1.0/users/" + userId,
            ],
            visibility: "Private",
        };

        const requestInit = {
            method: "Post",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        } as RequestInit;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "createGroup",
            this.logger,
            requestInit
        );
        if (!response || response.status !== 201) {
            return undefined;
        }
        return await response.json();
    }

    /**
     * Returns all tasks Present in a Plan for all buckets
     * @param planId
     */
    public async getAllTasksForPlan(planId: string) {
        const graphUrl = `planner/plans/${planId}/tasks`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getalltasksforplan"
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        {
            const result: any = await response.json();
            const tasks: PlannerTask[] = [];
            for (let task of result.value) {
                let assignments = Object.keys(task.assignments);
                tasks.push({
                    id: task.id,
                    bucketId: task.bucketId,
                    planId: task.planId,
                    title: task.title,
                    dueDate: task.dueDateTime,
                    etag: task["@odata.etag"],
                    assignee: assignments,
                    status: task.percentComplete,
                    orderHint: task.orderHint,
                    hasDescription: task.hasDescription,
                } as PlannerTask);
            }
            return tasks;
        }
    }

    /**
     * returns All Tasks for a Particular Bucket
     * @param bucketId
     */
    public async getAllTasksForBucket(bucketId: string) {
        const graphUrl = `planner/buckets/${bucketId}/tasks`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getAllTasksForBucket"
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }

        const result: any = await response.json();
        const tasks: PlannerTask[] = [];
        for (let task of result.value) {
            let assignments = Object.keys(task.assignments);
            tasks.push({
                id: task.id,
                bucketId: task.bucketId,
                planId: task.planId,
                title: task.title,
                dueDate: task.dueDateTime,
                etag: task["@odata.etag"],
                assignee: assignments,
                status: task.percentComplete,
                orderHint: task.orderHint,
                hasDescription: task.hasDescription,
            } as PlannerTask);
        }
        return tasks;
    }

    /**
     * Returns All buckets Present in a Plan
     * @param planId
     */
    public async getAllBucketsForPlan(planId: string) {
        const graphUrl = `planner/plans/${planId}/buckets`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getAllBucketsForPlan"
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }

        const result: any = await response.json();
        const buckets: PlannerBucket[] = [];
        for (let bucket of result.value) {
            buckets.push({
                id: bucket.id,
                planId: bucket.planId,
                name: bucket.name,
                etag: bucket["@odata.etag"],
            } as PlannerBucket);
        }
        return buckets;
    }

    /**
     *
     * @param taskId
     */
    public async getTask(taskId: string): Promise<PlannerTask | undefined> {
        const graphUrl = `planner/tasks/${taskId}`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getTask"
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }

        const task: any = await response.json();
        let assignments = Object.keys(task.assignments);
        const data: PlannerTask = {
            id: task.id,
            bucketId: task.bucketId,
            planId: task.planId,
            title: task.title,
            dueDate: task.dueDateTime,
            etag: task["@odata.etag"],
            assignee: assignments,
            status: task.percentComplete,
            orderHint: task.orderHint,
            hasDescription: task.hasDescription,
        };

        return data;
    }

    /**
     * Returns with Details for a Particular Task such as Description and Etag to handle update of task details
     * @param taskId
     */
    public async getTaskDetails(taskId: string) {
        const graphUrl = `planner/tasks/${taskId}/details`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getTaskDetails"
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        const result: any = await response.json();
        const taskDetail: PlannerTaskDetails = {
            id: result.id, // Represents Task Id
            description: result.description, // Description or notes In a Planner
            etag: result["@odata.etag"], // unique value fo task Detail to handle update of task detail
        };
        return taskDetail;
    }

    /**
     * Returns with Details for a Particular Task such as Description and Etag to handle update of task details
     * @param taskId
     */
    public async updateTaskDetails(
        taskdetail: PlannerTaskDetails
    ): Promise<PlannerTaskDetails | Response | undefined> {
        if (!taskdetail) return undefined;
        const graphUrl = `planner/tasks/${taskdetail.id}/details`;

        const data = {
            description: taskdetail.description,
        };
        const requestInit = {
            method: "PATCH",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
                "If-Match": taskdetail.etag,
            },
        } as RequestInit;

        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getTaskDetails",
            this.logger,
            requestInit
        );
        if (response.status === 412 || response.status === 409) {
            const taskDetailresponse:
                | PlannerTaskDetails
                | undefined = await this.getTaskDetails(taskdetail.id);
            if (!taskDetailresponse) return response;
            taskdetail.etag = taskDetailresponse.etag;
            await this.updateTaskDetails(taskdetail);
        }
        if (response.ok) {
            return taskdetail;
        }
        return response;
    }

    /**
     * Gives Plan information
     * @param planId
     */
    public async getPlan(planId: string): Promise<PlannerPlan | undefined> {
        const graphUrl = `/planner/plans/${planId}?select=id,owner,title`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getPlan"
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        const result: any = await response.json();
        let plan: PlannerPlan = {
            id: result.id,
            title: result.title,
            etag: result["@odata.etag"],
            owner: result.owner,
        };
        return plan;
    }

    public async getPlanDetails(
        planId: string
    ): Promise<PlannerPlanDetails | undefined> {
        const graphUrl = `/planner/plans/${planId}/details`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "getPlan"
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }

        const result: any = await response.json();
        const planDetails: PlannerPlanDetails = {
            id: result.id,
            sharedWith: Object.keys(result.sharedWith),
            etag: result["@odata.etag"],
        };
        return planDetails;
    }

    /**
     * Gives plannerBucketTaskBoardTaskFormat - order of task in a bucket
     * @param taskId
     */
    public async getBucketTaskBoardFormat(
        taskId: string
    ): Promise<PlannerTaskFormat | undefined> {
        const graphUrl = `/planner/tasks/${taskId}/bucketTaskBoardFormat`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "GetBucketTaskBoardFormat"
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        const result: any = await response.json();
        let taskBoardTaskFormat: PlannerTaskFormat = {
            id: result.id,
            orderHint: result.orderHint,
            etag: result["@odata.etag"],
        };
        return taskBoardTaskFormat;
    }

    /**
     * Update order of task for a bucket in a Planner
     * @param taskId
     * @param orderHint
     */
    public async updateBucketTaskBoardFormat(
        taskId: string,
        orderHint: string,
        etag: string
    ) {
        const graphUrl = `/planner/tasks/${taskId}/bucketTaskBoardFormat`;
        const data = {
            orderHint,
        };
        const requestInit = {
            method: "PATCH",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json", "If-Match": etag },
        } as RequestInit;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "UpdateBucketTaskBoardFormat",
            this.logger,
            requestInit
        );
        return response;
    }

    /**
     *Create Bucket for a plan
     * @param bucket
     */
    public async createBucketForPlan(
        bucket: PlannerBucket
    ): Promise<any | undefined> {
        const graphUrl = `planner/buckets`;
        const data = {
            name: bucket.name,
            planId: bucket.planId,
        };
        const requestInit = {
            method: "Post",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        } as RequestInit;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "createBucketForPlan",
            this.logger,
            requestInit
        );
        if (!response || (response.status !== 201 && response.status !== 404)) {
            return undefined;
        }
        return response;
    }

    /**
     *Create Task in Bucket
     * @param task
     */
    public async createTaskInBucket(task: PlannerTask): Promise<Response> {
        const graphUrl = `planner/tasks`;
        if (task.title === undefined || task.title === "") {
            task.title = "untitled";
        }
        const assignee = Array.isArray(task.assignee)
            ? task.assignee.reduce((map, obj) => {
                map[obj] = {
                    "@odata.type": "#microsoft.graph.plannerAssignment",
                    orderHint: task.orderHint ? task.orderHint : " !",
                };
                return map;
            }, {})
            : {};
        const data = {
            planId: task.planId,
            title: task.title,
            bucketId: task.bucketId,
            assignments: assignee,
            orderHint: task.orderHint ? task.orderHint : " !",
        };
        const requestInit = {
            method: "Post",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        } as RequestInit;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "createBucketForPlan",
            this.logger,
            requestInit
        );
        return response;
    }

    /**
     * Update Task information in a Planner
     * @param task
     */
    public async updateTask(
        task: PlannerTask,
        removeAssignee?: Array<string>
    ): Promise<Response> {
        const taskId = task.id;
        const graphUrl = `planner/tasks/${taskId}`;
        let assignee = Array.isArray(task.assignee)
            ? task.assignee.reduce((map, obj) => {
                map[obj] = {
                    "@odata.type": "#microsoft.graph.plannerAssignment",
                    orderHint: task.orderHint ? task.orderHint : " !",
                };
                return map;
            }, {})
            : {};
        if (removeAssignee && removeAssignee.length > 0) {
            const removeAssigneeMap = removeAssignee
                ? removeAssignee.reduce((map: any, obj) => {
                    map[obj] = null;
                    return map;
                }, {})
                : {};
            assignee = { ...assignee, ...removeAssigneeMap };
        }

        if ("dueDate" in task && task.dueDate === undefined) {
            task.dueDate = null;
        }
        const data = {
            title: task.title,
            assignments: assignee,
            dueDateTime: task.dueDate,
            percentComplete: task.status,
        };
        const requestInit = {
            method: "PATCH",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
                "If-Match": task.etag,
            },
        } as RequestInit;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "createBucketForPlan",
            this.logger,
            requestInit
        );

        return response;
    }

    /**
     * Update information for a bucket in a Planner
     * @param bucketId
     * @param name
     */
    public async updateBucket(bucketId: string, name: string, etag: string) {
        const graphUrl = `planner/buckets/${bucketId}`;
        const data = {
            name,
        };
        const requestInit = {
            method: "PATCH",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json", "If-Match": etag },
        } as RequestInit;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "updateBucket",
            this.logger,
            requestInit
        );
        return response;
    }

    /**
     * To be called when we have to Share a Plan with a Particular User
     * To retrieve the Delta for Plan, we need to share the Plan with Current User
     * @param planID
     * @param userIdAllowed - List of UserIds Which want to give Access
     * @param etag
     */
    public async updatePlanSharingDetails(
        planID: string,
        userIdAllowed: Array<string>,
        etag: string
    ) {
        const graphUrl = `planner/plans/${planID}/details`;
        let sharedIds: any = {};
        userIdAllowed.map((userId) => {
            sharedIds[userId] = true;
        });
        const data = {
            sharedWith: sharedIds,
        };

        const retryPolicy = {
            maxRetries: 4,
            backoffFn: constantBackoff(3000),
            filter: whitelist([403, 500, 503]),
        };

        const requestInit = {
            method: "PATCH",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json", "If-Match": etag },
        } as RequestInit;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "updateBucket",
            this.logger,
            requestInit,
            retryPolicy
        );
        return response;
    }

    /**
     * Delete Task in a Planner
     * @param task
     */
    public async deletetask(task: PlannerTask) {
        const graphUrl = `planner/tasks/${task.id}`;
        const requestInit = {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "If-Match": task.etag,
            },
        } as RequestInit;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "deletetask",
            this.logger,
            requestInit
        );
        if (!response) {
            return undefined;
        }
        return response;
    }

    /**
     * Delete Bucket in Planner
     * @param bucketId
     * @param etag
     */
    public async deleteBucket(bucketId: string, etag: string) {
        const graphUrl = `/planner/buckets/${bucketId}`;
        const requestInit = {
            method: "DELETE",
            headers: { "Content-Type": "application/json", "If-Match": etag },
        } as RequestInit;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "deletetask",
            this.logger,
            requestInit
        );
        if (!response) {
            return undefined;
        }
        return response;
    }

    /**
     * this function is used to subscribe to delta APIs,
     * Delta API used to trace all changes related to User for Planner
     */
    public async subscribeToDelta() {
        const graphUrl = `https://graph.microsoft.com/beta/me/planner/all/delta`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "subscribeToDelta",
            this.logger
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }

        let result: any = await response.json();
        let nextlink =
            "@odata.nextLink" in result ? result["@odata.nextLink"] : undefined;
        const linkResponse = await graphFetch(
            this.tokenProvider,
            nextlink,
            "subscribeToDelta",
            this.logger
        );
        if (!this.isReponseValid(linkResponse)) {
            return undefined;
        }
        let linkResult: any = await linkResponse.json();
        return "@odata.deltaLink" in linkResult
            ? linkResult["@odata.deltaLink"]
            : undefined;
        // result = result.filter((val: any) => { if (val.hasOwnProperty("planId")) { return val } })
    }

    /**
     * This gives all changes in Planner related to a Particular User
     * @param deltaLink
     */
    public async getPlanDelta(deltaLink: string) {
        const response = await graphFetch(
            this.tokenProvider,
            deltaLink,
            "getPlanDelta",
            this.logger
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }

        let result: any = await response.json();
        return result;
    }

    /**
     * Returns bucket Present in a Plan
     * @param bucketId
     */
    public async getBucket(bucketId: string) {
        const graphUrl = `planner/buckets/${bucketId}`;
        const response = await graphFetch(
            this.tokenProvider,
            graphUrl,
            "GetBucket"
        );
        if (!this.isReponseValid(response)) {
            return undefined;
        }
        const result: any = await response.json();
        let bucket: PlannerBucket = {
            id: result.id,
            etag: result["@odata.etag"],
            name: result["name"],
            planId: result["planId"],
        };
        return bucket;
    }

    private isReponseValid(response: Response) {
        if (!response || response.status !== 200) {
            return false;
        }
        return true;
    }
}
