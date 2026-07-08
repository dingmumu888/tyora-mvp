"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  ArrowLeft,
  CalendarClock,
  Check,
  Clock,
  Copy,
  Eye,
  EyeOff,
  File,
  Flag,
  Globe2,
  ImagePlus,
  LayoutDashboard,
  Library,
  Lock,
  LogOut,
  MessageCircle,
  MousePointerClick,
  Plus,
  Save,
  Search,
  Smartphone,
  TrendingUp,
  Trash2,
  Upload,
  UserRound,
  Users,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import {
  CaseStudy,
  CaseStudyStatus,
  defaultContent,
  defaultTeamMembers,
  Lead,
  LeadPriority,
  LeadStatus,
  loadContent,
  loadLeads,
  loadMedia,
  loadTeamMembers,
  MediaAsset,
  MediaType,
  PricingPlan,
  saveContent,
  saveLeads,
  saveMedia,
  saveTeamMembers,
  SiteContent,
  TeamMember,
  uploadMedia
} from "@/lib/storage";
import { AnalyticsDashboard } from "@/lib/analytics";
import { CommunityIdea, CommunityStatus } from "@/lib/community";

type TabId =
  | "today"
  | "analytics"
  | "homepage"
  | "sourceContent"
  | "mobileTabs"
  | "moduleVisibility"
  | "media"
  | "cases"
  | "video"
  | "brand"
  | "founder"
  | "pricing"
  | "contact"
  | "submissions";

type CmsLanguage = "en" | "zh";

const zhText: Record<string, string> = {
  "TYORA Admin Login": "TYORA 后台登录",
  Password: "密码",
  Login: "登录",
  "Incorrect password.": "密码不正确。",
  "TYORA CMS": "TYORA 内容管理",
  "CEO Dashboard": "CEO 仪表盘",
  "Today Overview": "今日概览",
  "Unique Visitors Today": "今日独立访客",
  "Page Views": "页面浏览量",
  "WhatsApp Clicks": "WhatsApp 点击",
  "New Leads": "新线索",
  "Conversion Rate": "转化率",
  "Average Session Duration": "平均访问时长",
  "Visitor Countries": "访客国家",
  "Traffic Sources": "流量来源",
  "Device Breakdown": "设备分布",
  "Top Pages": "热门页面",
  "CTA Performance": "按钮表现",
  "Recent Leads": "最新线索",
  "Lead Conversion Funnel": "线索转化漏斗",
  "Today's Tasks": "今日任务",
  "Quick Insights": "快速洞察",
  "Latest 7 Days": "最近 7 天",
  "No analytics data yet.": "暂无统计数据。",
  "No-code website management": "无代码网站管理",
  "Clear Filters": "清除筛选",
  "Save Changes": "保存修改",
  Logout: "退出登录",
  "Saved successfully.": "保存成功。",
  "Save failed. Please try again.": "保存失败，请重试。",
  "Media saved.": "媒体已保存。",
  "Media save failed. Please try again.": "媒体保存失败，请重试。",
  "URL copied.": "链接已复制。",
  "Homepage Content": "首页内容",
  "Media Library": "媒体库",
  "Case Studies": "案例管理",
  "Video Settings": "视频设置",
  "Brand Settings": "品牌设置",
  "Founder Profile": "创始人资料",
  Pricing: "价格管理",
  "Contact Settings": "联系方式",
  "Project Submissions": "项目提交",
  "Hero tagline": "首页标签语",
  "Hero headline": "首页主标题",
  "Hero subheadline": "首页副标题",
  "Hero input placeholder examples": "输入框轮播示例",
  "CTA button text": "按钮文字",
  "Trust badges, one per line": "信任徽章，每行一个",
  "Positioning headline line 1": "定位标题第一行",
  "Positioning headline line 2": "定位标题第二行",
  "Positioning subtitle": "定位副标题",
  "Footer text": "页脚文案",
  "Product Journey": "产品旅程",
  "How TYORA Helps": "TYORA 如何帮助",
  "Upload Files": "上传文件",
  "Search filename": "搜索文件名",
  "All types": "全部类型",
  Images: "图片",
  Videos: "视频",
  PDF: "PDF",
  "Copy URL": "复制链接",
  "Delete this file?": "确定删除这个文件？",
  "Video title": "视频标题",
  "Video source type": "视频来源类型",
  "Upload MP4 / WEBM": "上传 MP4 / WEBM",
  "YouTube URL": "YouTube 链接",
  "Vimeo URL": "Vimeo 链接",
  "Video subtitle": "视频副标题",
  "Video URL": "视频链接",
  "Uploaded video file": "上传的视频文件",
  "Video cover image": "视频封面图",
  Autoplay: "自动播放",
  Muted: "静音",
  Loop: "循环播放",
  "Brand name": "品牌名称",
  Tagline: "标语",
  "Logo image": "Logo 图片",
  Favicon: "网站图标",
  "Footer slogan": "页脚口号",
  "Founder name": "创始人姓名",
  "Founder title": "创始人标题",
  "Founder bio": "创始人简介",
  "Founder photo": "创始人照片",
  "WhatsApp URL": "WhatsApp 链接",
  "LinkedIn URL": "LinkedIn 链接",
  Email: "邮箱",
  "WhatsApp link": "WhatsApp 链接",
  LinkedIn: "LinkedIn",
  "Booking link": "预约链接",
  "Search submissions": "搜索提交记录",
  "All statuses": "全部状态",
  "Product Idea": "产品想法",
  "Design Type": "设计类型",
  Quantity: "数量",
  Budget: "预算",
  Timeline: "时间计划",
  Sample: "样品",
  "Sample Review": "样品确认方式",
  "Additional Requirements": "其他需求",
  "Uploaded Files": "上传文件",
  "Submission Date": "提交时间",
  Status: "状态",
  Details: "详情",
  View: "查看",
  "Submission Details": "提交详情",
  Close: "关闭",
  Idea: "想法",
  Design: "设计",
  "Internal notes": "内部备注",
  "Save Notes": "保存备注",
  "Dashboard Overview": "项目概览",
  "New Projects": "新项目",
  "Projects In Production": "生产中项目",
  "Waiting For Follow-up": "等待跟进",
  "Completed Projects": "已完成项目",
  "Project Owner": "项目负责人",
  Owner: "负责人",
  Priority: "优先级",
  "Last Contact Date": "最后联系日期",
  "Next Follow-up Date": "下次跟进日期",
  "All owners": "全部负责人",
  "All priorities": "全部优先级",
  "All countries": "全部国家",
  "All categories": "全部分类",
  "Any date": "任意日期",
  "Overdue follow-up": "跟进已逾期",
  "Customer Information": "客户信息",
  "Project Information": "项目信息",
  "Status History": "状态历史",
  "Assigned Owner": "已分配负责人",
  "Project Timeline": "项目时间线",
  "Add Internal Note": "新增内部备注",
  Author: "作者",
  "Note content": "备注内容",
  "Team Settings": "团队设置",
  "Add Team Member": "新增成员",
  "Edit Team Member": "编辑成员",
  Role: "角色",
  Active: "启用",
  Inactive: "停用",
  Disable: "停用",
  Enable: "启用",
  Unassigned: "未分配",
  Adam: "Adam",
  Jack: "Jack",
  Lucy: "Lucy",
  Kevin: "Kevin",
  Low: "低",
  Medium: "中",
  High: "高",
  Urgent: "紧急",
  "Add Case Study": "新增案例",
  Visible: "显示",
  Hidden: "隐藏",
  Up: "上移",
  Down: "下移",
  "Delete this case study?": "确定删除这个案例？",
  "Project Name": "项目名称",
  Slug: "链接别名",
  Country: "国家",
  Category: "分类",
  "Display Order": "显示顺序",
  "Short Description": "简短描述",
  "Concept Image": "概念图",
  "Prototype Image": "样品图",
  "Final Product Image": "成品图",
  "Add Plan": "新增方案",
  "New Plan": "新方案",
  Feature: "功能",
  "Get Started": "开始",
  "Delete this plan?": "确定删除这个价格方案？",
  "Section Title": "模块标题",
  "Section Subtitle": "模块副标题",
  "Proof Line 1": "证明文案第一行",
  "Proof Line 2": "证明文案第二行",
  "Plan Name": "方案名称",
  Price: "价格",
  "CTA Text": "按钮文字",
  "Features, one per line": "功能，每行一个",
  Note: "备注",
  "New Item": "新项目",
  Add: "新增",
  "Delete this item?": "确定删除这个项目？",
  "Drag and drop a file here": "拖拽文件到这里",
  "File selected": "已选择文件",
  "Upload / Replace": "上传 / 替换",
  "Select from Media Library": "从媒体库选择"
  ,
  New: "新线索",
  Contacted: "已联系",
  Quoting: "报价中",
  "Sample Stage": "样品阶段",
  Production: "生产中",
  Shipment: "发货中",
  Completed: "已完成",
  Lost: "已流失"
};

const osSections: Array<{
  title: string;
  items: Array<{ id?: TabId; href?: string; label: string; badge?: string }>;
}> = [
  { title: "Today", items: [{ id: "today", label: "Today" }] },
  {
    title: "Community",
    items: [
      { href: "/admin/community", label: "Ideas" },
      { href: "/admin/source", label: "Source Products" },
      { href: "/admin/community", label: "Comments" },
      { href: "/admin/community", label: "TYORA Reviews" },
      { href: "/admin/community", label: "Pinned Posts" },
      { href: "/admin/community", label: "Reported" }
    ]
  },
  {
    title: "Projects",
    items: [
      { id: "submissions", label: "Active Projects" },
      { id: "submissions", label: "Manufacturing" },
      { id: "submissions", label: "Shipping" },
      { id: "submissions", label: "Completed" }
    ]
  },
  {
    title: "Journeys",
    items: [
      { id: "cases", label: "All Journeys" },
      { id: "cases", label: "Featured" }
    ]
  },
  {
    title: "Website",
    items: [
      { id: "homepage", label: "Homepage" },
      { id: "sourceContent", label: "Source Page" },
      { id: "mobileTabs", label: "Mobile Tabs" },
      { id: "moduleVisibility", label: "Homepage Modules" },
      { id: "brand", label: "Navigation" },
      { id: "brand", label: "Footer" },
      { id: "video", label: "Brand Film" },
      { id: "pricing", label: "Pricing" },
      { id: "contact", label: "Contact Settings" },
      { id: "founder", label: "Founder Profile" }
    ]
  },
  { title: "Media", items: [{ id: "media", label: "Media Library" }] },
  {
    title: "Users",
    items: [
      { id: "analytics", label: "Users" },
      { id: "analytics", label: "Roles & Permissions" }
    ]
  },
  {
    title: "Settings",
    items: [
      { id: "brand", label: "General Settings" },
      { id: "contact", label: "Integrations" }
    ]
  }
];

