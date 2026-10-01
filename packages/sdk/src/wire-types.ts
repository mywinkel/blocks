// Public wire types extracted from the host contract. No database or server code.
export type CustomerAccount = {
  customer: { id: string; name: string; email: string };
  history: {
    quote?: { description: string; validUntil: string } | undefined;
    booking?:
      | {
          serviceId: string;
          resourceId: string;
          calendarStatus: string;
          calendarError: string;
          refundStatus: string;
          cancel: boolean;
          reschedule: boolean;
          noticeHours: number;
        }
      | undefined;
    id: string;
    type:
      | "enquiries"
      | "audiences"
      | "order-lines"
      | "appointment-stages"
      | "job-parts"
      | "visits"
      | "products"
      | "services"
      | "categories"
      | "collections"
      | "options"
      | "price-lists"
      | "promotions"
      | "customers"
      | "orders"
      | "appointments"
      | "jobs"
      | "rentals"
      | "classes"
      | "enrolments"
      | "memberships"
      | "engagements"
      | "time-entries"
      | "food-orders"
      | "menus"
      | "batches"
      | "quotes"
      | "invoices"
      | "payments"
      | "payouts"
      | "campaigns"
      | "automations"
      | "loyalty"
      | "rewards"
      | "pages"
      | "content-types"
      | "content-records"
      | "navigation"
      | "media"
      | "messages"
      | "resources"
      | "stock"
      | "transfers"
      | "invitations"
      | "roles"
      | "suppliers"
      | "supplier-requests";
    name: string;
    status: string;
    createdAt: string;
    version: number;
    amountMinor: number;
    start: string;
    end: string;
    payment: string;
    hasReceipt: boolean;
  }[];
  memberships: {
    id: string;
    name: string;
    status: string;
    credits: number;
    kind: string;
    used: number;
    expires: string;
  }[];
  nextHistoryCursor: string | null;
  nextMembershipCursor: string | null;
  revision: number;
};
export type MembershipPaymentStatus = {
  mandate: {
    id: string;
    status: "pending" | "active" | "revoked" | "review";
    amountMinor: number;
    interval: string;
    brand: string | null;
    lastFour: string | null;
    dueAt: number;
  } | null;
  collection: {
    status: "pending" | "submitting" | "review" | "paid";
    amountMinor: number;
    start: string;
    end: string;
    submittedAt: number | null;
  } | null;
};
export type CustomerCommand = {
  operationId: string;
  recordId: string;
  expectedVersion: number;
  action: "cancel" | "reschedule";
  reason: string;
  start?: string | undefined;
};
export type CustomerCommandResult = {
  operationId: string;
  recordId: string;
  revision: number;
  status: string;
  calendarStatus: string;
  invalidates: string[];
};
export type AvailabilityInput = {
  serviceId: string;
  resourceId: string;
  date: string;
};
export type AppointmentAvailability = {
  date: string;
  timezone: "Africa/Johannesburg";
  slots: { start: string; end: string }[];
  confirmationRequired: boolean;
};
export type AccountQuery = {
  recordId?: string | undefined;
  historyCursor?: string | undefined;
  membershipCursor?: string | undefined;
};
export type BalancePayment = {
  operationId: string;
  expectedVersion: number;
  expectedAmountMinor: number;
};
export type BalanceOffer = { amountMinor: number; version: number };
