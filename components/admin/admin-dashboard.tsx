"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Factory,
  FileInput,
  Inbox,
  RefreshCcw,
  SearchCheck,
  UsersRound
} from "lucide-react";
import { createAdminDashboardSnapshot } from "@/lib/admin-dashboard";
import { workOrderDetailHref, WorkOrder, WorkOrderStatus, WorkOrderType } from "@/lib/work-orders";

const metricIcons = {
  "new-submissions": FileInput,
  "waiting-review": Clock3,
  "qualified-leads": UsersRound,
  "in-production": Factory,
  "overdue-follow-ups": AlertTriangle
};

const metricTones = {
  "new-submissions": "bg-[#eef4ff] text-[#155eef]",
  "waiting-review": "bg-[#fff6e5] text-[#b54708]",
  "qualified-leads": "bg-[#ecfdf3] text-[#027a48]",
  "in-production": "bg-[#f4f3ff] text-[#6938ef]",
  "overdue-follow-ups": "bg-[#fff1f3] text-[#c01048]"
};

const typeTone: Record<WorkOrderType, string> = {
  Idea: "bg-[#eef4ff] text-[#155eef]",
  Custom: "bg-[#eef4ff] text-[#155eef]",
  Source: "bg-[#f4f3ff] text-[#6938ef]",
  Project: "bg-[#ecfdf3] text-[#027a48]"
};

const statusTone: Record<WorkOrderStatus, string> = {
  "Needs Reply": "bg-[#fff6e5] text-[#b54708]",
  New: "bg-[#f2f4f7] text-[#475467]",
  Reviewing: "bg-[#eef4ff] text-[#155eef]",
  Quoted: "bg-[#ecfdf3] text-[#027a48]",
  Sample: "bg-[#fff6e5] text-[#b54708]",
  "Factory Introduced": "bg-[#f4f3ff] text-[#6938ef]",
  Managed: "bg-[#ecfdff] text-[#0e7090]",
  Production: "bg-[#ecfdf3] text-[#027a48]",
  Shipping: "bg-[#ecfdff] text-[#0e7090]",
  Completed: "bg-[#f2f4f7] text-[#475467]",
  Closed: "bg-[#fff1f3] text-[#c01048]"
};

function formatDate(value: string, includeTime = true) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {})
  }).format(new Date(value));
}

