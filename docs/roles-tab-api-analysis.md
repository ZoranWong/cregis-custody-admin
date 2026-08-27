# Roles Tab 接口需求分析

## 一、功能需求

Roles Tab 有 4 个区块，每个区块的操作需求：

| 区块                    | 读取操作                   | 写入操作         |
| ----------------------- | -------------------------- | ---------------- |
| System Administrators   | 查询 SYSTEM_ADMIN 角色成员 | 添加/移除成员    |
| Compliance Officers     | 查询 COMPLIANCE 角色成员   | 添加/移除成员    |
| Transaction Review Flow | 查询审批流配置             | 只读（暂不编辑） |
| Travel Rule Team        | 查询 Travel Rule 组成员    | 添加/移除成员    |

---

## 二、现有 API 分析

### 2.1 可用于读取的 API

| API                       | 用途         | 问题                                           |
| ------------------------- | ------------ | ---------------------------------------------- |
| `POST /system/staff/page` | 分页查询员工 | 需确认 `queryList` 是否支持按 `role_code` 过滤 |
| `POST /system/role/list`  | 查询角色列表 | ✅ 可用                                        |
| `GET /system/staff/list`  | 查询全部员工 | ✅ 可用，客户端按角色过滤                      |

### 2.2 可用于写入的 API

| API                                     | 用途     | **严重问题**                  |
| --------------------------------------- | -------- | ----------------------------- |
| `POST /system/staff/role/grant/{email}` | 授予角色 | ⚠️ **覆盖式**，只能有一个角色 |

### 2.3 关键问题

`role/grant` API 的描述是 **"按邮箱覆盖更新员工角色"**，这意味着：

- 给员工授予新角色会**替换**旧角色
- 不能实现"一个员工同时属于多个组"
- 不能用于 Roles Tab 的"添加到组"功能

---

## 三、缺失的 API

### 3.1 需要新增的 API

| 功能 | 建议端点 | 说明 |
| --- | --- | --- |
| 按角色查询员工 | `GET /system/staff/by-role?roleCode={code}` | 或确认 `/system/staff/page` 支持按角色过滤 |
| 添加角色（非覆盖） | `POST /system/staff/{userId}/roles` | 追加角色，不覆盖现有角色 |
| 移除角色 | `DELETE /system/staff/{userId}/roles/{roleCode}` | 移除特定角色 |
| 查询审批流 | `GET /system/approval-flows` | 查询审批流配置列表 |
| 更新审批流 | `PUT /system/approval-flows/{id}` | 更新审批流步骤配置 |

### 3.2 API 规格建议

#### 3.2.1 按角色查询员工

```yaml
/system/staff/by-role:
  get:
    summary: 按角色查询员工列表
    parameters:
      - name: roleCode
        in: query
        required: true
        schema:
          type: string
        description: 角色编码，如 SYSTEM_ADMIN, COMPLIANCE, OPERATIONS
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
                    $ref: '#/components/schemas/StaffBrief'

# StaffBrief Schema
StaffBrief:
  type: object
  properties:
    userId:
      type: string
    displayName:
      type: string
    email:
      type: string
    roleCode:
      type: string
    status:
      type: string
```

#### 3.2.2 添加角色（非覆盖）

```yaml
/system/staff/{userId}/roles:
  post:
    summary: 为员工添加角色（追加）
    parameters:
      - name: userId
        in: path
        required: true
        schema:
          type: string
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              roleCode:
                type: string
                description: 要添加的角色编码
            required:
              - roleCode
    responses:
      '200':
        description: 成功
```

#### 3.2.3 移除角色

```yaml
/system/staff/{userId}/roles/{roleCode}:
  delete:
    summary: 移除员工的特定角色
    parameters:
      - name: userId
        in: path
        required: true
        schema:
          type: string
      - name: roleCode
        in: path
        required: true
        schema:
          type: string
    responses:
      '200':
        description: 成功
```

#### 3.2.4 审批流配置

```yaml
/system/approval-flows:
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
                    $ref: '#/components/schemas/ApprovalFlowConfig'

/system/approval-flows/{id}:
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
            $ref: '#/components/schemas/ApprovalFlowConfig'

# ApprovalFlowConfig Schema
ApprovalFlowConfig:
  type: object
  properties:
    id:
      type: string
    severity:
      type: string
      enum: [routine, medium, critical]
    label:
      type: string
      description: 显示名称
    timeoutType:
      type: string
      enum: [auto_resolve, escalation]
      description: 超时类型
    timeoutValue:
      type: string
      description: 超时值，如 "4h", "2h", "30m"
    steps:
      type: array
      items:
        $ref: '#/components/schemas/ApprovalStep'

ApprovalStep:
  type: object
  properties:
    order:
      type: integer
      description: 步骤顺序（从1开始）
    userId:
      type: string
      description: 处理人ID
    displayName:
      type: string
      description: 处理人显示名称
    email:
      type: string
      description: 处理人邮箱
```

---

## 四、现有 API 可复用方案（无需新增）

如果后端暂时无法新增 API，可以考虑以下方案：

### 方案 A：使用 `role/grant` 的变通方式

如果业务逻辑允许"一个员工只有一个主要角色"，则：

- 使用 `POST /system/staff/role/grant/{email}` 切换角色
- 但**无法**实现一个员工同时属于多个组

### 方案 B：客户端模拟分组

使用 `GET /system/staff/list` 获取全部员工，在客户端按 `role_code` 分组：

- `SYSTEM_ADMIN` → System Administrators
- `COMPLIANCE` → Compliance Officers + Travel Rule Team
- 其他角色 → 按业务逻辑分配

但这**无法**实现"添加到组"功能，因为无法修改员工的角色。

---

## 五、最终结论

### 必须新增的 API（5个）

| #   | API                                              | 用途             | 优先级 |
| --- | ------------------------------------------------ | ---------------- | ------ |
| 1   | `GET /system/staff/by-role?roleCode={code}`      | 按角色查询员工   | P0     |
| 2   | `POST /system/staff/{userId}/roles`              | 添加角色（追加） | P0     |
| 3   | `DELETE /system/staff/{userId}/roles/{roleCode}` | 移除角色         | P0     |
| 4   | `GET /system/approval-flows`                     | 查询审批流       | P1     |
| 5   | `PUT /system/approval-flows/{id}`                | 更新审批流       | P2     |

### 现有 API 无法满足的场景

1. **一个员工同时属于多个角色组** - 现有 `role/grant` 是覆盖式
2. **从角色组移除成员但不删除员工** - 无对应 API
3. **审批流配置的读取和编辑** - 完全没有 API

---

## 六、对接顺序建议

### Phase 1：基础角色管理

1. 确认 `/system/staff/page` 是否支持按 `role_code` 过滤
2. 如不支持，实现 `GET /system/staff/by-role`
3. 实现 `POST /system/staff/{userId}/roles` 和 `DELETE /system/staff/{userId}/roles/{roleCode}`

### Phase 2：审批流配置

4. 实现 `GET /system/approval-flows`
5. 实现 `PUT /system/approval-flows/{id}`（如需要编辑功能）
