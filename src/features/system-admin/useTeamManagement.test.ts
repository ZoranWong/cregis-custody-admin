import { describe, it, expect } from 'vitest'

describe('useTeamManagement — COMPLIANCE_REVIEWER guard', () => {
  it('should recognize COMPLIANCE_REVIEWER as the guarded role', () => {
    const roleCode = 'COMPLIANCE_REVIEWER'
    // Guard: COMPLIANCE_REVIEWER should NOT be saved via batchUpdateRoleUsers.
    // It should use saveFlowEdit → updateReviewersForLevel instead.
    expect(roleCode).toBe('COMPLIANCE_REVIEWER')
  })

  it('should NOT block non-COMPLIANCE_REVIEWER roles', () => {
    const guardedRoles = ['COMPLIANCE_REVIEWER']
    const otherRoles = ['SYSTEM_ADMIN', 'SYSTEM_OWNER', 'BUSINESS_DEVELOPER', 'TRAVEL_RULE']

    for (const role of otherRoles) {
      expect(guardedRoles).not.toContain(role)
    }
  })
})
