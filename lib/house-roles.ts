/** Ruoli membro casa: OWNER = proprietario; SUPERVISOR = gestione membri (supervisionatore); MEMBER = standard. */
export const HouseRole = {
  OWNER: "OWNER",
  SUPERVISOR: "SUPERVISOR",
  MEMBER: "MEMBER",
} as const;

export type HouseRoleValue = (typeof HouseRole)[keyof typeof HouseRole];

export function isOwnerRole(role: string): boolean {
  return role === HouseRole.OWNER;
}

export function canManageHouseMembers(role: string): boolean {
  return role === HouseRole.OWNER || role === HouseRole.SUPERVISOR;
}

/** Solo il proprietario rigenera il feed ICS. */
export function canRotateCalendarFeed(role: string): boolean {
  return role === HouseRole.OWNER;
}

export function canPromoteSupervisor(actorRole: string): boolean {
  return actorRole === HouseRole.OWNER;
}

/** Il supervisionatore può rimuovere solo membri «base», non OWNER né altri SUPERVISOR. */
export function canRemoveMember(actorRole: string, targetRole: string): boolean {
  if (actorRole === HouseRole.OWNER) {
    return true;
  }
  if (actorRole === HouseRole.SUPERVISOR) {
    return targetRole === HouseRole.MEMBER;
  }
  return false;
}

export function roleLabelKey(role: string): "case.roleOwner" | "case.roleSupervisor" | "case.roleMember" {
  if (role === HouseRole.OWNER) return "case.roleOwner";
  if (role === HouseRole.SUPERVISOR) return "case.roleSupervisor";
  return "case.roleMember";
}