const leadStatuses: LeadStatus[] = [
  "New",
  "Contacted",
  "Quoting",
  "Sample Stage",
  "Production",
  "Shipment",
  "Completed",
  "Lost"
];

const priorities: LeadPriority[] = ["Low", "Medium", "High", "Urgent"];

const caseStatuses: CaseStudyStatus[] = [
  "Concept",
  "Prototype Approved",
  "In Production",
  "Delivered"
];

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function mediaTypeFromMime(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "pdf";
}

function validateFile(file: File, allowed: MediaType[]) {
  const type = mediaTypeFromMime(file.type);
  const validMime =
    ["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.type) ||
    ["video/mp4", "video/webm", "application/pdf"].includes(file.type);

  if (!validMime || !allowed.includes(type)) {
    return `Unsupported file type: ${file.type || file.name}`;
  }

  const max = type === "image" ? 10 : type === "video" ? 200 : 20;
  if (file.size > max * 1024 * 1024) {
    return `${file.name} is too large. Maximum ${max}MB for ${type} files.`;
  }

  return "";
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[#e8ebef] bg-white px-3 text-sm font-medium">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4"
      />
    </label>
  );
}

function MediaUploader({
  label,
  value,
  media,
  allowed,
  onUpload,
  onChange,
  onDelete,
  t = (value: string) => value
}: {
  label: string;
  value: string;
  media: MediaAsset[];
  allowed: MediaType[];
  onUpload: (file: File) => Promise<MediaAsset | undefined>;
  onChange: (url: string) => void;
  onDelete: () => void;
  t?: (value: string) => string;
}) {
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const available = media.filter((asset) => allowed.includes(asset.type));

  async function handleFile(file?: File) {
    if (!file) return;
    const validation = validateFile(file, allowed);
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    setProgress(30);
    const asset = await onUpload(file);
    setProgress(100);
    window.setTimeout(() => setProgress(0), 700);
    if (asset) onChange(asset.url);
  }

  return (
    <div className="rounded-lg border border-[#e8ebef] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        {value ? (
          <Button variant="ghost" className="min-h-9 px-2" onClick={onDelete}>
            <Trash2 size={15} />
          </Button>
        ) : null}
      </div>

      <div
        className="mt-3 flex min-h-32 items-center justify-center rounded-lg border border-dashed border-[#d7dce2] bg-[#fbfbfc] p-4 text-center text-sm text-[#69707d]"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFile(event.dataTransfer.files[0]);
        }}
      >
        {value ? (
          value.startsWith("data:image") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="max-h-48 rounded-lg object-contain" />
          ) : value.startsWith("data:video") ? (
            <video src={value} className="max-h-48 rounded-lg" controls />
          ) : (
            <span className="flex items-center gap-2">
              <File size={18} /> {t("File selected")}
            </span>
          )
        ) : (
          <span>{t("Drag and drop a file here")}</span>
        )}
      </div>

      {progress ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eef1f4]">
          <div className="h-full bg-[#0f766e]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm font-medium hover:bg-[#f5f6f8]">
          <Upload size={15} />
          {t("Upload / Replace")}
          <input
            className="sr-only"
            type="file"
            accept={allowed.includes("image") ? "image/jpeg,image/png,image/webp,image/svg+xml" : allowed.includes("video") ? "video/mp4,video/webm" : "application/pdf"}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </label>
        <select
          className="min-h-10 flex-1 rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm"
          value=""
          onChange={(event) => event.target.value && onChange(event.target.value)}
        >
          <option value="">{t("Select from Media Library")}</option>
          {available.map((asset) => (
            <option key={asset.id} value={asset.url}>
              {asset.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [cmsLanguage, setCmsLanguage] = useState<CmsLanguage>("en");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(defaultTeamMembers);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [communityIdeas, setCommunityIdeas] = useState<CommunityIdea[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | MediaType>("all");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState<"all" | LeadStatus>("all");
  const [leadOwnerFilter, setLeadOwnerFilter] = useState("all");
  const [leadPriorityFilter, setLeadPriorityFilter] = useState<"all" | LeadPriority>("all");
  const [leadCountryFilter, setLeadCountryFilter] = useState("all");
  const [leadCategoryFilter, setLeadCategoryFilter] = useState("all");
  const [leadDateFilter, setLeadDateFilter] = useState("");
  const [submissionView, setSubmissionView] = useState<"projects" | "team">("projects");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteAuthor, setNoteAuthor] = useState("Adam");
  const [noteBody, setNoteBody] = useState("");

  useEffect(() => {
    void fetch("/api/admin/session")
      .then((response) => response.ok ? response.json() : { authenticated: false })
      .then((payload) => setAuthenticated(Boolean(payload.authenticated)))
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void Promise.all([loadContent(), loadMedia(), loadLeads(), loadTeamMembers()])
      .then(([nextContent, nextMedia, nextLeads, nextTeamMembers]) => {
        setContent(nextContent);
        setMedia(nextMedia);
        setLeads(nextLeads);
        setTeamMembers(nextTeamMembers);
      })
      .catch(() => showToast("Unable to load admin data."));
    void loadAnalytics();
    void loadCommunityAdminData();
  }, [authenticated]);

  const t = (value: string) => (cmsLanguage === "zh" ? zhText[value] || value : value);

  function toggleCmsLanguage() {
    const next = cmsLanguage === "en" ? "zh" : "en";
    setCmsLanguage(next);
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const response = await fetch("/api/analytics");
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Unable to load analytics.");
      }
      setAnalytics(payload.data);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function loadCommunityAdminData() {
    try {
      const response = await fetch("/api/admin/community");
      const payload = await response.json();
      setCommunityIdeas(payload.data || []);
    } catch {
      setCommunityIdeas([]);
    }
  }

  async function login() {
    setLoginError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setAuthenticated(true);
        setCheckingSession(false);
        setPassword("");
        return;
      }

      setLoginError("Incorrect password.");
    } catch {
      setLoginError("Incorrect password.");
    }
  }

  function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void login();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    setAuthenticated(false);
    setPassword("");
  }

  function updateContent<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  async function persistContent(next = content) {
    try {
      const saved = await saveContent(next);
      setContent(saved);
      showToast(t("Saved successfully."));
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("Save failed. Please try again."));
    }
  }

  async function persistMedia(next: MediaAsset[]) {
    try {
      const saved = await saveMedia(next);
      setMedia(saved);
      showToast(t("Media saved."));
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("Media save failed. Please try again."));
    }
  }

  async function addMedia(file: File) {
    const validation = validateFile(file, ["image", "video", "pdf"]);
    if (validation) {
      showToast(validation);
      return undefined;
    }
    const asset = await uploadMedia(file);
    setMedia((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
    showToast(t("Media saved."));
    return asset;
  }

  function updateLead(nextLead: Lead, label = "Project Updated") {
    const previous = leads.find((lead) => lead.id === nextLead.id);
    const shouldTrack = !previous || previous.status !== nextLead.status || previous.ownerId !== nextLead.ownerId;
    const history = shouldTrack
      ? [
          ...(nextLead.statusHistory || []),
          {
            id: id("history"),
            label,
            actor: "TYORA Admin",
            createdAt: new Date().toISOString()
          }
        ]
      : nextLead.statusHistory || [];
    const nextLeadWithHistory = { ...nextLead, statusHistory: history };
    const next = leads.map((lead) => (lead.id === nextLead.id ? nextLeadWithHistory : lead));
    setLeads(next);
    void saveLeads(next).catch(() => showToast("Submission update failed."));
    setSelectedLead(nextLeadWithHistory);
    showToast(t("Submission updated."));
  }

  function persistTeamMembers(next: TeamMember[]) {
    setTeamMembers(next);
    void saveTeamMembers(next).catch(() => showToast("Team save failed."));
    showToast(t("Saved successfully."));
  }

  function addInternalNote(lead: Lead) {
    if (!noteBody.trim()) return;
    const nextLead = {
      ...lead,
      internalNoteEntries: [
        ...(lead.internalNoteEntries || []),
        {
          id: id("note"),
          author: noteAuthor || "Adam",
          body: noteBody.trim(),
          createdAt: new Date().toISOString()
        }
      ]
    };
    setNoteBody("");
    updateLead(nextLead, "Internal Note Added");
  }

  const filteredMedia = useMemo(() => {
    return media.filter((asset) => {
      const matchesSearch = asset.name.toLowerCase().includes(mediaSearch.toLowerCase());
      const matchesType = mediaFilter === "all" || asset.type === mediaFilter;
      return matchesSearch && matchesType;
    });
  }, [media, mediaFilter, mediaSearch]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const haystack = [
          lead.id,
          lead.customerName,
          lead.company,
          lead.country,
          lead.category,
          lead.productIdea,
          lead.designType,
          lead.uploadedFile,
          lead.quantity,
          lead.budget,
          lead.timeline,
          lead.additionalRequirements
        ]
          .join(" ")
          .toLowerCase();
        const matchesSearch = haystack.includes(leadSearch.toLowerCase());
        const matchesStatus = leadStatusFilter === "all" || lead.status === leadStatusFilter;
        const matchesOwner = leadOwnerFilter === "all" || (lead.ownerId || "unassigned") === leadOwnerFilter;
        const matchesPriority = leadPriorityFilter === "all" || (lead.priority || "Medium") === leadPriorityFilter;
        const matchesCountry = leadCountryFilter === "all" || (lead.country || "Unspecified") === leadCountryFilter;
        const matchesCategory = leadCategoryFilter === "all" || (lead.category || "Unspecified") === leadCategoryFilter;
        const matchesDate = !leadDateFilter || lead.submissionDate.slice(0, 10) === leadDateFilter;
        return matchesSearch && matchesStatus && matchesOwner && matchesPriority && matchesCountry && matchesCategory && matchesDate;
      })
      .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
  }, [leadCategoryFilter, leadCountryFilter, leadDateFilter, leadOwnerFilter, leadPriorityFilter, leadSearch, leadStatusFilter, leads]);

  const leadCountries = useMemo(() => uniqueValues(leads.map((lead) => lead.country || "Unspecified")), [leads]);
  const leadCategories = useMemo(() => uniqueValues(leads.map((lead) => lead.category || "Unspecified")), [leads]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfbfc] p-4">
        <Card className="w-full max-w-sm p-6 text-center">
          <p className="font-semibold">TYORA OS</p>
          <p className="mt-1 text-xs text-[#69707d]">Product Creator Operating System</p>
        </Card>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfbfc] p-4">
        <Card className="w-full max-w-sm p-6">
          <form onSubmit={handleLoginSubmit}>
            <div className="mb-5 flex items-center gap-2">
              <Lock size={18} />
              <div>
                <h1 className="text-xl font-semibold">TYORA OS</h1>
                <p className="text-xs text-[#69707d]">Product Creator Operating System</p>
              </div>
            </div>
            <Field label={t("Password")}>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            {loginError ? <p className="mt-3 text-sm text-red-600">{t(loginError)}</p> : null}
            <Button className="mt-5 w-full" type="submit">
              {t("Login")}
            </Button>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#101216]">
      <header className="sticky top-0 z-30 border-b border-[#e8ebef] bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg p-2 hover:bg-[#f5f6f8]" aria-label="Back to site">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <p className="font-semibold">TYORA OS</p>
              <p className="text-xs text-[#69707d]">Product Creator Operating System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden min-h-10 px-3 sm:inline-flex">
              <Plus size={15} /> Quick Action
            </Button>
            <Button variant="outline" onClick={toggleCmsLanguage}>
              {cmsLanguage === "en" ? "中文" : "EN"}
            </Button>
            <Button onClick={() => persistContent()}>
              <Save size={16} /> {t("Save Changes")}
            </Button>
            <Button variant="outline" onClick={() => void logout()}>
              <LogOut size={16} /> {t("Logout")}
            </Button>
          </div>
        </div>
      </header>

      {toast ? (
        <div className="fixed right-5 top-20 z-50 rounded-lg bg-[#101216] px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="rounded-[22px] border border-[#e8ebef] bg-white p-4 shadow-sm shadow-[#101216]/4 lg:sticky lg:top-22 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-auto">
          <div className="mb-4 rounded-2xl bg-[#101216] p-4 text-white">
            <p className="text-sm font-semibold">Admin workspace</p>
            <p className="mt-1 text-xs leading-5 text-white/68">Workflow-first control for community, projects, journeys, website and media.</p>
          </div>
          <div className="space-y-4">
            {osSections.map((section) => (
              <div key={section.title}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-normal text-[#8b93a1]">{section.title}</p>
                <div className="mt-1 space-y-1">
                  {section.items.map((item) => item.href ? (
                    <Link key={`${section.title}-${item.label}`} href={item.href} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-[#59616e] transition hover:bg-[#f5f6f8]">
                      <span>{item.label}</span>
                      {item.label === "Ideas" ? <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[11px] text-[#315fbd]">{communityIdeas.length}</span> : null}
                    </Link>
                  ) : (
                    <button
                      key={`${section.title}-${item.label}`}
                      onClick={() => item.id && setActiveTab(item.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                        activeTab === item.id ? "bg-[#101216] text-white shadow-sm shadow-[#101216]/10" : "text-[#59616e] hover:bg-[#f5f6f8]"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge ? <span className="text-xs opacity-70">{item.badge}</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          {activeTab === "today" ? (
            <TodaySection
              analytics={analytics}
              communityIdeas={communityIdeas}
              leads={leads}
              setActiveTab={setActiveTab}
            />
          ) : null}

          {activeTab === "analytics" ? (
            <CeoDashboardSection
              analytics={analytics}
              loading={analyticsLoading}
              refresh={() => void loadAnalytics()}
              t={t}
            />
          ) : null}

          {activeTab === "homepage" ? (
            <Card className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <LayoutDashboard size={18} />
                <h1 className="text-xl font-semibold">{t("Homepage Content")}</h1>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label={t("Hero tagline")}>
                  <Input value={content.heroTagline} onChange={(event) => updateContent("heroTagline", event.target.value)} />
                </Field>
                <Field label={t("Hero headline")}>
                  <Input value={content.heroTitle} onChange={(event) => updateContent("heroTitle", event.target.value)} />
                </Field>
                <Field label={t("Hero subheadline")}>
                  <Textarea value={content.heroSubtitle} onChange={(event) => updateContent("heroSubtitle", event.target.value)} />
                </Field>
                <Field label={t("Hero input placeholder examples")}>
                  <Textarea
                    value={content.heroPlaceholders.join("\n")}
                    onChange={(event) => updateContent("heroPlaceholders", event.target.value.split("\n").filter(Boolean))}
                  />
                </Field>
                <Field label={t("CTA button text")}>
                  <Input value={content.ctaText} onChange={(event) => updateContent("ctaText", event.target.value)} />
                </Field>
                <Field label={t("Trust badges, one per line")}>
                  <Textarea
                    value={content.trustBadges.join("\n")}
                    onChange={(event) => updateContent("trustBadges", event.target.value.split("\n").filter(Boolean))}
                  />
                </Field>
                <Field label={t("Positioning headline line 1")}>
                  <Input value={content.positioningHeadlineA} onChange={(event) => updateContent("positioningHeadlineA", event.target.value)} />
                </Field>
                <Field label={t("Positioning headline line 2")}>
                  <Input value={content.positioningHeadlineB} onChange={(event) => updateContent("positioningHeadlineB", event.target.value)} />
                </Field>
                <Field label={t("Positioning subtitle")}>
                  <Textarea value={content.positioningText} onChange={(event) => updateContent("positioningText", event.target.value)} />
                </Field>
                <Field label={t("Footer text")}>
                  <Input value={content.footerSlogan} onChange={(event) => updateContent("footerSlogan", event.target.value)} />
                </Field>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <EditableCards
                  title={t("Product Journey")}
                  cards={content.journeySteps}
                  onChange={(journeySteps) => updateContent("journeySteps", journeySteps)}
                  t={t}
                />
                <EditableCards
                  title={t("How TYORA Helps")}
                  cards={content.helpCards}
                  onChange={(helpCards) => updateContent("helpCards", helpCards)}
                  t={t}
                />
              </div>
            </Card>
          ) : null}

          {activeTab === "sourceContent" ? (
            <Card className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <Globe2 size={18} />
                <h1 className="text-xl font-semibold">Source Page</h1>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Eyebrow">
                  <Input value={content.sourcePage.eyebrow} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, eyebrow: event.target.value })} />
                </Field>
                <Field label="CTA Text">
                  <Input value={content.sourcePage.ctaText} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, ctaText: event.target.value })} />
                </Field>
                <Field label="Title">
                  <Textarea value={content.sourcePage.title} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, title: event.target.value })} />
                </Field>
                <Field label="Subtitle">
                  <Textarea value={content.sourcePage.subtitle} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, subtitle: event.target.value })} />
                </Field>
                <Field label="Stat Label">
                  <Input value={content.sourcePage.statLabel} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, statLabel: event.target.value })} />
                </Field>
                <Field label="Secondary Stat Value">
                  <Input value={content.sourcePage.secondaryStatValue} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, secondaryStatValue: event.target.value })} />
                </Field>
                <Field label="Secondary Stat Label">
                  <Input value={content.sourcePage.secondaryStatLabel} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, secondaryStatLabel: event.target.value })} />
                </Field>
                <Field label="Sample Note">
                  <Input value={content.sourcePage.sampleNote} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, sampleNote: event.target.value })} />
                </Field>
                <Field label="Success Title">
                  <Input value={content.sourcePage.successTitle} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, successTitle: event.target.value })} />
                </Field>
                <Field label="Success Body">
                  <Input value={content.sourcePage.successBody} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, successBody: event.target.value })} />
                </Field>
                <Field label="Disclaimer">
                  <Textarea value={content.sourcePage.disclaimer} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, disclaimer: event.target.value })} />
                </Field>
                <Field label="Charge Section Title">
                  <Input value={content.sourcePage.chargeTitle} onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, chargeTitle: event.target.value })} />
                </Field>
              </div>
              <div className="mt-6">
                <EditableCards
                  title="Support Cards"
                  cards={content.sourcePage.supportCards}
                  onChange={(supportCards) => updateContent("sourcePage", { ...content.sourcePage, supportCards })}
                  t={t}
                />
              </div>
              <div className="mt-6">
                <EditableCards
                  title="Charging Cards"
                  cards={content.sourcePage.chargeCards}
                  onChange={(chargeCards) => updateContent("sourcePage", { ...content.sourcePage, chargeCards })}
                  t={t}
                />
              </div>
              <div className="mt-6 rounded-2xl border border-[#e8ebef] bg-[#fbfcfe] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Source Trust Toast</h2>
                    <p className="mt-1 text-sm text-[#69707d]">Generic activity prompts only. Do not use names, countries, or fake exact numbers.</p>
                  </div>
                  <Toggle
                    checked={content.sourcePage.trustToastEnabled}
                    onChange={(trustToastEnabled) => updateContent("sourcePage", { ...content.sourcePage, trustToastEnabled })}
                    label="Enabled"
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Toast Messages">
                    <Textarea
                      value={content.sourcePage.trustToastMessages.join("\n")}
                      onChange={(event) => updateContent("sourcePage", {
                        ...content.sourcePage,
                        trustToastMessages: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean)
                      })}
                    />
                  </Field>
                  <div className="grid gap-4">
                    <Field label="Minimum Seconds">
                      <Input
                        type="number"
                        min={5}
                        max={600}
                        value={content.sourcePage.trustToastMinSeconds}
                        onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, trustToastMinSeconds: Number(event.target.value) })}
                      />
                    </Field>
                    <Field label="Maximum Seconds">
                      <Input
                        type="number"
                        min={5}
                        max={600}
                        value={content.sourcePage.trustToastMaxSeconds}
                        onChange={(event) => updateContent("sourcePage", { ...content.sourcePage, trustToastMaxSeconds: Number(event.target.value) })}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {activeTab === "mobileTabs" ? (
            <Card className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <Smartphone size={18} />
                <h1 className="text-xl font-semibold">Mobile Tabs</h1>
              </div>
              <p className="mb-5 rounded-2xl bg-[#f7f8fa] p-3 text-sm text-[#69707d]">
                Routes are fixed for safety. Edit labels and create-menu copy only.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Community Tab">
                  <Input value={content.mobileTabs.community} onChange={(event) => updateContent("mobileTabs", { ...content.mobileTabs, community: event.target.value })} />
                </Field>
                <Field label="Source Tab">
                  <Input value={content.mobileTabs.source} onChange={(event) => updateContent("mobileTabs", { ...content.mobileTabs, source: event.target.value })} />
                </Field>
                <Field label="Create Tab">
                  <Input value={content.mobileTabs.create} onChange={(event) => updateContent("mobileTabs", { ...content.mobileTabs, create: event.target.value })} />
                </Field>
                <Field label="Build Tab">
                  <Input value={content.mobileTabs.build} onChange={(event) => updateContent("mobileTabs", { ...content.mobileTabs, build: event.target.value })} />
                </Field>
                <Field label="Profile Fallback Label">
                  <Input value={content.mobileTabs.profile} onChange={(event) => updateContent("mobileTabs", { ...content.mobileTabs, profile: event.target.value })} />
                </Field>
                <Field label="Start Discussion">
                  <Input value={content.mobileTabs.startDiscussion} onChange={(event) => updateContent("mobileTabs", { ...content.mobileTabs, startDiscussion: event.target.value })} />
                </Field>
                <Field label="Start Discussion Subtitle">
                  <Input value={content.mobileTabs.startDiscussionSubtitle} onChange={(event) => updateContent("mobileTabs", { ...content.mobileTabs, startDiscussionSubtitle: event.target.value })} />
                </Field>
                <Field label="Source Product">
                  <Input value={content.mobileTabs.sourceProduct} onChange={(event) => updateContent("mobileTabs", { ...content.mobileTabs, sourceProduct: event.target.value })} />
                </Field>
                <Field label="Source Product Subtitle">
                  <Input value={content.mobileTabs.sourceProductSubtitle} onChange={(event) => updateContent("mobileTabs", { ...content.mobileTabs, sourceProductSubtitle: event.target.value })} />
                </Field>
              </div>
            </Card>
          ) : null}

          {activeTab === "moduleVisibility" ? (
            <Card className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <Eye size={18} />
                <h1 className="text-xl font-semibold">Homepage Modules</h1>
              </div>
              <p className="mb-5 rounded-2xl bg-[#f7f8fa] p-3 text-sm text-[#69707d]">
                Hide or show major homepage sections. Community feed always stays visible.
              </p>
              <div className="grid gap-3 lg:grid-cols-2">
                {([
                  ["source", "Source Products"],
                  ["journeys", "Featured Journey"],
                  ["successStories", "Products Built"],
                  ["build", "Build / Brand Film"],
                  ["pricing", "Pricing"],
                  ["founder", "Founder"],
                  ["faq", "FAQ"],
                  ["finalCta", "Final CTA"]
                ] as const).map(([key, label]) => (
                  <Toggle
                    key={key}
                    label={label}
                    checked={content.moduleVisibility[key]}
                    onChange={(checked) => updateContent("moduleVisibility", { ...content.moduleVisibility, [key]: checked })}
                  />
                ))}
              </div>
            </Card>
          ) : null}

          {activeTab === "media" ? (
            <Card className="p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Library size={18} />
                  <h1 className="text-xl font-semibold">{t("Media Library")}</h1>
                </div>
                <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#101216] px-4 text-sm font-medium text-white">
                  <Upload size={16} /> {t("Upload Files")}
                  <input
                    className="sr-only"
                    multiple
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm,application/pdf"
                    onChange={(event) => {
                      Array.from(event.target.files || []).forEach((file) => void addMedia(file));
                    }}
                  />
                </label>
              </div>
              <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-[#8c94a1]" size={16} />
                  <Input className="pl-9" placeholder={t("Search filename")} value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} />
                </div>
                <select className="min-h-11 rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm" value={mediaFilter} onChange={(event) => setMediaFilter(event.target.value as "all" | MediaType)}>
                  <option value="all">{t("All types")}</option>
                  <option value="image">{t("Images")}</option>
                  <option value="video">{t("Videos")}</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredMedia.map((asset) => (
                  <div key={asset.id} className="rounded-lg border border-[#e8ebef] bg-white p-3">
                    <div className="flex h-36 items-center justify-center rounded-lg bg-[#f2f4f6]">
                      {asset.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.url} alt={asset.name} className="h-full w-full rounded-lg object-cover" />
                      ) : asset.type === "video" ? (
                        <Video className="text-[#69707d]" />
                      ) : (
                        <File className="text-[#69707d]" />
                      )}
                    </div>
                    <p className="mt-3 truncate text-sm font-medium">{asset.name}</p>
                    <p className="text-xs text-[#69707d]">{asset.type} · {(asset.size / 1024 / 1024).toFixed(2)}MB</p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" className="min-h-9 flex-1 px-2" onClick={() => navigator.clipboard.writeText(asset.url).then(() => showToast(t("URL copied.")))}>
                        <Copy size={14} /> {t("Copy URL")}
                      </Button>
                      <Button variant="ghost" className="min-h-9 px-2" onClick={() => window.confirm(t("Delete this file?")) && persistMedia(media.filter((item) => item.id !== asset.id))}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {activeTab === "cases" ? (
            <CaseStudiesEditor content={content} media={media} addMedia={addMedia} updateContent={updateContent} t={t} />
          ) : null}

          {activeTab === "video" ? (
            <Card className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <Video size={18} />
                <h1 className="text-xl font-semibold">{t("Video Settings")}</h1>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label={t("Video title")}>
                  <Input value={content.video.title} onChange={(event) => updateContent("video", { ...content.video, title: event.target.value })} />
                </Field>
                <Field label={t("Video source type")}>
                  <select className="min-h-11 w-full rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm" value={content.video.sourceType} onChange={(event) => updateContent("video", { ...content.video, sourceType: event.target.value as SiteContent["video"]["sourceType"] })}>
                    <option value="upload">{t("Upload MP4 / WEBM")}</option>
                    <option value="youtube">{t("YouTube URL")}</option>
                    <option value="vimeo">{t("Vimeo URL")}</option>
                  </select>
                </Field>
                <Field label={t("Video subtitle")}>
                  <Textarea value={content.video.subtitle} onChange={(event) => updateContent("video", { ...content.video, subtitle: event.target.value })} />
                </Field>
                <Field label={t("Video URL")}>
                  <Input value={content.video.videoUrl} onChange={(event) => updateContent("video", { ...content.video, videoUrl: event.target.value })} />
                </Field>
                <MediaUploader label={t("Uploaded video file")} value={content.video.uploadedVideoFile} media={media} allowed={["video"]} onUpload={addMedia} onChange={(url) => updateContent("video", { ...content.video, uploadedVideoFile: url })} onDelete={() => updateContent("video", { ...content.video, uploadedVideoFile: "" })} t={t} />
                <MediaUploader label={t("Video cover image")} value={content.video.coverImage} media={media} allowed={["image"]} onUpload={addMedia} onChange={(url) => updateContent("video", { ...content.video, coverImage: url })} onDelete={() => updateContent("video", { ...content.video, coverImage: "" })} t={t} />
                <Toggle label={t("Autoplay")} checked={content.video.autoplay} onChange={(autoplay) => updateContent("video", { ...content.video, autoplay })} />
                <Toggle label={t("Muted")} checked={content.video.muted} onChange={(muted) => updateContent("video", { ...content.video, muted })} />
                <Toggle label={t("Loop")} checked={content.video.loop} onChange={(loop) => updateContent("video", { ...content.video, loop })} />
              </div>
            </Card>
          ) : null}

          {activeTab === "brand" ? (
            <Card className="p-5">
              <h1 className="mb-5 text-xl font-semibold">{t("Brand Settings")}</h1>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label={t("Brand name")}>
                  <Input value={content.brandName} onChange={(event) => updateContent("brandName", event.target.value)} />
                </Field>
                <Field label={t("Tagline")}>
                  <Input value={content.tagline} onChange={(event) => updateContent("tagline", event.target.value)} />
                </Field>
                <MediaUploader label={t("Logo image")} value={content.logoImage} media={media} allowed={["image"]} onUpload={addMedia} onChange={(url) => updateContent("logoImage", url)} onDelete={() => updateContent("logoImage", "")} t={t} />
                <MediaUploader label={t("Favicon")} value={content.favicon} media={media} allowed={["image"]} onUpload={addMedia} onChange={(url) => updateContent("favicon", url)} onDelete={() => updateContent("favicon", "")} t={t} />
                <Field label={t("Footer slogan")}>
                  <Input value={content.footerSlogan} onChange={(event) => updateContent("footerSlogan", event.target.value)} />
                </Field>
              </div>
            </Card>
          ) : null}

          {activeTab === "founder" ? (
            <Card className="p-5">
              <h1 className="mb-5 text-xl font-semibold">{t("Founder Profile")}</h1>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label={t("Founder name")}>
                  <Input value={content.founderName} onChange={(event) => updateContent("founderName", event.target.value)} />
                </Field>
                <Field label={t("Founder title")}>
                  <Input value={content.founderTitle} onChange={(event) => updateContent("founderTitle", event.target.value)} />
                </Field>
                <Field label={t("Founder bio")}>
                  <Textarea value={content.founderText} onChange={(event) => updateContent("founderText", event.target.value)} />
                </Field>
                <MediaUploader label={t("Founder photo")} value={content.founderPhoto} media={media} allowed={["image"]} onUpload={addMedia} onChange={(url) => updateContent("founderPhoto", url)} onDelete={() => updateContent("founderPhoto", "")} t={t} />
                <Field label={t("WhatsApp URL")}>
                  <Input value={content.whatsappLink} onChange={(event) => updateContent("whatsappLink", event.target.value)} />
                </Field>
                <Field label={t("LinkedIn URL")}>
                  <Input value={content.linkedInLink} onChange={(event) => updateContent("linkedInLink", event.target.value)} />
                </Field>
                <Field label={t("Email")}>
                  <Input value={content.email} onChange={(event) => updateContent("email", event.target.value)} />
                </Field>
              </div>
            </Card>
          ) : null}

          {activeTab === "pricing" ? (
            <PricingEditor content={content} updateContent={updateContent} t={t} />
          ) : null}

          {activeTab === "contact" ? (
            <Card className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <MessageCircle size={18} />
                <h1 className="text-xl font-semibold">{t("Contact Settings")}</h1>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label={t("WhatsApp link")}>
                  <Input value={content.whatsappLink} onChange={(event) => updateContent("whatsappLink", event.target.value)} />
                </Field>
                <Field label={t("Email")}>
                  <Input value={content.email} onChange={(event) => updateContent("email", event.target.value)} />
                </Field>
                <Field label={t("LinkedIn")}>
                  <Input value={content.linkedInLink} onChange={(event) => updateContent("linkedInLink", event.target.value)} />
                </Field>
                <Field label={t("Booking link")}>
                  <Input value={content.callLink} onChange={(event) => updateContent("callLink", event.target.value)} />
                </Field>
              </div>
            </Card>
          ) : null}

          {activeTab === "submissions" ? (
            <ProjectSubmissionsSection
              filteredLeads={filteredLeads}
              leads={leads}
              leadSearch={leadSearch}
              setLeadSearch={setLeadSearch}
              leadStatusFilter={leadStatusFilter}
              setLeadStatusFilter={setLeadStatusFilter}
              leadOwnerFilter={leadOwnerFilter}
              setLeadOwnerFilter={setLeadOwnerFilter}
              leadPriorityFilter={leadPriorityFilter}
              setLeadPriorityFilter={setLeadPriorityFilter}
              leadCountryFilter={leadCountryFilter}
              setLeadCountryFilter={setLeadCountryFilter}
              leadCategoryFilter={leadCategoryFilter}
              setLeadCategoryFilter={setLeadCategoryFilter}
              leadDateFilter={leadDateFilter}
              setLeadDateFilter={setLeadDateFilter}
              leadCountries={leadCountries}
              leadCategories={leadCategories}
              submissionView={submissionView}
              setSubmissionView={setSubmissionView}
              selectedLead={selectedLead}
              setSelectedLead={setSelectedLead}
              updateLead={updateLead}
              teamMembers={teamMembers}
              persistTeamMembers={persistTeamMembers}
              noteAuthor={noteAuthor}
              setNoteAuthor={setNoteAuthor}
              noteBody={noteBody}
              setNoteBody={setNoteBody}
              addInternalNote={addInternalNote}
              t={t}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function TodaySection({
  analytics,
  communityIdeas,
  leads,
  setActiveTab
}: {
  analytics: AnalyticsDashboard | null;
  communityIdeas: CommunityIdea[];
  leads: Lead[];
  setActiveTab: (tab: TabId) => void;
}) {
  const waitingIdeas = communityIdeas.filter((idea) => !idea.review && !idea.hidden).slice(0, 8);
  const recentReviews = communityIdeas.filter((idea) => idea.review).slice(0, 5);
  const pinnedIdeas = communityIdeas.filter((idea) => idea.pinned).slice(0, 5);
  const projectsStarted = communityIdeas.filter((idea) => ["Project Started", "Manufacturing", "Shipping", "Completed"].includes(idea.status));
  const manufacturing = communityIdeas.filter((idea) => idea.status === "Manufacturing").length;
  const shipping = communityIdeas.filter((idea) => idea.status === "Shipping").length;
  const completed = communityIdeas.filter((idea) => idea.status === "Completed").length;
  const likes = communityIdeas.reduce((sum, idea) => sum + idea.likeCount, 0);
  const liveActivity = [
    ...communityIdeas.slice(0, 4).map((idea) => `${idea.author.name} uploaded ${idea.title}`),
    ...recentReviews.map((idea) => `TYORA reviewed ${idea.title}`),
    ...communityIdeas.flatMap((idea) => idea.comments.slice(-1).map((comment) => `${comment.author.name} commented on ${idea.title}`))
  ].slice(0, 8);

  const topCards = [
    ["Ideas Waiting", waitingIdeas.length, "yellow"],
    ["TYORA Reviews", recentReviews.length, "green"],
    ["Projects Started", projectsStarted.length, "blue"],
    ["New Users", Math.max(communityIdeas.length, leads.length), "purple"],
    ["Total Views", analytics?.summary.pageViewsToday || 0, "gray"],
    ["Likes", likes, "orange"]
  ] as const;

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-[#e8ebef] bg-white p-6 shadow-sm shadow-[#101216]/4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#69707d]">Today</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Good morning, Adam 👋</h1>
            <p className="mt-2 text-[#69707d]">Here&apos;s what needs your attention today.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/ask/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white"><Plus size={15} /> New Idea</a>
            <button onClick={() => setActiveTab("submissions")} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dfe3e8] px-4 text-sm font-semibold"><Plus size={15} /> New Project</button>
            <button onClick={() => setActiveTab("cases")} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dfe3e8] px-4 text-sm font-semibold"><Plus size={15} /> Publish Journey</button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {topCards.map(([label, value, tone]) => (
            <div key={label} className={`rounded-2xl border p-4 ${toneClass(tone)}`}>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-xs font-medium text-[#69707d]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[22px] p-5 shadow-sm shadow-[#101216]/4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Needs Your Reply</h2>
              <p className="mt-1 text-sm text-[#69707d]">Ideas waiting for TYORA Expert Review.</p>
            </div>
            <a href="/admin/community" className="text-sm font-semibold text-[#315fbd]">Open queue</a>
          </div>
          <div className="divide-y divide-[#eef1f4]">
            {waitingIdeas.length === 0 ? <p className="rounded-2xl bg-[#f7f8fa] p-4 text-sm text-[#69707d]">No ideas waiting for review.</p> : null}
            {waitingIdeas.map((idea) => (
              <div key={idea.id} className="grid gap-3 py-4 sm:grid-cols-[52px_1fr_auto] sm:items-center">
                <div className="flex size-13 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e9f7f3] to-[#efe9ff] text-sm font-semibold">
                  {idea.title.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{idea.title}</p>
                  <p className="mt-1 text-sm text-[#69707d]">{idea.author.name} · {relativeTime(idea.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <OsStatusBadge status={idea.status} waiting={!idea.review} />
                  <a href="/admin/community" className="rounded-full bg-[#101216] px-3 py-2 text-xs font-semibold text-white">Reply</a>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[22px] p-5 shadow-sm shadow-[#101216]/4">
          <h2 className="text-xl font-semibold">Product Journeys Overview</h2>
          <div className="mt-5 grid gap-3">
            {[
              ["Active Projects", projectsStarted.length, "bg-[#e9f2ff] text-[#1d4ed8]"],
              ["Manufacturing", manufacturing, "bg-[#f0eaff] text-[#6d28d9]"],
              ["Shipping", shipping, "bg-[#fff0df] text-[#c2410c]"],
              ["Completed", completed, "bg-[#e8f8ef] text-[#15803d]"]
            ].map(([label, value, cls]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-[#eef1f4] p-4">
                <span className="font-medium">{label}</span>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${cls}`}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <OsListCard title="Recent Community Activity" empty="No community activity yet." items={liveActivity} />
        <OsListCard title="Pinned Ideas" empty="No pinned ideas." items={pinnedIdeas.map((idea) => idea.title)} />
        <OsListCard title="Recent TYORA Reviews" empty="No TYORA reviews yet." items={recentReviews.map((idea) => idea.title)} />
      </section>

      <Card className="rounded-[22px] p-5 shadow-sm shadow-[#101216]/4">
        <div className="mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-[#c2410c]" />
          <h2 className="text-xl font-semibold">Live Activity Feed</h2>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {liveActivity.length === 0 ? <p className="text-sm text-[#69707d]">Real activity only. Uploads, comments, TYORA reviews and project changes will appear here.</p> : null}
          {liveActivity.map((item) => <p key={item} className="rounded-2xl bg-[#f7f8fa] p-3 text-sm text-[#59616e]">{item}</p>)}
        </div>
      </Card>
    </div>
  );
}

function OsListCard({ title, empty, items }: { title: string; empty: string; items: string[] }) {
  return (
    <Card className="rounded-[22px] p-5 shadow-sm shadow-[#101216]/4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? <p className="text-sm leading-6 text-[#69707d]">{empty}</p> : null}
        {items.slice(0, 6).map((item) => <p key={item} className="rounded-2xl bg-[#f7f8fa] p-3 text-sm text-[#59616e]">{item}</p>)}
      </div>
    </Card>
  );
}

function OsStatusBadge({ status, waiting }: { status: CommunityStatus; waiting?: boolean }) {
  const label = waiting ? "Waiting TYORA Review" : status === "TYORA Reviewing" ? "TYORA Replied" : status;
  const cls = waiting
    ? "bg-[#fff7d6] text-[#8a5a00]"
    : status === "Completed"
      ? "bg-[#e8f8ef] text-[#15803d]"
      : status === "Project Started"
        ? "bg-[#e9f2ff] text-[#1d4ed8]"
        : status === "Manufacturing"
          ? "bg-[#f0eaff] text-[#6d28d9]"
          : status === "Shipping"
            ? "bg-[#fff0df] text-[#c2410c]"
            : "bg-[#f0eaff] text-[#6d28d9]";
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

function toneClass(tone: string) {
  if (tone === "green") return "border-[#c9efd8] bg-[#f3fbf6]";
  if (tone === "yellow") return "border-[#ffe89a] bg-[#fffbea]";
  if (tone === "blue") return "border-[#c9ddff] bg-[#f4f8ff]";
  if (tone === "purple") return "border-[#ddd0ff] bg-[#f7f3ff]";
  if (tone === "orange") return "border-[#ffd8ad] bg-[#fff7ed]";
  return "border-[#eef1f4] bg-[#fbfbfc]";
}

function relativeTime(value: string) {
  const hours = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 36e5));
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

function CeoDashboardSection({
  analytics,
  loading,
  refresh,
  t
}: {
  analytics: AnalyticsDashboard | null;
  loading: boolean;
  refresh: () => void;
  t: (value: string) => string;
}) {
  const summary = analytics?.summary;
  const summaryCards = [
    {
      label: t("Unique Visitors Today"),
      value: summary?.visitorsToday ?? 0,
      detail: `${summary?.visitors7Days ?? 0} last 7 days`,
      icon: <Globe2 size={17} />
    },
    {
      label: t("Page Views"),
      value: summary?.pageViewsToday ?? 0,
      detail: "Today",
      icon: <BarChart3 size={17} />
    },
    {
      label: t("WhatsApp Clicks"),
      value: summary?.whatsappClicksToday ?? 0,
      detail: "Today",
      icon: <MessageCircle size={17} />
    },
    {
      label: t("New Leads"),
      value: summary?.newLeadsToday ?? 0,
      detail: "Today",
      icon: <Users size={17} />
    },
    {
      label: t("Conversion Rate"),
      value: `${summary?.conversionRateToday ?? 0}%`,
      detail: "Lead / unique visitor",
      icon: <TrendingUp size={17} />
    },
    {
      label: t("Average Session Duration"),
      value: formatDuration(summary?.averageSessionDurationSeconds ?? 0),
      detail: "Estimated",
      icon: <Clock size={17} />
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} />
            <div>
              <h1 className="text-xl font-semibold">{t("CEO Dashboard")}</h1>
              <p className="text-sm text-[#69707d]">{t("Today Overview")}</p>
            </div>
          </div>
          <Button variant="outline" className="min-h-9 px-3" onClick={refresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-lg border border-[#e8ebef] bg-white p-4">
              <div className="mb-3 flex items-center justify-between text-[#69707d]">
                {card.icon}
                <span className="text-xs">{card.detail}</span>
              </div>
              <p className="text-2xl font-semibold">{card.value}</p>
              <p className="mt-1 text-sm text-[#69707d]">{card.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {!analytics ? (
        <Card className="p-8 text-center text-sm text-[#69707d]">
          {loading ? "Loading analytics..." : t("No analytics data yet.")}
        </Card>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <MetricPanel title={t("Visitor Countries")} metrics={analytics.countries} />
            <MetricPanel title={t("Traffic Sources")} metrics={analytics.sources} />
            <MetricPanel title={t("Device Breakdown")} metrics={analytics.devices} icon={<Smartphone size={17} />} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <MetricPanel title={t("Top Pages")} metrics={analytics.topPages} />
            <MetricPanel title={t("CTA Performance")} metrics={analytics.ctaPerformance} icon={<MousePointerClick size={17} />} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-5">
              <h2 className="mb-4 font-semibold">{t("Latest 7 Days")}</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="text-xs uppercase text-[#69707d]">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Unique Visitors</th>
                      <th className="px-3 py-2">Page Views</th>
                      <th className="px-3 py-2">WhatsApp</th>
                      <th className="px-3 py-2">Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.dailyTrend.map((row) => (
                      <tr key={row.date} className="border-t border-[#eef1f4]">
                        <td className="px-3 py-3 font-medium">{row.date}</td>
                        <td className="px-3 py-3">{row.visitors}</td>
                        <td className="px-3 py-3">{row.pageViews}</td>
                        <td className="px-3 py-3">{row.whatsappClicks}</td>
                        <td className="px-3 py-3">{row.leadSubmissions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 font-semibold">{t("Today's Tasks")}</h2>
              <div className="grid gap-3">
                {analytics.tasks.map((task) => (
                  <div key={task.label} className="flex items-center justify-between rounded-lg border border-[#e8ebef] bg-white px-3 py-3">
                    <span className="text-sm text-[#59616e]">{task.label}</span>
                    <span className="text-lg font-semibold">{task.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <MetricPanel title={t("Lead Conversion Funnel")} metrics={analytics.funnel} />
            <Card className="p-5">
              <h2 className="mb-4 font-semibold">{t("Quick Insights")}</h2>
              <div className="space-y-3 text-sm text-[#59616e]">
                {analytics.insights.length ? analytics.insights.map((insight) => (
                  <p key={insight} className="rounded-lg bg-[#fbfbfc] p-3">{insight}</p>
                )) : <p>{t("No analytics data yet.")}</p>}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold">{t("Recent Leads")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase text-[#69707d]">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Country</th>
                    <th className="px-3 py-2">Company</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Submission Time</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentLeads.map((lead) => (
                    <tr key={lead.id} className="border-t border-[#eef1f4]">
                      <td className="px-3 py-3">{lead.name}</td>
                      <td className="px-3 py-3">{lead.country}</td>
                      <td className="px-3 py-3">{lead.company}</td>
                      <td className="px-3 py-3">{lead.status}</td>
                      <td className="px-3 py-3">{formatDateTime(lead.submissionTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!analytics.recentLeads.length ? (
                <p className="py-6 text-center text-sm text-[#69707d]">{t("No submissions yet.")}</p>
              ) : null}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricPanel({
  title,
  metrics,
  icon
}: {
  title: string;
  metrics: Array<{ label: string; value: number; percentage?: number }>;
  icon?: React.ReactNode;
}) {
  const visible = metrics.length ? metrics : [{ label: "No data", value: 0, percentage: 0 }];
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon || <BarChart3 size={17} />}
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="space-y-3">
        {visible.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-[#59616e]">{item.label}</span>
              <span className="font-medium">{item.value}{typeof item.percentage === "number" ? ` (${item.percentage}%)` : ""}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eef1f4]">
              <div className="h-full rounded-full bg-[#101216]" style={{ width: `${Math.min(100, item.percentage || 0)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function formatDuration(seconds: number) {
  if (!seconds) return "0s";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

function ProjectSubmissionsSection({
  filteredLeads,
  leads,
  leadSearch,
  setLeadSearch,
  leadStatusFilter,
  setLeadStatusFilter,
  leadOwnerFilter,
  setLeadOwnerFilter,
  leadPriorityFilter,
  setLeadPriorityFilter,
  leadCountryFilter,
  setLeadCountryFilter,
  leadCategoryFilter,
  setLeadCategoryFilter,
  leadDateFilter,
  setLeadDateFilter,
  leadCountries,
  leadCategories,
  submissionView,
  setSubmissionView,
  selectedLead,
  setSelectedLead,
  updateLead,
  teamMembers,
  persistTeamMembers,
  noteAuthor,
  setNoteAuthor,
  noteBody,
  setNoteBody,
  addInternalNote,
  t
}: {
  filteredLeads: Lead[];
  leads: Lead[];
  leadSearch: string;
  setLeadSearch: (value: string) => void;
  leadStatusFilter: "all" | LeadStatus;
  setLeadStatusFilter: (value: "all" | LeadStatus) => void;
  leadOwnerFilter: string;
  setLeadOwnerFilter: (value: string) => void;
  leadPriorityFilter: "all" | LeadPriority;
  setLeadPriorityFilter: (value: "all" | LeadPriority) => void;
  leadCountryFilter: string;
  setLeadCountryFilter: (value: string) => void;
  leadCategoryFilter: string;
  setLeadCategoryFilter: (value: string) => void;
  leadDateFilter: string;
  setLeadDateFilter: (value: string) => void;
  leadCountries: string[];
  leadCategories: string[];
  submissionView: "projects" | "team";
  setSubmissionView: (value: "projects" | "team") => void;
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
  updateLead: (lead: Lead, label?: string) => void;
  teamMembers: TeamMember[];
  persistTeamMembers: (members: TeamMember[]) => void;
  noteAuthor: string;
  setNoteAuthor: (value: string) => void;
  noteBody: string;
  setNoteBody: (value: string) => void;
  addInternalNote: (lead: Lead) => void;
  t: (value: string) => string;
}) {
  const activeMembers = teamMembers.filter((member) => member.active);
  const overview = {
    newProjects: leads.filter((lead) => lead.status === "New").length,
    production: leads.filter((lead) => lead.status === "Production").length,
    followUps: leads.filter(isFollowUpOverdue).length,
    completed: leads.filter((lead) => lead.status === "Completed").length
  };

  return (
    <Card className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("Project Submissions")}</h1>
          <p className="mt-1 text-sm text-[#69707d]">Lightweight internal CRM for TYORA project management.</p>
        </div>
        <div className="inline-flex rounded-lg border border-[#e1e5ea] bg-white p-1">
          <button className={viewButtonClass(submissionView === "projects")} onClick={() => setSubmissionView("projects")}>
            <LayoutDashboard size={15} /> {t("Project Submissions")}
          </button>
          <button className={viewButtonClass(submissionView === "team")} onClick={() => setSubmissionView("team")}>
            <Users size={15} /> {t("Team Settings")}
          </button>
        </div>
      </div>

      {submissionView === "team" ? (
        <TeamSettings teamMembers={teamMembers} persistTeamMembers={persistTeamMembers} t={t} />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewCard icon={<UserRound size={18} />} label={t("New Projects")} value={overview.newProjects} />
            <OverviewCard icon={<Flag size={18} />} label={t("Projects In Production")} value={overview.production} />
            <OverviewCard icon={<CalendarClock size={18} />} label={t("Waiting For Follow-up")} value={overview.followUps} tone="orange" />
            <OverviewCard icon={<Check size={18} />} label={t("Completed Projects")} value={overview.completed} />
          </div>

          <div className="mb-5 grid gap-3 lg:grid-cols-4">
            <Input placeholder={`${t("Search submissions")}...`} value={leadSearch} onChange={(event) => setLeadSearch(event.target.value)} />
            <select className="min-h-11 rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm" value={leadOwnerFilter} onChange={(event) => setLeadOwnerFilter(event.target.value)}>
              <option value="all">{t("All owners")}</option>
              <option value="unassigned">{t("Unassigned")}</option>
              {activeMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
            <select className="min-h-11 rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm" value={leadStatusFilter} onChange={(event) => setLeadStatusFilter(event.target.value as "all" | LeadStatus)}>
              <option value="all">{t("All statuses")}</option>
              {leadStatuses.map((status) => <option key={status} value={status}>{t(status)}</option>)}
            </select>
            <select className="min-h-11 rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm" value={leadPriorityFilter} onChange={(event) => setLeadPriorityFilter(event.target.value as "all" | LeadPriority)}>
              <option value="all">{t("All priorities")}</option>
              {priorities.map((priority) => <option key={priority} value={priority}>{t(priority)}</option>)}
            </select>
            <select className="min-h-11 rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm" value={leadCountryFilter} onChange={(event) => setLeadCountryFilter(event.target.value)}>
              <option value="all">{t("All countries")}</option>
              {leadCountries.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
            <select className="min-h-11 rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm" value={leadCategoryFilter} onChange={(event) => setLeadCategoryFilter(event.target.value)}>
              <option value="all">{t("All categories")}</option>
              {leadCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <Input type="date" value={leadDateFilter} onChange={(event) => setLeadDateFilter(event.target.value)} />
            <Button variant="outline" onClick={() => {
              setLeadSearch("");
              setLeadOwnerFilter("all");
              setLeadStatusFilter("all");
              setLeadPriorityFilter("all");
              setLeadCountryFilter("all");
              setLeadCategoryFilter("all");
              setLeadDateFilter("");
            }}>
              {t("Clear Filters")}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
              <thead className="bg-[#f5f6f8] text-[#69707d]">
                <tr>
                  {["Project ID", "Product Idea", "Owner", "Status", "Priority", "Country", "Category", "Next Follow-up Date", "Submission Date", "Details"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">{t(heading)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const owner = teamMembers.find((member) => member.id === (lead.ownerId || "unassigned"));
                  const overdue = isFollowUpOverdue(lead);
                  return (
                    <tr key={lead.id} className={`border-t border-[#eef1f4] align-top ${overdue ? "bg-[#fff7ed]" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs">{shortId(lead.id)}</td>
                      <td className="max-w-[260px] px-4 py-3">
                        <p className="font-medium">{lead.productIdea || "-"}</p>
                        <p className="mt-1 text-xs text-[#69707d]">{lead.customerName || lead.company || lead.designType || "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Avatar member={owner} />
                          <span>{owner?.name || t("Unassigned")}</span>
                        </div>
                        <select className="min-h-9 w-full rounded-lg border border-[#e1e5ea] bg-white px-2" value={lead.ownerId || "unassigned"} onChange={(event) => updateLead({ ...lead, ownerId: event.target.value }, event.target.value === "unassigned" ? "Owner Removed" : `Assigned To ${ownerName(event.target.value, teamMembers)}`)}>
                          <option value="unassigned">{t("Unassigned")}</option>
                          {activeMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} t={t} />
                        <select className="mt-2 min-h-9 w-full rounded-lg border border-[#e1e5ea] bg-white px-2" value={lead.status} onChange={(event) => updateLead({ ...lead, status: event.target.value as LeadStatus }, statusTimelineLabel(event.target.value as LeadStatus))}>
                          {leadStatuses.map((status) => <option key={status} value={status}>{t(status)}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={lead.priority || "Medium"} t={t} />
                        <select className="mt-2 min-h-9 w-full rounded-lg border border-[#e1e5ea] bg-white px-2" value={lead.priority || "Medium"} onChange={(event) => updateLead({ ...lead, priority: event.target.value as LeadPriority }, "Priority Updated")}>
                          {priorities.map((priority) => <option key={priority} value={priority}>{t(priority)}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">{lead.country || "-"}</td>
                      <td className="px-4 py-3">{lead.category || "-"}</td>
                      <td className="px-4 py-3">
                        <Input type="date" className={overdue ? "border-[#f59e0b] bg-[#fff7ed]" : ""} value={lead.nextFollowUpDate || ""} onChange={(event) => updateLead({ ...lead, nextFollowUpDate: event.target.value }, "Follow-up Scheduled")} />
                        {overdue ? <p className="mt-1 text-xs font-medium text-[#c2410c]">{t("Overdue follow-up")}</p> : null}
                      </td>
                      <td className="px-4 py-3">{formatDateTime(lead.submissionDate)}</td>
                      <td className="px-4 py-3">
                        <Button variant="outline" className="min-h-9 px-3" onClick={() => setSelectedLead(lead)}>
                          {t("View")}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedLead ? (
            <ProjectDetail
              lead={selectedLead}
              teamMembers={teamMembers}
              updateLead={updateLead}
              setSelectedLead={setSelectedLead}
              noteAuthor={noteAuthor}
              setNoteAuthor={setNoteAuthor}
              noteBody={noteBody}
              setNoteBody={setNoteBody}
              addInternalNote={addInternalNote}
              t={t}
            />
          ) : null}
        </>
      )}
    </Card>
  );
}

function ProjectDetail({
  lead,
  teamMembers,
  updateLead,
  setSelectedLead,
  noteAuthor,
  setNoteAuthor,
  noteBody,
  setNoteBody,
  addInternalNote,
  t
}: {
  lead: Lead;
  teamMembers: TeamMember[];
  updateLead: (lead: Lead, label?: string) => void;
  setSelectedLead: (lead: Lead | null) => void;
  noteAuthor: string;
  setNoteAuthor: (value: string) => void;
  noteBody: string;
  setNoteBody: (value: string) => void;
  addInternalNote: (lead: Lead) => void;
  t: (value: string) => string;
}) {
  const owner = teamMembers.find((member) => member.id === (lead.ownerId || "unassigned"));

  return (
    <div className="mt-5 rounded-lg border border-[#e8ebef] bg-white p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs text-[#69707d]">{shortId(lead.id)}</p>
          <h2 className="text-lg font-semibold">{t("Submission Details")}</h2>
        </div>
        <Button variant="ghost" className="min-h-9 px-3" onClick={() => setSelectedLead(null)}>{t("Close")}</Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DetailPanel title={t("Customer Information")}>
          <DetailRow label="Customer Name" value={lead.customerName || "-"} />
          <DetailRow label="Company" value={lead.company || "-"} />
          <DetailRow label="Email" value={lead.email || "-"} />
          <DetailRow label="Country" value={lead.country || "-"} />
        </DetailPanel>
        <DetailPanel title={t("Project Information")}>
          <DetailRow label={t("Product Idea")} value={lead.productIdea || "-"} />
          <DetailRow label={t("Design Type")} value={lead.designType || "-"} />
          <DetailRow label={t("Quantity")} value={lead.quantity || "-"} />
          <DetailRow label={t("Budget")} value={lead.budget || "-"} />
          <DetailRow label={t("Timeline")} value={lead.timeline || "-"} />
          <DetailRow label={t("Sample")} value={lead.sampleRequirement || "-"} />
          <DetailRow label={t("Additional Requirements")} value={lead.additionalRequirements || "-"} />
        </DetailPanel>
        <DetailPanel title={t("Assigned Owner")}>
          <div className="flex items-center gap-3">
            <Avatar member={owner} />
            <div>
              <p className="font-medium">{owner?.name || t("Unassigned")}</p>
              <p className="text-xs text-[#69707d]">{owner?.role || "Internal TYORA team"}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label={t("Last Contact Date")}>
              <Input type="date" value={lead.lastContactDate || ""} onChange={(event) => updateLead({ ...lead, lastContactDate: event.target.value }, "Customer Contacted")} />
            </Field>
            <Field label={t("Next Follow-up Date")}>
              <Input type="date" value={lead.nextFollowUpDate || ""} onChange={(event) => updateLead({ ...lead, nextFollowUpDate: event.target.value }, "Follow-up Scheduled")} />
            </Field>
          </div>
        </DetailPanel>
        <DetailPanel title={t("Uploaded Files")}>
          {(lead.uploadedFiles?.length ? lead.uploadedFiles : lead.uploadedFile ? [lead.uploadedFile] : []).length ? (
            <div className="space-y-2">
              {(lead.uploadedFiles?.length ? lead.uploadedFiles : [lead.uploadedFile || ""]).filter(Boolean).map((file, index) => (
                <a key={`${file}-${index}`} href={file} target="_blank" className="block rounded-lg border border-[#e8ebef] px-3 py-2 text-sm hover:bg-[#f5f6f8]">
                  {file}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#69707d]">No files uploaded.</p>
          )}
        </DetailPanel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <DetailPanel title={t("Internal notes")}>
          <div className="space-y-3">
            {(lead.internalNoteEntries || []).map((note) => (
              <div key={note.id} className="rounded-lg bg-[#fbfbfc] p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-[#69707d]">
                  <span>{formatDateTime(note.createdAt)}</span>
                  <span>{note.author}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{note.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            <Field label={t("Author")}>
              <Input value={noteAuthor} onChange={(event) => setNoteAuthor(event.target.value)} />
            </Field>
            <Field label={t("Note content")}>
              <Textarea value={noteBody} onChange={(event) => setNoteBody(event.target.value)} />
            </Field>
            <Button className="w-fit" onClick={() => addInternalNote(lead)}>{t("Add Internal Note")}</Button>
          </div>
        </DetailPanel>
        <DetailPanel title={t("Project Timeline")}>
          <div className="space-y-3">
            {(lead.statusHistory || []).map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-[#101216]" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-[#69707d]">{formatDateTime(item.createdAt)} · {item.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </DetailPanel>
      </div>
    </div>
  );
}

function TeamSettings({
  teamMembers,
  persistTeamMembers,
  t
}: {
  teamMembers: TeamMember[];
  persistTeamMembers: (members: TeamMember[]) => void;
  t: (value: string) => string;
}) {
  function updateMember(idValue: string, patch: Partial<TeamMember>) {
    persistTeamMembers(teamMembers.map((member) => member.id === idValue ? { ...member, ...patch } : member));
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{t("Team Settings")}</h2>
        <Button variant="outline" className="min-h-9 px-3" onClick={() => persistTeamMembers([...teamMembers, {
          id: id("member"),
          name: "New Member",
          avatar: "N",
          email: "new@tyora.co",
          role: "Project Manager",
          active: true
        }])}>
          <Plus size={15} /> {t("Add Team Member")}
        </Button>
      </div>
      <div className="grid gap-4">
        {teamMembers.map((member) => (
          <div key={member.id} className="rounded-lg border border-[#e8ebef] bg-white p-4">
            <div className="mb-4 flex items-center gap-3">
              <Avatar member={member} />
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-[#69707d]">{member.role} · {member.active ? t("Active") : t("Inactive")}</p>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_160px_130px_110px]">
              <Field label="Name">
                <Input value={member.name} onChange={(event) => updateMember(member.id, { name: event.target.value, avatar: event.target.value.slice(0, 1).toUpperCase() || member.avatar })} />
              </Field>
              <Field label="Email">
                <Input value={member.email} onChange={(event) => updateMember(member.id, { email: event.target.value })} />
              </Field>
              <Field label={t("Role")}>
                <select className="min-h-11 w-full rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm" value={member.role} onChange={(event) => updateMember(member.id, { role: event.target.value as TeamMember["role"] })}>
                  {["Admin", "Project Manager", "Viewer"].map((role) => <option key={role} value={role}>{t(role)}</option>)}
                </select>
              </Field>
              <Field label="Avatar">
                <Input value={member.avatar} onChange={(event) => updateMember(member.id, { avatar: event.target.value })} />
              </Field>
              <Field label="Status">
                <Button variant="outline" className="w-full" onClick={() => updateMember(member.id, { active: !member.active })}>
                  {member.active ? t("Disable") : t("Enable")}
                </Button>
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewCard({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: number; tone?: "default" | "orange" }) {
  return (
    <div className={`rounded-lg border p-4 ${tone === "orange" ? "border-[#fed7aa] bg-[#fff7ed]" : "border-[#e8ebef] bg-white"}`}>
      <div className="mb-3 flex items-center justify-between text-[#69707d]">
        {icon}
        <Clock size={15} />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-[#69707d]">{label}</p>
    </div>
  );
}

function DetailPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#e8ebef] p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="font-medium">{label}:</span> <span className="text-[#59616e]">{value}</span>
    </p>
  );
}

function Avatar({ member }: { member?: TeamMember }) {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#101216] text-xs font-semibold text-white">
      {member?.avatar || "U"}
    </span>
  );
}

function StatusBadge({ status, t }: { status: LeadStatus; t: (value: string) => string }) {
  const className = {
    New: "bg-[#eef2ff] text-[#3730a3]",
    Contacted: "bg-[#eff6ff] text-[#1d4ed8]",
    Quoting: "bg-[#fef9c3] text-[#854d0e]",
    "Sample Stage": "bg-[#f5f3ff] text-[#6d28d9]",
    Production: "bg-[#ecfdf5] text-[#047857]",
    Shipment: "bg-[#f0fdfa] text-[#0f766e]",
    Completed: "bg-[#dcfce7] text-[#166534]",
    Lost: "bg-[#fee2e2] text-[#991b1b]"
  }[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{t(status)}</span>;
}

function PriorityBadge({ priority, t }: { priority: LeadPriority; t: (value: string) => string }) {
  const className = {
    Low: "bg-[#f3f4f6] text-[#4b5563]",
    Medium: "bg-[#eff6ff] text-[#1d4ed8]",
    High: "bg-[#fef3c7] text-[#92400e]",
    Urgent: "bg-[#fee2e2] text-[#991b1b]"
  }[priority];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{t(priority)}</span>;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function isFollowUpOverdue(lead: Lead) {
  if (!lead.nextFollowUpDate || ["Completed", "Lost"].includes(lead.status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${lead.nextFollowUpDate}T00:00:00`).getTime() < today.getTime();
}

function ownerName(ownerId: string, members: TeamMember[]) {
  return members.find((member) => member.id === ownerId)?.name || "Unassigned";
}

function statusTimelineLabel(status: LeadStatus) {
  const labels: Record<LeadStatus, string> = {
    New: "Project Submitted",
    Contacted: "Customer Contacted",
    Quoting: "Quotation Sent",
    "Sample Stage": "Prototype Started",
    Production: "Production Started",
    Shipment: "Shipment Started",
    Completed: "Shipment Completed",
    Lost: "Project Lost"
  };
  return labels[status];
}

function shortId(value: string) {
  return value.slice(0, 12);
}

function formatDateTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function viewButtonClass(active: boolean) {
  return `inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium ${active ? "bg-[#101216] text-white" : "text-[#59616e] hover:bg-[#f5f6f8]"}`;
}

function EditableCards({
  title,
  cards,
  onChange,
  t = (value: string) => value
}: {
  title: string;
  cards: Array<{ title: string; description: string }>;
  onChange: (cards: Array<{ title: string; description: string }>) => void;
  t?: (value: string) => string;
}) {
  return (
    <div className="rounded-lg border border-[#e8ebef] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Button variant="outline" className="min-h-9 px-3" onClick={() => onChange([...cards, { title: t("New Item"), description: "" }])}>
          <Plus size={15} /> {t("Add")}
        </Button>
      </div>
      <div className="space-y-4">
        {cards.map((card, index) => (
          <div key={`${card.title}-${index}`} className="rounded-lg bg-[#fbfbfc] p-3">
            <div className="grid gap-3">
              <Input value={card.title} onChange={(event) => onChange(cards.map((item, i) => i === index ? { ...item, title: event.target.value } : item))} />
              <Textarea value={card.description} onChange={(event) => onChange(cards.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} />
              <div className="flex gap-2">
                <Button variant="outline" className="min-h-9 px-3" onClick={() => index > 0 && onChange(cards.map((item, i) => i === index - 1 ? cards[index] : i === index ? cards[index - 1] : item))}>{t("Up")}</Button>
                <Button variant="outline" className="min-h-9 px-3" onClick={() => index < cards.length - 1 && onChange(cards.map((item, i) => i === index + 1 ? cards[index] : i === index ? cards[index + 1] : item))}>{t("Down")}</Button>
                <Button variant="ghost" className="min-h-9 px-3" onClick={() => window.confirm(t("Delete this item?")) && onChange(cards.filter((_, i) => i !== index))}>
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseStudiesEditor({
  content,
  media,
  addMedia,
  updateContent,
  t = (value: string) => value
}: {
  content: SiteContent;
  media: MediaAsset[];
  addMedia: (file: File) => Promise<MediaAsset | undefined>;
  updateContent: <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => void;
  t?: (value: string) => string;
}) {
  function updateCase(index: number, patch: Partial<CaseStudy>) {
    updateContent("cases", content.cases.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("Case Studies")}</h1>
        <Button onClick={() => updateContent("cases", [...content.cases, {
          id: id("case"),
          name: "New Project",
          slug: "new-project",
          status: "Concept",
          country: "",
          category: "",
          shortDescription: "",
          concept: "Concept",
          prototype: "Prototype",
          final: "Final Product",
          conceptImage: "",
          prototypeImage: "",
          finalImage: "",
          visible: true,
          order: content.cases.length + 1
        }])}>
          <Plus size={16} /> {t("Add Case Study")}
        </Button>
      </div>
      <div className="space-y-5">
        {content.cases.map((story, index) => (
          <div key={story.id} className="rounded-lg border border-[#e8ebef] bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">{story.name}</h2>
              <div className="flex gap-2">
                <Button variant="outline" className="min-h-9 px-3" onClick={() => updateCase(index, { visible: !story.visible })}>
                  {story.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                  {story.visible ? t("Visible") : t("Hidden")}
                </Button>
                <Button variant="outline" className="min-h-9 px-3" onClick={() => index > 0 && updateContent("cases", content.cases.map((item, i) => i === index - 1 ? content.cases[index] : i === index ? content.cases[index - 1] : item).map((item, i) => ({ ...item, order: i + 1 })))}>
                  {t("Up")}
                </Button>
                <Button variant="outline" className="min-h-9 px-3" onClick={() => index < content.cases.length - 1 && updateContent("cases", content.cases.map((item, i) => i === index + 1 ? content.cases[index] : i === index ? content.cases[index + 1] : item).map((item, i) => ({ ...item, order: i + 1 })))}>
                  {t("Down")}
                </Button>
                <Button variant="ghost" className="min-h-9 px-3" onClick={() => window.confirm(t("Delete this case study?")) && updateContent("cases", content.cases.filter((_, i) => i !== index))}>
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label={t("Project Name")}><Input value={story.name} onChange={(event) => updateCase(index, { name: event.target.value })} /></Field>
              <Field label={t("Slug")}><Input value={story.slug} onChange={(event) => updateCase(index, { slug: event.target.value })} /></Field>
              <Field label={t("Status")}>
                <select className="min-h-11 w-full rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm" value={story.status} onChange={(event) => updateCase(index, { status: event.target.value as CaseStudyStatus })}>
                  {caseStatuses.map((status) => <option key={status} value={status}>{t(status)}</option>)}
                </select>
              </Field>
              <Field label={t("Country")}><Input value={story.country} onChange={(event) => updateCase(index, { country: event.target.value })} /></Field>
              <Field label={t("Category")}><Input value={story.category} onChange={(event) => updateCase(index, { category: event.target.value })} /></Field>
              <Field label={t("Display Order")}><Input type="number" value={story.order} onChange={(event) => updateCase(index, { order: Number(event.target.value) })} /></Field>
              <Field label={t("Short Description")}><Textarea value={story.shortDescription} onChange={(event) => updateCase(index, { shortDescription: event.target.value })} /></Field>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <MediaUploader label={t("Concept Image")} value={story.conceptImage} media={media} allowed={["image"]} onUpload={addMedia} onChange={(url) => updateCase(index, { conceptImage: url })} onDelete={() => updateCase(index, { conceptImage: "" })} t={t} />
              <MediaUploader label={t("Prototype Image")} value={story.prototypeImage} media={media} allowed={["image"]} onUpload={addMedia} onChange={(url) => updateCase(index, { prototypeImage: url })} onDelete={() => updateCase(index, { prototypeImage: "" })} t={t} />
              <MediaUploader label={t("Final Product Image")} value={story.finalImage} media={media} allowed={["image"]} onUpload={addMedia} onChange={(url) => updateCase(index, { finalImage: url })} onDelete={() => updateCase(index, { finalImage: "" })} t={t} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PricingEditor({
  content,
  updateContent,
  t = (value: string) => value
}: {
  content: SiteContent;
  updateContent: <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => void;
  t?: (value: string) => string;
}) {
  function updatePlan(index: number, patch: Partial<PricingPlan>) {
    updateContent("pricing", content.pricing.map((plan, i) => i === index ? { ...plan, ...patch } : plan));
  }

  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("Pricing")}</h1>
        <Button onClick={() => updateContent("pricing", [...content.pricing, {
          id: id("plan"),
          name: t("New Plan"),
          price: "$0",
          features: [t("Feature")],
          note: "",
          ctaText: t("Get Started"),
          visible: true,
          order: content.pricing.length + 1
        }])}>
          <Plus size={16} /> {t("Add Plan")}
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label={t("Section Title")}><Input value={content.pricingTitle} onChange={(event) => updateContent("pricingTitle", event.target.value)} /></Field>
        <Field label={t("Section Subtitle")}><Input value={content.pricingSubtitle} onChange={(event) => updateContent("pricingSubtitle", event.target.value)} /></Field>
        <Field label={t("Proof Line 1")}><Input value={content.pricingProofA} onChange={(event) => updateContent("pricingProofA", event.target.value)} /></Field>
        <Field label={t("Proof Line 2")}><Input value={content.pricingProofB} onChange={(event) => updateContent("pricingProofB", event.target.value)} /></Field>
      </div>
      <div className="mt-5 space-y-5">
        {content.pricing.map((plan, index) => (
          <div key={plan.id} className="rounded-lg border border-[#e8ebef] bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">{plan.name}</h2>
              <div className="flex gap-2">
                <Button variant="outline" className="min-h-9 px-3" onClick={() => updatePlan(index, { visible: !plan.visible })}>
                  {plan.visible ? t("Visible") : t("Hidden")}
                </Button>
                <Button variant="outline" className="min-h-9 px-3" onClick={() => index > 0 && updateContent("pricing", content.pricing.map((item, i) => i === index - 1 ? content.pricing[index] : i === index ? content.pricing[index - 1] : item).map((item, i) => ({ ...item, order: i + 1 })))}>
                  {t("Up")}
                </Button>
                <Button variant="outline" className="min-h-9 px-3" onClick={() => index < content.pricing.length - 1 && updateContent("pricing", content.pricing.map((item, i) => i === index + 1 ? content.pricing[index] : i === index ? content.pricing[index + 1] : item).map((item, i) => ({ ...item, order: i + 1 })))}>
                  {t("Down")}
                </Button>
                <Button variant="ghost" className="min-h-9 px-3" onClick={() => window.confirm(t("Delete this plan?")) && updateContent("pricing", content.pricing.filter((_, i) => i !== index))}>
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label={t("Plan Name")}><Input value={plan.name} onChange={(event) => updatePlan(index, { name: event.target.value })} /></Field>
              <Field label={t("Price")}><Input value={plan.price} onChange={(event) => updatePlan(index, { price: event.target.value })} /></Field>
              <Field label={t("CTA Text")}><Input value={plan.ctaText} onChange={(event) => updatePlan(index, { ctaText: event.target.value })} /></Field>
              <Field label={t("Display Order")}><Input type="number" value={plan.order} onChange={(event) => updatePlan(index, { order: Number(event.target.value) })} /></Field>
              <Field label={t("Features, one per line")}><Textarea value={plan.features.join("\n")} onChange={(event) => updatePlan(index, { features: event.target.value.split("\n").filter(Boolean) })} /></Field>
              <Field label={t("Note")}><Textarea value={plan.note || ""} onChange={(event) => updatePlan(index, { note: event.target.value })} /></Field>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
