"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import CmsImageField from "@/components/admin/cms-image-field";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  defaultContent,
  EditableCard,
  HomepageCampaign,
  HomepageCategory,
  HomepageContent,
  HomepageLink,
  HomepagePath,
  MediaAsset
} from "@/lib/storage";

type HomepageContentEditorProps = {
  value: HomepageContent;
  media: MediaAsset[];
  onUpload: (file: File) => Promise<MediaAsset | undefined>;
  onChange: (value: HomepageContent) => void;
};

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[#344054]">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#e4e7ec] pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold text-[#101828]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#667085]">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ItemShell({
  title,
  meta,
  onDelete,
  children
}: {
  title: string;
  meta: string;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-[#e4e7ec] bg-[#f8fafc]" open>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span>
          <span className="block text-sm font-semibold text-[#101828]">{title || "Untitled item"}</span>
          <span className="block text-xs text-[#667085]">{meta}</span>
        </span>
        <span className="flex items-center gap-2">
          <Button type="button" variant="ghost" className="min-h-10 px-3 text-[#b42318]" onClick={(event) => { event.preventDefault(); onDelete(); }} title="Delete item">
            <Trash2 size={15} />
          </Button>
          <ChevronDown size={17} className="transition group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      <div className="border-t border-[#e4e7ec] bg-white p-4">{children}</div>
    </details>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-medium text-[#344054]">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4" />
    </label>
  );
}

export default function HomepageContentEditor({ value, media, onUpload, onChange }: HomepageContentEditorProps) {
  function patch(next: Partial<HomepageContent>) {
    onChange({ ...value, ...next });
  }

  function updateCampaign(index: number, next: Partial<HomepageCampaign>) {
    patch({ campaigns: value.campaigns.map((campaign, itemIndex) => itemIndex === index ? { ...campaign, ...next } : campaign) });
  }

  function updateNavigation(index: number, next: Partial<HomepageLink>) {
    patch({ navigationLinks: value.navigationLinks.map((link, itemIndex) => itemIndex === index ? { ...link, ...next } : link) });
  }

  function updatePath(index: number, next: Partial<HomepagePath>) {
    patch({ paths: value.paths.map((path, itemIndex) => itemIndex === index ? { ...path, ...next } : path) });
  }

  function updateCategory(index: number, next: Partial<HomepageCategory>) {
    patch({ categories: value.categories.map((category, itemIndex) => itemIndex === index ? { ...category, ...next } : category) });
  }

  return (
    <div className="space-y-8">
      <Section title="Homepage navigation" description="Public navigation labels, routes, visibility, and order are managed here. TYORA itself always remains untranslated.">
        <div className="grid gap-3 lg:grid-cols-2">
          {value.navigationLinks.map((link, index) => (
            <div key={link.id} className="grid gap-3 rounded-lg border border-[#e4e7ec] bg-white p-4 sm:grid-cols-[1fr_1fr_90px_auto]">
              <Field label="Label"><Input value={link.label} onChange={(event) => updateNavigation(index, { label: event.target.value })} /></Field>
              <Field label="Route"><Input value={link.href} onChange={(event) => updateNavigation(index, { href: event.target.value })} /></Field>
              <Field label="Order"><Input type="number" min={1} max={99} value={link.order} onChange={(event) => updateNavigation(index, { order: Number(event.target.value) })} /></Field>
              <div className="flex items-end gap-2">
                <Toggle label="Visible" checked={link.visible} onChange={(visible) => updateNavigation(index, { visible })} />
                <Button type="button" variant="ghost" className="min-h-11 px-3 text-[#b42318]" title="Delete navigation item" onClick={() => patch({ navigationLinks: value.navigationLinks.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={15} /></Button>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => patch({ navigationLinks: [...value.navigationLinks, { id: id("nav"), label: "New link", href: "/", visible: false, order: value.navigationLinks.length + 1 }] })}>
          <Plus size={16} /> Add Navigation Link
        </Button>
      </Section>

      <Section title="Featured campaigns" description="The first visible campaign becomes the homepage hero. Campaign claims, images, labels, CTAs, and order are all editable here.">
        <div className="space-y-3">
          {value.campaigns.map((campaign, index) => (
            <ItemShell key={campaign.id} title={campaign.title} meta={`Campaign · order ${campaign.order}`} onDelete={() => patch({ campaigns: value.campaigns.filter((_, itemIndex) => itemIndex !== index) })}>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Eyebrow"><Input value={campaign.eyebrow} onChange={(event) => updateCampaign(index, { eyebrow: event.target.value })} /></Field>
                <Field label="Badge"><Input value={campaign.badge} onChange={(event) => updateCampaign(index, { badge: event.target.value })} /></Field>
                <Field label="Headline"><Textarea value={campaign.title} onChange={(event) => updateCampaign(index, { title: event.target.value })} /></Field>
                <Field label="Description"><Textarea value={campaign.description} onChange={(event) => updateCampaign(index, { description: event.target.value })} /></Field>
                <Field label="Primary CTA"><Input value={campaign.primaryCtaText} onChange={(event) => updateCampaign(index, { primaryCtaText: event.target.value })} /></Field>
                <Field label="Primary CTA route"><Input value={campaign.primaryCtaHref} onChange={(event) => updateCampaign(index, { primaryCtaHref: event.target.value })} /></Field>
                <Field label="Secondary CTA"><Input value={campaign.secondaryCtaText} onChange={(event) => updateCampaign(index, { secondaryCtaText: event.target.value })} /></Field>
                <Field label="Secondary CTA route"><Input value={campaign.secondaryCtaHref} onChange={(event) => updateCampaign(index, { secondaryCtaHref: event.target.value })} /></Field>
                <Field label="Visual disclosure"><Input value={campaign.disclosure} onChange={(event) => updateCampaign(index, { disclosure: event.target.value })} /></Field>
                <Field label="Display order"><Input type="number" min={1} max={99} value={campaign.order} onChange={(event) => updateCampaign(index, { order: Number(event.target.value) })} /></Field>
                <Toggle label="Visible" checked={campaign.visible} onChange={(visible) => updateCampaign(index, { visible })} />
              </div>
              <div className="mt-4">
                <CmsImageField label="Campaign visual" value={campaign.image} defaultValue={defaultContent.homepage.campaigns[0].image} media={media} onUpload={onUpload} onChange={(image) => updateCampaign(index, { image })} />
              </div>
            </ItemShell>
          ))}
        </div>
        <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => patch({ campaigns: [...value.campaigns, { ...defaultContent.homepage.campaigns[0], id: id("campaign"), title: "New campaign", visible: false, order: value.campaigns.length + 1 }] })}>
          <Plus size={16} /> Add Campaign
        </Button>
      </Section>

      <Section title="Assessment summary" description="Keep the homepage concise. Detailed estimate rules remain on dedicated service pages.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Eyebrow"><Input value={value.assessmentEyebrow} onChange={(event) => patch({ assessmentEyebrow: event.target.value })} /></Field>
          <Field label="Title"><Input value={value.assessmentTitle} onChange={(event) => patch({ assessmentTitle: event.target.value })} /></Field>
          <Field label="Description"><Textarea value={value.assessmentDescription} onChange={(event) => patch({ assessmentDescription: event.target.value })} /></Field>
          <Field label="Assessment points, one per line"><Textarea value={value.assessmentPoints.join("\n")} onChange={(event) => patch({ assessmentPoints: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} /></Field>
        </div>
      </Section>

      <Section title="Community and TYORA cases" description="Only real eligible public ideas are loaded from the database. CMS cases remain available when there are no public posts.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Eyebrow"><Input value={value.communityEyebrow} onChange={(event) => patch({ communityEyebrow: event.target.value })} /></Field>
          <Field label="Title"><Input value={value.communityTitle} onChange={(event) => patch({ communityTitle: event.target.value })} /></Field>
          <Field label="Description"><Textarea value={value.communityDescription} onChange={(event) => patch({ communityDescription: event.target.value })} /></Field>
          <Field label="Browse CTA"><Input value={value.communityCtaText} onChange={(event) => patch({ communityCtaText: event.target.value })} /></Field>
          <Field label="Browse CTA route"><Input value={value.communityCtaHref} onChange={(event) => patch({ communityCtaHref: event.target.value })} /></Field>
          <Field label="Maximum public ideas"><Input type="number" min={1} max={12} value={value.communityLimit} onChange={(event) => patch({ communityLimit: Number(event.target.value) })} /></Field>
          <Field label="Maximum TYORA cases"><Input type="number" min={1} max={12} value={value.caseLimit} onChange={(event) => patch({ caseLimit: Number(event.target.value) })} /></Field>
          <Field label="Minimum engagement score"><Input type="number" min={0} max={10000} value={value.communityMinimumScore} onChange={(event) => patch({ communityMinimumScore: Number(event.target.value) })} /></Field>
          <Field label="Empty title"><Input value={value.communityEmptyTitle} onChange={(event) => patch({ communityEmptyTitle: event.target.value })} /></Field>
          <Field label="Empty description"><Textarea value={value.communityEmptyBody} onChange={(event) => patch({ communityEmptyBody: event.target.value })} /></Field>
        </div>
      </Section>

      <Section title="Three customer paths" description="Labels, descriptions, routes, icons, visibility, and order are managed here.">
        <div className="grid gap-3 lg:grid-cols-3">
          {value.paths.map((path, index) => (
            <div key={path.id} className="rounded-lg border border-[#e4e7ec] bg-white p-4">
              <div className="grid gap-3">
                <Field label="Title"><Input value={path.title} onChange={(event) => updatePath(index, { title: event.target.value })} /></Field>
                <Field label="Description"><Textarea value={path.description} onChange={(event) => updatePath(index, { description: event.target.value })} /></Field>
                <Field label="CTA"><Input value={path.ctaText} onChange={(event) => updatePath(index, { ctaText: event.target.value })} /></Field>
                <Field label="Route"><Input value={path.href} onChange={(event) => updatePath(index, { href: event.target.value })} /></Field>
                <Field label="Icon"><select className="min-h-11 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm" value={path.icon} onChange={(event) => updatePath(index, { icon: event.target.value as HomepagePath["icon"] })}><option value="idea">Idea</option><option value="source">Source</option><option value="custom">Custom</option></select></Field>
                <Field label="Order"><Input type="number" min={1} max={99} value={path.order} onChange={(event) => updatePath(index, { order: Number(event.target.value) })} /></Field>
                <Toggle label="Visible" checked={path.visible} onChange={(visible) => updatePath(index, { visible })} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Product categories" description="These are CMS records, not page constants. Hide, rename, reorder, or replace their visuals here.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Section title"><Input value={value.categoriesTitle} onChange={(event) => patch({ categoriesTitle: event.target.value })} /></Field>
          <Field label="Supporting note"><Input value={value.categoriesNote} onChange={(event) => patch({ categoriesNote: event.target.value })} /></Field>
        </div>
        <div className="mt-4 space-y-3">
          {value.categories.map((category, index) => (
            <ItemShell key={category.id} title={category.name} meta={`Category · order ${category.order}`} onDelete={() => patch({ categories: value.categories.filter((_, itemIndex) => itemIndex !== index) })}>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Name"><Input value={category.name} onChange={(event) => updateCategory(index, { name: event.target.value })} /></Field>
                <Field label="Route"><Input value={category.href} onChange={(event) => updateCategory(index, { href: event.target.value })} /></Field>
                <Field label="Description"><Textarea value={category.description} onChange={(event) => updateCategory(index, { description: event.target.value })} /></Field>
                <Field label="Display order"><Input type="number" min={1} max={99} value={category.order} onChange={(event) => updateCategory(index, { order: Number(event.target.value) })} /></Field>
                <Toggle label="Visible" checked={category.visible} onChange={(visible) => updateCategory(index, { visible })} />
              </div>
              <div className="mt-4">
                <CmsImageField label={`${category.name || "Category"} image`} value={category.image} defaultValue={defaultContent.homepage.categories[0].image} media={media} onUpload={onUpload} onChange={(image) => updateCategory(index, { image })} />
              </div>
            </ItemShell>
          ))}
        </div>
        <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => patch({ categories: [...value.categories, { ...defaultContent.homepage.categories[0], id: id("category"), name: "New category", visible: false, order: value.categories.length + 1 }] })}>
          <Plus size={16} /> Add Category
        </Button>
      </Section>

      <Section title="Source process summary" description="A short homepage summary only. Detailed sourcing terms remain on the Source process page.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Eyebrow"><Input value={value.sourceEyebrow} onChange={(event) => patch({ sourceEyebrow: event.target.value })} /></Field>
          <Field label="Title"><Input value={value.sourceTitle} onChange={(event) => patch({ sourceTitle: event.target.value })} /></Field>
          <Field label="Description"><Textarea value={value.sourceDescription} onChange={(event) => patch({ sourceDescription: event.target.value })} /></Field>
          <Field label="CTA"><Input value={value.sourceCtaText} onChange={(event) => patch({ sourceCtaText: event.target.value })} /></Field>
          <Field label="CTA route"><Input value={value.sourceCtaHref} onChange={(event) => patch({ sourceCtaHref: event.target.value })} /></Field>
        </div>
        <CardList value={value.sourceSteps} onChange={(sourceSteps) => patch({ sourceSteps })} />
      </Section>

      <Section title="Final production CTA" description="The final homepage action stays concise and sends visitors to an existing path.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Eyebrow"><Input value={value.finalEyebrow} onChange={(event) => patch({ finalEyebrow: event.target.value })} /></Field>
          <Field label="Headline"><Input value={value.finalTitle} onChange={(event) => patch({ finalTitle: event.target.value })} /></Field>
          <Field label="Description"><Textarea value={value.finalDescription} onChange={(event) => patch({ finalDescription: event.target.value })} /></Field>
          <Field label="Primary CTA"><Input value={value.finalPrimaryCtaText} onChange={(event) => patch({ finalPrimaryCtaText: event.target.value })} /></Field>
          <Field label="Primary route"><Input value={value.finalPrimaryCtaHref} onChange={(event) => patch({ finalPrimaryCtaHref: event.target.value })} /></Field>
          <Field label="Secondary CTA"><Input value={value.finalSecondaryCtaText} onChange={(event) => patch({ finalSecondaryCtaText: event.target.value })} /></Field>
          <Field label="Secondary route"><Input value={value.finalSecondaryCtaHref} onChange={(event) => patch({ finalSecondaryCtaHref: event.target.value })} /></Field>
        </div>
      </Section>
    </div>
  );
}

function CardList({ value, onChange }: { value: EditableCard[]; onChange: (value: EditableCard[]) => void }) {
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      {value.map((item, index) => (
        <div key={`${item.title}-${index}`} className="rounded-lg border border-[#e4e7ec] bg-white p-3">
          <Field label={`Step ${index + 1}`}><Input value={item.title} onChange={(event) => onChange(value.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry))} /></Field>
          <Field label="Description"><Textarea className="mt-3" value={item.description} onChange={(event) => onChange(value.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: event.target.value } : entry))} /></Field>
        </div>
      ))}
    </div>
  );
}
