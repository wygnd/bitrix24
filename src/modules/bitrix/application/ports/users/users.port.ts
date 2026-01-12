import {
  B24MinWorkflowUserOptions,
  B24User,
  B24UserListParams,
} from '@/modules/bitrix/application/interfaces/users/user.interface';

export interface BitrixUsersPort {
  getUserById(userId: string): Promise<B24User | null>;
  getUsers(params: B24UserListParams): Promise<B24User[]>;
  getMinWorkflowUser(users: string[]): Promise<string | null>;
  getMinWorkflowUsers(users: string[]): Promise<B24MinWorkflowUserOptions[]>;
}
