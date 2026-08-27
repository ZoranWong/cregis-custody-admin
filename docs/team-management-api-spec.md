# 团队管理 API 对接方案

基于 `docs/custody-admin.openapi.yaml` 文档，提供完整的团队管理功能 API 对接方案。

---

## 一、现有 API 清单（文档已定义）

### 1.1 员工管理

| 功能 | 方法 | 端点 | 请求体 | 响应 |
| --- | --- | --- | --- | --- |
| 分页查询员工 | POST | `/system/staff/page` | `QueryParamSystemUser` | `MessageResult` |
| 查询员工列表 | GET | `/system/staff/list` | - | `MessageResult` |
| 添加员工 | POST | `/system/staff/add` | `AddSystemStaffRequest` | `MessageResult` |
| 按邮箱授予角色 | POST | `/system/staff/role/grant/{email}` | `{ roleCode }` | `MessageResult` |
| 重置密码(管理员) | POST | `/system/staff/set/password` | `AdminStaffPasswordResetRequest` | `MessageResult` |
| 用户自己重置密码 | POST | `/system/staff/update/password` | `ResetPasswordDto` | `MessageResult` |
| 重发激活链接 | POST | `/system/staff/{userId}/activation/reissue` | `{}` | `MessageResult` |
| 禁用员工 | POST | `/system/staff/{userId}/disable` | `{}` | `MessageResult` |
| 启用员工 | POST | `/system/staff/{userId}/enable` | `{}` | `MessageResult` |
| 删除员工 | POST | `/system/staff/delete/{userId}` | `{}` | `MessageResult` |
| 启用 2FA | POST | `/system/staff/{id}/2fa/enable` | `{}` | `MessageResult` |
| 禁用 2FA | POST | `/system/staff/{id}/2fa/disable` | `{}` | `MessageResult` |
| 强制登出 | POST | `/system/staff/{id}/force-logout` | `{}` | `MessageResult` |

### 1.2 角色管理

| 功能 | 方法 | 端点 | 请求体 | 响应 |
| --- | --- | --- | --- | --- |
| 角色分页查询 | POST | `/system/role/page` | `QueryParamSystemRole` | `MessageResult` |
| 角色列表 | POST | `/system/role/list` | `{}` | `MessageResult` |
| 创建角色 | POST | `/system/role` | `SystemRole` | `MessageResult` |
| 更新角色 | PUT | `/system/role/{id}` | `SystemRole` | `MessageResult` |
| 删除角色 | DELETE | `/system/role/{id}` | - | `MessageResult` |
| 查询角色权限 | GET | `/system/role/{id}/permissions` | - | `MessageResult` |
| 设置角色权限 | POST | `/system/role/{id}/permissions` | `RolePermissionUpdateRequest` | `MessageResult` |

### 1.3 权限变更管理

| 功能 | 方法 | 端点 | 请求体 | 响应 |
| --- | --- | --- | --- | --- |
| 权限变更分页 | POST | `/system/permission-change/page` | `QueryParamSystemPermissionChange` | `MessageResult` |
| 申请权限变更 | POST | `/system/permission-change/apply` | `PermissionChangeApplyRequest` | `MessageResult` |
| 批准权限变更 | POST | `/system/permission-change/{id}/approve` | `PermissionChangeReviewRequest` | `MessageResult` |
| 拒绝权限变更 | POST | `/system/permission-change/{id}/reject` | `PermissionChangeReviewRequest` | `MessageResult` |

---

## 二、Schema 定义（文档已定义）

### 2.1 AddSystemStaffRequest

```typescript
interface AddSystemStaffRequest {
  username?: string // 用户名（不传则使用邮箱前缀）
  displayName?: string // 显示名称
  email: string // 邮箱（必填）
  roleCode?: string // 角色编码
  initialRoleCode?: string // 初始角色编码（不传默认 SYSTEM_STAFF）
  authorizedDomainIds?: string[] // 初始授权页面域
  defaultEntryId?: string // 默认进入位
}
```