function OrderIdentity({ order }: { order: WorkOrder }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-[#f2f4f7] text-xs font-bold text-[#667085]">
        {order.imageUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={order.imageUrls[0]} alt="" className="size-full object-cover" />
        ) : order.type.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <Link href={workOrderDetailHref(order)} onClick={(event) => event.stopPropagation()} className="block truncate rounded-sm text-sm font-bold text-[#101828] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155eef]">{order.title}</Link>
        <p className="truncate text-xs text-[#667085]">{order.sourceId}</p>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid min-h-32 place-items-center border border-dashed border-[#d0d5dd] bg-[#fcfcfd] px-4 py-6 text-center">
      <div>
        <CheckCircle2 size={22} className="mx-auto text-[#98a2b3]" />
        <p className="mt-2 text-sm font-bold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#667085]">{body}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard({
  orders,
  loading,
  error,
  onRefresh
}: {
  orders: WorkOrder[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const snapshot = createAdminDashboardSnapshot(orders);

  function openOrder(order: WorkOrder) {
    router.push(workOrderDetailHref(order));
  }

  function handleRowKeyDown(event: React.KeyboardEvent<HTMLElement>, order: WorkOrder) {
    if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openOrder(order);
  }

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-lg border border-[#e4e7ec] bg-white">
        <div className="text-center">
          <RefreshCcw className="mx-auto animate-spin text-[#155eef]" />
          <p className="mt-3 text-sm font-semibold text-[#667085]">Loading real Preview data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#fecdca] bg-[#fffbfa] p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-[#d92d20]" />
          <div>
            <h2 className="font-bold">Dashboard data is unavailable</h2>
            <p className="mt-1 text-sm text-[#667085]">No fallback or sample records are shown.</p>
            <button type="button" onClick={onRefresh} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-[#101828] px-4 text-sm font-bold text-white">
              <RefreshCcw size={16} /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section aria-labelledby="dashboard-metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <h2 id="dashboard-metrics" className="sr-only">Dashboard metrics</h2>
        {snapshot.metrics.map((metric) => {
          const Icon = metricIcons[metric.id];
          return (
            <article key={metric.id} className="min-w-0 rounded-lg border border-[#e4e7ec] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-md ${metricTones[metric.id]}`}><Icon size={19} /></span>
                {!metric.available ? <span className="rounded-full bg-[#f2f4f7] px-2 py-1 text-[10px] font-bold text-[#667085]">Not tracked</span> : null}
              </div>
              <p className="mt-4 text-2xl font-bold tabular-nums">{metric.value}</p>
              <h3 className="mt-1 text-sm font-bold">{metric.label}</h3>
              <p className="mt-1 min-h-8 text-xs leading-4 text-[#667085]">{metric.note}</p>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-lg border border-[#e4e7ec] bg-white shadow-sm" aria-labelledby="inbox-preview-title">
        <div className="flex flex-col gap-3 border-b border-[#eaecf0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><Inbox size={18} className="text-[#155eef]" /><h2 id="inbox-preview-title" className="font-bold">Unified Inbox</h2></div>
            <p className="mt-1 text-xs text-[#667085]">Latest public Ideas, private Custom requests, Source requests, and Projects.</p>
          </div>
          <Link href="/admin/work-orders" className="inline-flex min-h-10 items-center gap-2 self-start rounded-md border border-[#d0d5dd] px-3 text-sm font-bold text-[#344054] hover:bg-[#f9fafb]">
            Open Inbox <ArrowRight size={15} />
          </Link>
        </div>
        {snapshot.inbox.length === 0 ? (
          <div className="p-4"><EmptyState title="No submissions yet" body="New requests will appear here without demo or fabricated records." /></div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-[#f9fafb] text-xs text-[#667085]">
                  <tr>{["Submission", "Type", "Customer", "Category", "Status", "Next follow-up"].map((label) => <th key={label} className="px-4 py-3 font-bold">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[#eaecf0]">
                  {snapshot.inbox.map((order) => (
                    <tr
                      key={order.id}
                      role="link"
                      tabIndex={0}
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("a,button,input,select,textarea")) return;
                        openOrder(order);
                      }}
                      onKeyDown={(event) => handleRowKeyDown(event, order)}
                      className="cursor-pointer hover:bg-[#fcfcfd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#155eef]"
                      aria-label={`Open ${order.title} submission`}
                    >
                      <td className="max-w-72 px-4 py-3"><OrderIdentity order={order} /></td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${typeTone[order.type]}`}>{order.type}</span></td>
                      <td className="max-w-48 truncate px-4 py-3 text-[#475467]">{order.customerName}</td>
                      <td className="max-w-40 truncate px-4 py-3 text-[#475467]">{order.category || "Not specified"}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${statusTone[order.status]}`}>{order.status}</span></td>
                      <td className="whitespace-nowrap px-4 py-3 text-[#475467]">{order.nextFollowUpAt ? formatDate(order.nextFollowUpAt) : "Not scheduled"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-[#eaecf0] md:hidden">
              {snapshot.inbox.map((order) => (
                <article
                  key={order.id}
                  role="link"
                  tabIndex={0}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("a,button,input,select,textarea")) return;
                    openOrder(order);
                  }}
                  onKeyDown={(event) => handleRowKeyDown(event, order)}
                  className="cursor-pointer p-4 hover:bg-[#fcfcfd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#155eef]"
                  aria-label={`Open ${order.title} submission`}
                >
                  <OrderIdentity order={order} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${typeTone[order.type]}`}>{order.type}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusTone[order.status]}`}>{order.status}</span>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs text-[#667085]">
                    <div className="flex justify-between gap-3"><dt>Customer</dt><dd className="max-w-[65%] truncate font-semibold text-[#344054]">{order.customerName}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Category</dt><dd className="max-w-[65%] truncate font-semibold text-[#344054]">{order.category || "Not specified"}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="overflow-hidden rounded-lg border border-[#e4e7ec] bg-white shadow-sm" aria-labelledby="follow-ups-title">
          <div className="border-b border-[#eaecf0] px-4 py-4">
            <div className="flex items-center gap-2"><Clock3 size={18} className="text-[#f79009]" /><h2 id="follow-ups-title" className="font-bold">Today&apos;s Follow-ups</h2></div>
            <p className="mt-1 text-xs text-[#667085]">Due today and overdue, based on recorded contact events.</p>
          </div>
          {snapshot.followUps.length === 0 ? (
            <div className="p-4"><EmptyState title="No follow-ups due" body="Scheduled follow-ups will appear here." /></div>
          ) : (
            <div className="divide-y divide-[#eaecf0]">
              {snapshot.followUps.map((item) => (
                <div key={item.order.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-md ${item.overdue ? "bg-[#fff1f3] text-[#c01048]" : "bg-[#fff6e5] text-[#b54708]"}`}><Clock3 size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.order.title}</p>
                    <p className="truncate text-xs text-[#667085]">{item.order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${item.overdue ? "text-[#c01048]" : "text-[#b54708]"}`}>{item.overdue ? "Overdue" : "Today"}</p>
                    <p className="mt-0.5 whitespace-nowrap text-[11px] text-[#667085]">{formatDate(item.dueAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-[#e4e7ec] bg-white shadow-sm" aria-labelledby="pipeline-title">
          <div className="flex items-center justify-between gap-3 border-b border-[#eaecf0] px-4 py-4">
            <div>
              <div className="flex items-center gap-2"><SearchCheck size={18} className="text-[#12b76a]" /><h2 id="pipeline-title" className="font-bold">Project Pipeline</h2></div>
              <p className="mt-1 text-xs text-[#667085]">Existing work-order statuses, grouped without changing the underlying workflow.</p>
            </div>
            <Link href="/admin/work-orders" className="hidden text-sm font-bold text-[#155eef] sm:inline-flex">View all</Link>
          </div>
          <div className="grid divide-y divide-[#eaecf0] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            {snapshot.pipeline.map((column) => (
              <div key={column.id} className="min-w-0 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-[#475467]">{column.label}</h3>
                  <span className="rounded-full bg-[#f2f4f7] px-2 py-1 text-[10px] font-bold text-[#667085]">{orders.filter((order) => column.statuses.includes(order.status)).length}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {column.orders.length ? column.orders.map((order) => (
                    <div key={order.id} className="border-l-2 border-[#d0d5dd] bg-[#f9fafb] px-3 py-2">
                      <p className="truncate text-xs font-bold">{order.title}</p>
                      <p className="mt-1 truncate text-[11px] text-[#667085]">{order.customerName}</p>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone[order.status]}`}>{order.status}</span>
                    </div>
                  )) : <p className="py-5 text-center text-xs text-[#98a2b3]">No records</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
