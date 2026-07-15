"use client";

import { ImagePlus, RotateCcw, Trash2, Upload } from "lucide-react";
import CmsImage from "@/components/cms-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CmsImageValue, MediaAsset } from "@/lib/storage";

type CmsImageFieldProps = {
  label: string;
  value: CmsImageValue;
  defaultValue: CmsImageValue;
  media: MediaAsset[];
  onUpload: (file: File) => Promise<MediaAsset | undefined>;
  onChange: (value: CmsImageValue) => void;
};

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function eligibleAssets(media: MediaAsset[]) {
  return media.filter((asset) => asset.type === "image" && acceptedImageTypes.includes(asset.mimeType) && !/\.svg(?:$|[?#])/i.test(asset.url));
}

function validateImage(file: File) {
  if (!acceptedImageTypes.includes(file.type)) return "Use JPG, PNG, WebP, or AVIF.";
  if (file.size > 10 * 1024 * 1024) return "Images must be 10MB or smaller.";
  return "";
}

export default function CmsImageField({
  label,
  value,
  defaultValue,
  media,
  onUpload,
  onChange
}: CmsImageFieldProps) {
  const assets = eligibleAssets(media);

  function patch(next: Partial<CmsImageValue>) {
    onChange({ ...value, ...next });
  }

  async function upload(file: File | undefined, target: "desktopUrl" | "mobileUrl") {
    if (!file) return;
    const message = validateImage(file);
    if (message) {
      window.alert(message);
      return;
    }
    const asset = await onUpload(file);
    if (asset) patch({ [target]: asset.url });
  }

  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white p-4" aria-label={label}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#101828]">{label}</h3>
          <p className="mt-1 text-xs text-[#667085]">Desktop and mobile images come from the public CMS media library.</p>
        </div>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={value.visible} onChange={(event) => patch({ visible: event.target.checked })} className="size-4" />
          Visible
        </label>
      </div>

      <CmsImage
        image={value}
        fallbackAlt={`${label} preview`}
        sizes="(max-width: 640px) 100vw, 520px"
        className="mt-4 aspect-[16/9] w-full rounded-lg border border-[#e4e7ec]"
      />

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ImageSourceControl
          title="Desktop image"
          value={value.desktopUrl}
          assets={assets}
          onSelect={(desktopUrl) => patch({ desktopUrl })}
          onUpload={(file) => void upload(file, "desktopUrl")}
          onRemove={() => patch({ desktopUrl: "" })}
        />
        <ImageSourceControl
          title="Mobile image"
          value={value.mobileUrl}
          assets={assets}
          onSelect={(mobileUrl) => patch({ mobileUrl })}
          onUpload={(file) => void upload(file, "mobileUrl")}
          onRemove={() => patch({ mobileUrl: "" })}
          optional
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px]">
        <label className="text-sm font-medium text-[#344054]">
          Alt text
          <Input className="mt-2" value={value.alt} onChange={(event) => patch({ alt: event.target.value })} placeholder="Describe the image for accessibility" />
        </label>
        <label className="text-sm font-medium text-[#344054]">
          Object position
          <Input className="mt-2" value={value.objectPosition} onChange={(event) => patch({ objectPosition: event.target.value })} placeholder="center center" />
        </label>
      </div>

      <Button type="button" variant="outline" className="mt-4 min-h-11" onClick={() => onChange({ ...defaultValue })}>
        <RotateCcw size={16} /> Restore Default
      </Button>
    </section>
  );
}

function ImageSourceControl({
  title,
  value,
  assets,
  onSelect,
  onUpload,
  onRemove,
  optional = false
}: {
  title: string;
  value: string;
  assets: MediaAsset[];
  onSelect: (url: string) => void;
  onUpload: (file?: File) => void;
  onRemove: () => void;
  optional?: boolean;
}) {
  return (
    <div className="rounded-lg bg-[#f8fafc] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#344054]">{title}</p>
        {optional ? <span className="text-xs text-[#667085]">Optional</span> : null}
      </div>
      <select className="mt-2 min-h-11 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm" value={assets.some((asset) => asset.url === value) ? value : ""} onChange={(event) => onSelect(event.target.value)}>
        <option value="">Select from Media Library</option>
        {assets.map((asset) => <option key={asset.id} value={asset.url}>{asset.name}</option>)}
      </select>
      <div className="mt-2 flex gap-2">
        <label className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-semibold hover:bg-[#f2f4f7]">
          <Upload size={15} /> {value ? "Replace" : "Upload"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(event) => onUpload(event.target.files?.[0])} />
        </label>
        <Button type="button" variant="ghost" className="min-h-11 px-3" onClick={onRemove} disabled={!value} title={`Remove ${title.toLowerCase()}`}>
          {value ? <Trash2 size={16} /> : <ImagePlus size={16} />}
        </Button>
      </div>
    </div>
  );
}