### 2.2 AdminStaffPasswordResetRequest

```typescript
interface AdminStaffPasswordResetRequest {
  userId: number // 员工账号 ID
  temporaryPassword: string // 临时密码
}
```

### 2.3 ResetPasswordDto

```typescript
interface ResetPasswordDto {
  password: string // 新密码
  oldPassword: string // 旧密码
  code: string // 邮箱验证码
}
```

### 2.4 SystemRole

```typescript
interface SystemRole {
  id?: number // 主键ID
  roleCode?: string // 角色编码
  roleName?: string // 角色名称
  roleType?: string // 角色类型
  status?: string // 状态
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
}
```

### 2.5 RolePermissionUpdateRequest

```typescript
interface RolePermissionUpdateRequest {
  permissionCodes: string[] // 权限编码列表
}
```

### 2.6 PermissionChangeApplyRequest

```typescript
interface PermissionChangeApplyRequest {
  changeType: string // 变更类型: ROLE_PERMISSIONS / USER_ROLE
  roleId?: number // 角色ID（changeType=ROLE_PERMISSIONS 时必填）
  permissionCodes?: string[] // 权限编码列表（changeType=ROLE_PERMISSIONS 时必填）
  userEmail?: string // 用户邮箱（changeType=USER_ROLE 时必填）
  roleCode?: string // 目标角色编码（changeType=USER_ROLE 时必填）
  authorizedDomainIds?: string[] // 授权页面域（可选）
  defaultEntryId?: string // 默认进入位（可选）
  applyReason?: string // 申请原因
}
```

### 2.7 PermissionChangeReviewRequest

```typescript
interface PermissionChangeReviewRequest {
  reviewReason?: string // 审核备注
}
```

### 2.8 员工分页响应字段（推断自前端代码）

```typescript
interface StaffPageResponse {
  records: StaffRecord[]
  current: number // 当前页码
  size: number // 每页大小
  total: number // 总数
  pages: number // 总页数
}

interface StaffRecord {
  account_id: string // 账号ID
  id?: string // 备选ID
  display_name?: string // 显示名称
  name?: string // 备选名称
  username?: string // 用户名
  email: string // 邮箱
  activation_status: string // 激活状态: activated / pending_activation / expired_activation
  account_status: string // 账户状态: enabled / disabled
  initial_role?: string // 初始角色
  role_code?: string // 角色编码
  role?: string // 备选角色
  authorized_domain_ids?: string[] // 授权域
  default_entry_id?: string // 默认进入位
  last_sign_in?: string // 最后登录时间
  available_actions?: string[] // 可用操作列表
}
```

---

## 三、前端功能与 API 映射

### 3.1 Members Tab

| 功能 | 使用的 API | 说明 |
| --- | --- | --- |
| 获取所有成员 | `POST /system/staff/page` | 分页查询，前端按 `activation_status` 和 `account_status` 筛选 |
| 识别 Owner | `GET /system/staff/list` + 客户端判断 | 目前无专门 API，可通过角色 `OWNER` 或特殊标记识别 |
| 暂停成员 | `POST /system/staff/{userId}/disable` | 将 `account_status` 设为 `disabled` |
| 恢复成员 | `POST /system/staff/{userId}/enable` | 将 `account_status` 设为 `enabled` |
| 邀请成员 | `POST /system/staff/add` | 发送邀请邮件 |
| 转移所有权 | ❌ **缺失 API** | 需要后端新增 `POST /system/owner/transfer` |

### 3.2 Roles Tab

