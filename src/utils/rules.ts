/**
 * Pure calculations and business rules
 * نظام إدارة العهد والمخازن - الإصدار 6.7
 */

/**
 * Convert user decimal quantity to internal milli-units (e.g. 5.25 -> 5250)
 */
export function toMilli(qty: number): number {
  if (isNaN(qty)) return 0;
  return Math.round(Number(qty) * 1000);
}

/**
 * Convert internal milli-units to decimal units (e.g. 5250 -> 5.25)
 */
export function fromMilli(milli: number): number {
  if (isNaN(milli)) return 0;
  return Number((milli / 1000).toFixed(3));
}

/**
 * Format quantity with up to 3 decimal places (stripping trailing zeros)
 */
export function formatQuantity(milli: number): string {
  const val = fromMilli(milli);
  return Number(val.toFixed(3)).toString();
}

/**
 * Check if a password meets enterprise complexity rules:
 * - At least 8 characters
 * - Uppercase letter
 * - Lowercase letter
 * - Digit
 * - Special character
 */
export function validatePasswordStrength(pwd: string): { valid: boolean; message?: string } {
  if (!pwd || pwd.length < 8) {
    return { valid: false, message: 'كلمة المرور يجب ألا تقل عن 8 خانات' };
  }
  if (!/[A-Z]/.test(pwd)) {
    return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حرف كبير على الأقل (A-Z)' };
  }
  if (!/[a-z]/.test(pwd)) {
    return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حرف صغير على الأقل (a-z)' };
  }
  if (!/[0-9]/.test(pwd)) {
    return { valid: false, message: 'كلمة المرور يجب أن تحتوي على رقم على الأقل (0-9)' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) {
    return { valid: false, message: 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%...)' };
  }
  return { valid: true };
}

/**
 * Calculate available quantity from total quantity and reserved quantity
 */
export function calculateAvailableQuantity(quantityMilli: number, reservedMilli: number): number {
  const freeMilli = Math.max(0, quantityMilli - reservedMilli);
  return fromMilli(freeMilli);
}

/**
 * Delegation Path Evaluation
 * Evaluates whether an issue movement qualifies for immediate delegation or requires approval
 */
export interface DelegationCheckInput {
  isDelegatedItem: boolean;
  requestedQtyMilli: number;
  maxQtyPerOpMilli: number;
  dailyLimitMilli: number;
  todayConsumedMilli: number;
}

export interface DelegationCheckResult {
  isDelegated: boolean;
  badge: 'green' | 'amber';
  badgeText: string;
  remainingTodayMilli: number;
  reason?: string;
}

export function evaluateDelegationRule(input: DelegationCheckInput): DelegationCheckResult {
  const { isDelegatedItem, requestedQtyMilli, maxQtyPerOpMilli, dailyLimitMilli, todayConsumedMilli } = input;

  if (!isDelegatedItem) {
    return {
      isDelegated: false,
      badge: 'amber',
      badgeText: 'سيتطلب موافقة رئيس القسم وحجز الرصيد (السبب: صنف غير مفوض)',
      remainingTodayMilli: 0,
      reason: 'صنف غير مفوض في هذا المخزن',
    };
  }

  const remainingDailyMilli = Math.max(0, dailyLimitMilli - todayConsumedMilli);

  if (requestedQtyMilli > maxQtyPerOpMilli) {
    return {
      isDelegated: false,
      badge: 'amber',
      badgeText: `سيتطلب موافقة رئيس القسم وحجز الرصيد (السبب: تجاوز الحد الأقصى للعملية: ${fromMilli(maxQtyPerOpMilli)})`,
      remainingTodayMilli: remainingDailyMilli,
      reason: 'تجاوز حد العملية الواحدة',
    };
  }

  if (requestedQtyMilli > remainingDailyMilli) {
    return {
      isDelegated: false,
      badge: 'amber',
      badgeText: `سيتطلب موافقة رئيس القسم وحجز الرصيد (السبب: تجاوز السقف اليومي المتبقي: ${fromMilli(remainingDailyMilli)})`,
      remainingTodayMilli: remainingDailyMilli,
      reason: 'تجاوز السقف اليومي المتبقي',
    };
  }

  const newRemaining = remainingDailyMilli - requestedQtyMilli;
  return {
    isDelegated: true,
    badge: 'green',
    badgeText: `خصم مفوض فورياً (المتبقي من سقف اليوم بعد الخصم: ${formatQuantity(newRemaining)} وحدة)`,
    remainingTodayMilli: newRemaining,
  };
}

/**
 * Generate Unified Transaction Number TRX-[FY]-[000001]
 * Fiscal year starts on July 1st.
 */
export function getFiscalYear(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: 6 is July
  return month >= 6 ? year : year - 1;
}

export function formatTrxNumber(seq: number, date: Date = new Date()): string {
  const fy = getFiscalYear(date);
  const padded = String(seq).padStart(6, '0');
  return `TRX-${fy}-${padded}`;
}

/**
 * Generate random temporary password
 */
export function generateTemporaryPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';

  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += symbols[Math.floor(Math.random() * symbols.length)];

  const allChars = upper + lower + digits + symbols;
  for (let i = 0; i < 6; i++) {
    pwd += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle
  return pwd.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Generate Sequential Item Code [PREFIX]-0001
 */
export function generateItemCode(prefix: string, sequence: number): string {
  const cleanPrefix = (prefix || 'ITEM').toUpperCase().trim();
  const padded = String(Math.max(1, sequence)).padStart(4, '0');
  return `${cleanPrefix}-${padded}`;
}

/**
 * Validate Foundational Import Single Row
 */
export function validateImportRowData(row: {
  itemName?: string;
  categoryName?: string;
  unitName?: string;
  initialQty?: any;
}): { valid: boolean; error?: string } {
  if (!row.itemName || !row.itemName.trim()) {
    return { valid: false, error: 'اسم الصنف فارغ' };
  }
  if (!row.categoryName || !row.categoryName.trim()) {
    return { valid: false, error: 'التصنيف فارغ' };
  }
  if (!row.unitName || !row.unitName.trim()) {
    return { valid: false, error: 'وحدة القياس فارغة' };
  }
  const qty = Number(row.initialQty);
  if (isNaN(qty) || qty < 0) {
    return { valid: false, error: 'الكمية الافتتاحية يجب أن تكون رقماً موجباً أو صفراً' };
  }
  return { valid: true };
}

// =================== MULTI-TENANT ISOLATION & ROLE RULES ===================

/**
 * Rule 1: Multi-tenant warehouse isolation
 * Validates that warehouses belonging to one company do not mix with warehouses of another company.
 */
export function validateCompanyWarehouseIsolation(
  warehouseCompanyId: number | null | undefined,
  targetCompanyId: number | null | undefined
): { allowed: boolean; reason?: string } {
  // If targetCompanyId is defined and warehouse belongs to a different company -> strictly forbid
  if (targetCompanyId && warehouseCompanyId && Number(warehouseCompanyId) !== Number(targetCompanyId)) {
    return {
      allowed: false,
      reason: 'محظور: لا يمكن استخدام مخازن تابعة لشركة أخرى في عمليات هذه الشركة.',
    };
  }
  return { allowed: true };
}

/**
 * Rule 2: Custody item isolation
 * Validates that an item is assigned/linked strictly to the specified custody.
 * Items belonging to Custody A must never mix or appear in Custody B.
 */
export function validateCustodyItemIsolation(
  itemId: number,
  allowedCustodyItemIds: number[]
): { allowed: boolean; reason?: string } {
  if (!allowedCustodyItemIds.includes(itemId)) {
    return {
      allowed: false,
      reason: 'محظور: هذا الصنف غير مسجل في هذه العهدة. أصناف كل عهدة معزولة تماماً ولا تظهر أو تستخدم في عهدة أخرى.',
    };
  }
  return { allowed: true };
}

/**
 * Rule 3: Admin role operational movements restriction
 * Admin cannot execute stock movements (addition, issue, transfer, disposal).
 * Operational movements are restricted to storekeepers and supervisors.
 */
export function canUserPerformMovements(role: string | null | undefined): boolean {
  if (!role || role === 'admin') return false;
  return role === 'storekeeper' || role === 'supervisor';
}

/**
 * Rule 4: Admin role movements log / ledger viewing restriction
 * Admin cannot view the operations log or movement ledger.
 */
export function canUserViewMovementsLedger(role: string | null | undefined): boolean {
  if (!role || role === 'admin') return false;
  return role === 'storekeeper' || role === 'supervisor';
}

/**
 * Rule 5: Admin role approval restriction
 * Admin does NOT receive or approve pending movement requests.
 * Approvals are solely handled by supervisors (department heads).
 */
export function canUserApproveMovements(role: string | null | undefined): boolean {
  return role === 'supervisor';
}

/**
 * Filter warehouses by company ID for strict multi-tenant separation.
 */
export function filterWarehousesByCompany<T extends { company_id?: number | null; companyId?: number | null }>(
  warehouses: T[],
  companyId: number | null | undefined
): T[] {
  if (!companyId) return warehouses;
  return warehouses.filter((w) => {
    const cId = w.company_id ?? w.companyId;
    return cId === null || cId === undefined || Number(cId) === Number(companyId);
  });
}

/**
 * Filter users by company ID so users of one company cannot view accounts of another.
 */
export function filterUsersByCompany<T extends { company_id?: number | null; companyId?: number | null }>(
  usersList: T[],
  userRole: string,
  userCompanyId: number | null | undefined
): T[] {
  // If user is admin without specific company filter, return all (or specific)
  if (userRole === 'admin' && !userCompanyId) return usersList;
  if (!userCompanyId) return usersList;
  return usersList.filter((u) => {
    const cId = u.company_id ?? u.companyId;
    return cId === null || cId === undefined || Number(cId) === Number(userCompanyId);
  });
}

