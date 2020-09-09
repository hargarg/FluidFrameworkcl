/**
 * Interface for Board Or Plan(Planner)
 * We are considering that Board would be made up of Multiple buckets and Each Bucket would have Multiple Tasks
 * Example: In Planner: We have a Plan(Iboard) which have buckets (Like Todo, completed , others), and each bucket have task(Like Refactoring Code)
 */
export interface Board {
  boardId: string;
  boardName?: string;
  buckets?: Array<Bucket>;
  owner?: string;
}

/**
 * Board have multiple buckets(Like Todo, completed)
 */
export interface Bucket {
  boardId: string;
  bucketId: string;
  bucketName?: string;
  tasks: Array<Task>;
  [propName: string]: any;
}

/**
 *  Task represents final Task
 *  Example: Task in planner
 */
export interface Task {
  taskName: string | undefined;
  assignee: Array<any> | undefined;
  dueDate: Date | undefined;
  status: boolean | undefined;
  id: string;
  boardId: string;
  bucketId: string;
  order?: string | undefined;
  description?: string | undefined;
  optionalProps?: any;
  [propName: string]: any;
}

/**
 *
 * This interface need to be implemented which behaves as third party Service for the SyncBridge of Tasks
 *
 *
 */
export interface TaskDataSync {
  authenticationToken?: string;

  authenticate(setLoginState: Function): void;

  /**
   * add task in the board on a particular list
   * @param task
   * @param bucketId
   */
  addTask(task: Task, bucketId: string): Promise<Task | undefined | Response>;

  /**
   *
   * @param boardId
   * @param memberId
   */
  addMemberToBoard(boardId: string, memberId: string): Promise<Response | undefined>;

  /**
   *
   * @param boardId
   */
  getMemberAndOwnersOfBoard?(boardId: string): Promise<any>;

  /**
   * update task in the board of particular list
   * @param task
   */
  updateTask(task: Task): Promise<any>;

  /**
   * delete task from a board
   * @param task
   */
  deleteTask(task: any): Promise<any>;

  /**
   * get all the tasks from the Board
   * @param boardId
   * @param bucketId
   */
  getAllTasks(boardId: string, bucketId?: string): Promise<Array<Task> | undefined>;

  /**
   *
   * @param boardId
   */
  getAllBuckets(boardId: string): Promise<Bucket>;

  /**
   *
   * @param boardId
   * @param name
   */
  createBucket(boardId: string, bucketName: string): Promise<Bucket | undefined>;

  /**
   *Rename the list of Board
   * @param listId
   * @param name
   */
  renameBucket(listId: string, bucketName: string): Promise<Response | undefined>;

  /**
   * delete a list from the Board
   * @param listId
   */
  deleteBucket(listId: string): Promise<any>;

  /**
   * Get User details based on User Id
   * @param id
   */
  getUserFromId(id: string): Promise<any>;

  /**
   * Create Board in third party or First Party
   * @param boardName
   */
  createBoard(boardName: string): Promise<Board | undefined>;

  /**
   *
   * @param boardId
   */
  getBoard(boardId: string): Promise<Board | undefined>;

  /**
   * When delta changes are available in the case of First Party this function needs to be implmented
   * @param board
   */
  getDelta?(board: Board): Promise<any | undefined>;

  /**
   * This would return the local stored copy of external service Data
   */
  getLocalStore(): Promise<any>;

  /**
   * This parameter must be set to true to enable this componnet to interact
   */
  syncEnabled: Boolean;
}