| 功能 | 使用的 API | 说明 |
| --- | --- | --- |
| 获取角色列表 | `POST /system/role/list` | 获取所有角色 |
| 按角色查询员工 | `POST /system/staff/page` + 客户端过滤 | 按 `role_code` 过滤 |
| 添加成员到角色组 | `POST /system/staff/role/grant/{email}` | 按邮箱授予角色 |
| 从角色组移除成员 | `POST /system/staff/role/grant/{email}` | 授予另一个角色覆盖 |
| 查看审批流配置 | ❌ **缺失 API** | 需要后端新增 `GET /system/flows` |
| 编辑审批流 | ❌ **缺失 API** | 需要后端新增 `PUT /system/flows/{id}` |

---

## 四、缺失 API 建议（需要后端新增）

### 4.1 获取当前 Owner

```yaml
/system/owner:
  get:
    summary: 获取当前所有者
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              properties:
                userId:
                  type: string
                displayName:
                  type: string
                email:
                  type: string
```

### 4.2 转移所有权

```yaml
/system/owner/transfer:
  post:
    summary: 转移所有权
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              newOwnerUserId:
                type: string
                description: 新所有者的用户ID
            required:
              - newOwnerUserId
```

### 4.3 审批流配置 CRUD

```yaml
/system/flows:
  get:
    summary: 查询审批流配置列表
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              properties:
                items:
                  type: array
                  items:
                    $ref: '#/components/schemas/ApprovalFlow'

/system/flows/{id}:
  put:
    summary: 更新审批流配置
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApprovalFlow'
```

### 4.4 ApprovalFlow Schema

```typescript
interface ApprovalFlow {
  id: string
  severity: 'routine' | 'medium' | 'critical'
  label: string // 显示名称
  timeoutLabel: string // 超时标签（如 "Auto-Resolve" / "Escalation"）
  timeoutValue: string // 超时值（如 "4h" / "2h" / "30m"）
  steps: ApprovalStep[]
}

interface ApprovalStep {
  order: number // 步骤顺序
  userId: string // 处理人ID
  displayName: string // 处理人显示名称
  email: string // 处理人邮箱
}
```

---

## 五、对接优先级

### Phase 1（现有 API 可完成）

- [x] Members Tab：成员列表、暂停/恢复、邀请成员
- [x] Roles Tab：角色列表、查看各角色成员
- [x] 角色/成员增删改查

### Phase 2（需要新增 API）

- [ ] Owner 识别与转移
- [ ] 审批流配置查询与编辑

---

## 六、前端调用示例

### 6.1 获取成员列表并分组

```typescript
// 获取所有员工
const staffList = await fetchStaffList()

// 按角色分组
const admins = staffList.filter((s) => s.role_code === 'SYSTEM_ADMIN')
const officers = staffList.filter((s) => s.role_code === 'COMPLIANCE')
const travelRule = staffList.filter((s) => ['COMPLIANCE', 'OPERATIONS'].includes(s.role_code))
```

### 6.2 邀请新成员

```typescript
await createEmployee({
  displayName: 'John Doe',
  email: 'john.doe@cregis.com',
  initialRoleCode: 'COMPLIANCE',
  authorizedDomainIds: ['compliance', 'operations']
})
```

### 6.3 暂停/恢复成员

```typescript
// 暂停
await disableEmployee(userId)

// 恢复
await enableEmployee(userId)
```

### 6.4 更改成员角色

```typescript
await grantStaffRole('john.doe@cregis.com', 'SYSTEM_ADMIN')
```

---

## 七、总结

| 分类       | 现有 API | 缺失 API |
| ---------- | -------- | -------- |
| 员工管理   | 13 个 ✅ | 0        |
| 角色管理   | 7 个 ✅  | 0        |
| 权限变更   | 4 个 ✅  | 0        |
| Owner 管理 | 0        | 2 ❌     |
| 审批流配置 | 0        | 2 ❌     |

**结论：** 现有 API 覆盖约 80% 的功能需求。需要后端新增 4 个 API 来完成所有功能：

1. `GET /system/owner` - 获取所有者
2. `POST /system/owner/transfer` - 转移所有权
3. `GET /system/flows` - 查询审批流
4. `PUT /system/flows/{id}` - 更新审批流
