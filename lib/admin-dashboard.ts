import type { WorkOrder, WorkOrderStatus } from "@/lib/work-orders";

export type AdminDashboardMetric = {
  id: "new-submissions" | "waiting-review" | "qualified-leads" | "in-production" | "overdue-follow-ups";
  label: string;
  value: number;
  note: string;
  available: boolean;
};

export type AdminDashboardFollowUp = {
  order: WorkOrder;
  dueAt: string;
  overdue: boolean;
};

export type AdminDashboardPipeline = {
  id: string;
  label: string;
  statuses: WorkOrderStatus[];
  orders: WorkOrder[];
};

export type AdminDashboardSnapshot = {
  metrics: AdminDashboardMetric[];
  inbox: WorkOrder[];
  followUps: AdminDashboardFollowUp[];
  pipeline: AdminDashboardPipeline[];
};

function timestamp(value?: string) {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

export function latestScheduledFollowUp(order: WorkOrder) {
  const latestContact = [...order.contactHistory].sort(
    (left, right) => timestamp(right.contactedAt) - timestamp(left.contactedAt)
  )[0];

  return latestContact?.nextFollowUpAt || order.nextFollowUpAt;
}

function endOfLocalDay(value: Date) {
  const end = new Date(value);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

export function createAdminDashboardSnapshot(
  orders: WorkOrder[],
  now = new Date()
): AdminDashboardSnapshot {
  const nowTime = now.getTime();
  const todayEndsAt = endOfLocalDay(now);
  const newestFirst = [...orders].sort(
    (left, right) => timestamp(right.submittedAt) - timestamp(left.submittedAt)
  );
  const waitingForReview = orders.filter((order) => order.needsReply);
  const followUps = orders
    .map((order) => {
      const dueAt = latestScheduledFollowUp(order);
      return dueAt
        ? { order, dueAt, overdue: timestamp(dueAt) < nowTime }
        : null;
    })
    .filter((item): item is AdminDashboardFollowUp => Boolean(item))
    .filter((item) => timestamp(item.dueAt) <= todayEndsAt)
    .sort((left, right) => timestamp(left.dueAt) - timestamp(right.dueAt));

  const pipelineDefinitions: Array<Omit<AdminDashboardPipeline, "orders">> = [
    {
      id: "review",
      label: "Review",
      statuses: ["Needs Reply", "New", "Reviewing"]
    },
    {
      id: "quote-sample",
      label: "Quote & Sample",
      statuses: ["Quoted", "Sample", "Factory Introduced"]
    },
    {
      id: "production",
      label: "In Production",
      statuses: ["Managed", "Production", "Shipping"]
    },
    {
      id: "completed",
      label: "Completed",
      statuses: ["Completed"]
    }
  ];

  return {
    metrics: [
      {
        id: "new-submissions",
        label: "New Submissions",
        value: orders.filter((order) => order.status === "New" || order.status === "Needs Reply").length,
        note: "New and unanswered requests",
        available: true
      },
      {
        id: "waiting-review",
        label: "Waiting for Review",
        value: waitingForReview.length,
        note: "Items that need a TYORA response",
        available: true
      },
      {
        id: "qualified-leads",
        label: "Qualified Leads",
        value: 0,
        note: "Qualification is not tracked yet",
        available: false
      },
      {
        id: "in-production",
        label: "In Production",
        value: orders.filter((order) => order.status === "Production").length,
        note: "Projects currently in production",
        available: true
      },
      {
        id: "overdue-follow-ups",
        label: "Overdue Follow-ups",
        value: followUps.filter((item) => item.overdue).length,
        note: "Past-due scheduled follow-ups",
        available: true
      }
    ],
    inbox: newestFirst.slice(0, 6),
    followUps: followUps.slice(0, 6),
    pipeline: pipelineDefinitions.map((column) => ({
      ...column,
      orders: newestFirst.filter((order) => column.statuses.includes(order.status)).slice(0, 4)
    }))
  };
}
