"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ClipboardCheck,
  FileUp,
  ImageIcon,
  Layers,
  MessageCircle,
  PackageCheck,
  Play,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
  Video,
  Wand2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import {
  defaultContent,
  Lead,
  loadContent,
  saveLead,
  SiteContent,
  uploadProjectFile
} from "@/lib/storage";
import {
  Language,
  localizeContent,
  ui
} from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { normalizeWhatsAppUrl } from "@/lib/whatsapp";
import { trackAnalyticsEvent } from "@/lib/analytics";

const trustBadgeIcons = [Wand2, SearchCheck, ClipboardCheck, ShieldCheck, PackageCheck, Truck];
const journeyIcons = [SearchCheck, ClipboardCheck, Layers, ClipboardCheck, PackageCheck, Truck];
const heroHeadline = "Find the right factory in China — before manufacturing mistakes get expensive.";
const showHomepageVideo = false;

export default function Home() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [language] = useState<Language>("en");
  const [idea, setIdea] = useState("");
  const [productName, setProductName] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAllMobileCases, setShowAllMobileCases] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);

  useEffect(() => {
    void loadContent().then(setContent).catch(() => setContent(defaultContent));
  }, []);

  useEffect(() => {
    trackAnalyticsEvent("page_visit");
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktopViewport(query.matches);
    updateViewport();
    query.addEventListener("change", updateViewport);
    return () => query.removeEventListener("change", updateViewport);
  }, []);

  const t = ui[language];
  const displayContent = useMemo(
    () => localizeContent(content, language),
    [content, language]
  );
  const whatsappUrl = useMemo(
    () => normalizeWhatsAppUrl(displayContent.whatsappLink),
    [displayContent.whatsappLink]
  );
  const visibleCases = displayContent.cases.filter((story) => story.visible);
  const faqItems = [
    {
      question: "Is TYORA a factory?",
      answer:
        "No. TYORA is your product development and manufacturing support partner. We help review the product, plan the manufacturing path, match the right factory, and manage the process when needed."
    },
    {
      question: "Do I need a finished design before contacting TYORA?",
      answer:
        "No. A product name, sketch, AI image, reference product, PDF, or CAD file is enough to start a review."
    },
    {
      question: "Can TYORA help if I am based in the United States?",
      answer:
        "Yes. TYORA is positioned for US product founders who want practical support working with manufacturing partners in China."
    },
    {
      question: "Can I manage the factory myself after the review?",
      answer:
        "Yes. You can start with factory matching and manage communication yourself, or choose full project management if you want TYORA involved through samples, production, quality, and shipping."
    },
    {
      question: "Does TYORA guarantee a factory will produce my product?",
      answer:
        "No responsible partner can guarantee that before review. TYORA helps you understand feasibility, risks, requirements, and the most realistic manufacturing path before you commit."
    },
    {
      question: "How do I start?",
      answer:
        "Enter your product name, upload a reference if you have one, and start the WhatsApp conversation. TYORA will review the project and guide the next step."
    }
  ];

  function openWizard() {
    trackAnalyticsEvent("upload_click");
    setWizardOpen(true);
    setProductName((current) => current || idea);
  }

  async function startWhatsAppChat() {
    if (submitting) return;
    setSubmitting(true);
    trackAnalyticsEvent("whatsapp_click");
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    let uploadedFiles: string[] = [];
    try {
      if (selectedFile) {
        const asset = await uploadProjectFile(selectedFile);
        uploadedFiles = [asset.url];
      }

      const lead: Lead = {
        id: crypto.randomUUID(),
        productIdea: productName || idea || "Product idea not named yet",
        designType: selectedFile ? "Uploaded reference" : "",
        quantity: "",
        budget: "",
        timeline: "",
        sampleRequirement: t.no,
        sampleReview: "",
        additionalRequirements: "",
        uploadedFile: uploadedFiles[0] || fileName,
        uploadedFiles,
        submissionDate: new Date().toISOString(),
        status: "New"
      };

      await saveLead(lead);
      trackAnalyticsEvent("lead_submit_success");
      setWizardOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to submit project.");
    } finally {
      setSubmitting(false);
    }
  }

  const canStartChat = Boolean(productName.trim());
  const supportedUploads = [t.aiImage, t.sketch, t.referenceImage, t.pdf, t.cadSupported];
  return (
    <main className="min-h-screen bg-white text-[#101216]">
      <header className="sticky top-0 z-40 border-b border-[#eef1f4]/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2 font-semibold">
            {displayContent.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayContent.logoImage}
                alt={displayContent.brandName}
                className="size-8 rounded-lg object-cover"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#101216] text-white">
                <Sparkles size={16} />
              </span>
            )}
            <span className="leading-tight">
              {displayContent.brandName}
              <span className="block text-[10px] font-medium uppercase tracking-normal text-[#69707d]">
                Idea2Product
              </span>
            </span>
          </a>
          <div className="flex items-center gap-2">
          <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsEvent("whatsapp_click")}>
            <Button variant="secondary" className="min-h-10">
              <MessageCircle size={16} />
              {t.whatsApp}
            </Button>
          </a>
          </div>
        </div>
      </header>

      <section className="fine-grid border-b border-[#eef1f4]">
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-9 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col justify-center"
          >
            <p className="mb-3 w-fit rounded-full border border-[#dfe4e9] bg-white px-3 py-1 text-xs text-[#69707d] lg:mb-5 lg:text-sm">
              {displayContent.heroTagline}
            </p>
            <div className="lg:hidden">
              <h1 className="max-w-3xl text-[2.65rem] font-semibold leading-[1.04] tracking-normal">
                {heroHeadline}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#59616e]">
                {displayContent.heroSubtitle}
              </p>
            </div>
            {isDesktopViewport ? (
              <div className="hidden lg:block">
                <h1 className="max-w-3xl text-[4.1rem] font-semibold leading-[1.04] tracking-normal xl:text-[4.65rem]">
                  {heroHeadline}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-[#59616e]">
                  {displayContent.heroSubtitle}
                </p>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 lg:hidden">
              <Button variant="secondary" className="min-h-12 w-full" onClick={openWizard}>
                <MessageCircle size={16} /> Start Your Manufacturing Review
              </Button>
              <Button variant="outline" className="min-h-12 w-full" onClick={openWizard}>
                <Upload size={16} /> Upload Your Idea
              </Button>
            </div>

            <div className="soft-shadow mt-6 rounded-[20px] border border-[#e1e5ea] bg-white p-2 transition hover:shadow-xl hover:shadow-[#101216]/5 lg:mt-9 lg:p-3">
              <div className="flex min-h-36 flex-col gap-3 rounded-2xl bg-[#fbfbfc] p-3 lg:min-h-44 lg:gap-4 lg:p-4">
                <Textarea
                  value={idea}
                  onChange={(event) => setIdea(event.target.value)}
                  placeholder={t.productNamePlaceholder}
                  className="min-h-20 border-0 bg-transparent px-0 py-0 text-base shadow-none focus:border-transparent focus:ring-0 lg:min-h-28"
                />
                {!idea.trim() ? (
                  <p className="whitespace-pre-line text-xs leading-5 text-[#8c94a1] lg:text-sm lg:leading-6">
                    {t.heroInputExample}
                  </p>
                ) : null}
                <div className="flex flex-col gap-3 border-t border-[#e8ebef] pt-3 sm:flex-row sm:items-center sm:justify-between lg:pt-4">
                  <div className="flex flex-wrap gap-2 text-xs text-[#69707d]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 ring-1 ring-[#e8ebef]">
                      <ImageIcon size={14} /> {t.image}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 ring-1 ring-[#e8ebef]">
                      <FileUp size={14} /> {t.pdf}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 ring-1 ring-[#e8ebef]">
                      <Layers size={14} /> {t.cad}
                    </span>
                    {fileName ? <span className="px-2 py-2">{fileName}</span> : null}
                  </div>
                  <div className="grid gap-2 sm:flex">
                    <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#e1e5ea] bg-white px-4 text-sm font-medium transition hover:scale-[1.01] hover:bg-[#f5f6f8] lg:min-h-11">
                      <Upload size={16} />
                      {t.uploadDesign}
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/*,.pdf,.step,.stp,.iges,.igs,.obj,.stl,.dwg,.dxf"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          setSelectedFile(file);
                          setFileName(file?.name || "");
                        }}
                      />
                    </label>
                    <Button onClick={openWizard} className="min-h-12 transition hover:scale-[1.01] lg:min-h-11">
                      Start Your Manufacturing Review <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {isDesktopViewport ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="hidden items-center lg:flex"
          >
            <Card className="w-full overflow-hidden soft-shadow transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#101216]/5">
              <div className="border-b border-[#eef1f4] bg-[#fafbfc] px-5 py-4">
                <div className="flex items-center gap-2 text-sm text-[#69707d]">
                  <span className="size-3 rounded-full bg-[#ff6b5f]" />
                  <span className="size-3 rounded-full bg-[#f6c85f]" />
                  <span className="size-3 rounded-full bg-[#5cc785]" />
                  <span className="ml-2">Project Overview</span>
                </div>
              </div>
              <div className="space-y-3 p-5">
                {[
                  ["Founder", "US product founder"],
                  ["Input", "Idea, sketch, AI image, PDF, or CAD"],
                  ["Next Step", "Manufacturing review"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#e8ebef] bg-white p-4">
                    <p className="text-xs uppercase text-[#8c94a1]">{label}</p>
                    <p className="mt-2 font-medium">{value}</p>
                  </div>
                ))}
                <div className="rounded-lg bg-[#101216] p-4 text-white">
                  <p className="text-sm text-white/70">Next Step</p>
                  <p className="mt-2 text-xl font-semibold">Chat With TYORA On WhatsApp</p>
                </div>
              </div>
            </Card>
          </motion.div>
          ) : null}
        </div>
      </section>

      <section className="border-b border-[#eef1f4] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-6">
            {displayContent.trustBadges.map((badge, index) => {
              const Icon = trustBadgeIcons[index % trustBadgeIcons.length];
              return (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.28, delay: index * 0.03 }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#e8ebef] bg-white px-3 text-xs text-[#59616e] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5 lg:min-h-12 lg:text-sm"
                >
                  <Icon size={16} className="shrink-0 text-[#8c94a1]" />
                  <span>{badge}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[#eef1f4] bg-white lg:hidden">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="text-[2rem] font-semibold leading-tight">
            {displayContent.positioningHeadlineA}
            <span className="block">{displayContent.positioningHeadlineB}</span>
          </h2>
          <p className="mt-4 text-base leading-7 text-[#59616e]">{displayContent.positioningText}</p>
          <div className="mt-5 grid gap-2">
            {displayContent.helpCards.slice(0, 3).map((item) => (
              <div key={item.title} className="flex min-h-11 items-center gap-2 rounded-lg border border-[#e8ebef] bg-white px-3 text-sm font-medium text-[#59616e]">
                <Check size={16} className="text-[#0f766e]" />
                {item.title}
              </div>
            ))}
          </div>
        </div>
      </section>

      {showHomepageVideo && isDesktopViewport ? (
      <section className="mx-auto hidden max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid lg:grid-cols-[0.62fr_1.38fr] lg:px-8 lg:py-20">
        <div>
          <h2 className="text-[2.25rem] font-semibold leading-tight">{displayContent.video.title}</h2>
          <p className="mt-4 text-lg leading-8 text-[#59616e]">{displayContent.video.subtitle}</p>
        </div>
        <Card className="overflow-hidden bg-[#101216] text-white">
          <div className="flex min-h-[23rem] flex-col justify-between p-7">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                {t.thirtySecond}
              </span>
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-[#101216]">
                {displayContent.video.videoUrl || displayContent.video.uploadedVideoFile ? <Video size={20} /> : <Play size={20} />}
              </span>
            </div>
            {displayContent.video.sourceType === "upload" && displayContent.video.uploadedVideoFile ? (
              <video
                className="mt-6 aspect-video w-full rounded-lg object-cover"
                src={displayContent.video.uploadedVideoFile}
                poster={displayContent.video.coverImage || undefined}
                controls={!displayContent.video.autoplay}
                autoPlay={displayContent.video.autoplay}
                muted={displayContent.video.muted}
                loop={displayContent.video.loop}
              />
            ) : displayContent.video.videoUrl ? (
              <div className="mt-6 flex aspect-video w-full items-center justify-center rounded-lg bg-white/8 p-6 text-center text-sm text-white/70">
                {displayContent.video.sourceType === "youtube" ? "YouTube" : "Vimeo"}: {displayContent.video.videoUrl}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-6">
                {["Idea", t.supplierMatching, t.prototype, t.production, t.packaging, t.delivery].map(
                  (item) => (
                    <div key={item} className="rounded-lg bg-white/8 px-3 py-3 text-center">
                      {item}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </Card>
      </section>
      ) : null}

      {isDesktopViewport ? (
      <section className="hidden border-y border-[#eef1f4] bg-white lg:block">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-medium text-[#69707d]">TYORA</p>
          <h2 className="mt-4 text-[2.75rem] font-semibold leading-tight tracking-normal sm:text-[3.4rem]">
            {displayContent.positioningHeadlineA}
            <span className="block">{displayContent.positioningHeadlineB}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[#59616e]">
            {displayContent.positioningText}
          </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {displayContent.helpCards.map(({ title, description }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.32, delay: index * 0.04 }}
              >
              <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#59616e]">{description}</p>
              </Card>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Button onClick={openWizard} className="min-h-12 px-5">
              Start Your Manufacturing Review <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>
      ) : null}

      <section className="border-y border-[#eef1f4] bg-[#fbfbfc] lg:hidden">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-5">
            <h2 className="text-[2rem] font-semibold leading-tight">{t.productJourney}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {displayContent.journeySteps.map(({ title }, index) => {
              const Icon = journeyIcons[index % journeyIcons.length];
              return (
              <Card key={title} className="p-4">
                <Icon size={18} className="text-[#101216]" />
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      {isDesktopViewport ? (
      <section className="hidden border-y border-[#eef1f4] bg-[#fbfbfc] lg:block">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-9">
            <h2 className="text-[2.25rem] font-semibold leading-tight">{t.productJourney}</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {[
              ...displayContent.journeySteps
            ].map(
              (step, index) => (
                <Card key={step.title} className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#101216] text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="mt-5 font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#69707d]">
                      {step.description}
                    </p>
                  </div>
                </Card>
              )
            )}
          </div>
        </div>
      </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[2.25rem] font-semibold leading-tight">{t.caseStudies}</h2>
            <p className="mt-2 text-[#59616e]">{t.seeEditable}</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {visibleCases.map((story, index) => (
            <Card key={story.name} className={cn(
              "p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5",
              index >= 3 && !showAllMobileCases ? "hidden lg:block" : ""
            )}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold">{story.name}</h3>
                <span className="rounded-full bg-[#e6f7f4] px-2.5 py-1 text-xs font-medium text-[#0f766e]">
                  {story.status}
                </span>
              </div>
              <div className="grid gap-4">
                {[
                  { label: story.concept, image: story.conceptImage, stage: "concept" },
                  { label: story.prototype, image: story.prototypeImage, stage: "prototype" },
                  { label: story.final, image: story.finalImage, stage: "final" }
                ].map(({ label, image, stage }, itemIndex) => (
                  <div key={label} className="space-y-2">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-lg bg-[#f7f8fa] text-center text-sm font-medium text-[#69707d] ring-1 ring-[#e8ebef]",
                      stage === "final"
                        ? "h-52 sm:h-56 lg:h-60"
                        : stage === "prototype"
                          ? "h-40 sm:h-44 lg:h-48"
                          : "h-44 sm:h-48 lg:h-52"
                    )}
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={label}
                        className="h-[94%] w-[94%] max-w-none rounded-md object-contain"
                      />
                    ) : (
                      label
                    )}
                  </div>
                  {itemIndex < 2 ? (
                    <div className="text-center text-sm leading-none text-[#b2bac5]">↓</div>
                  ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        {visibleCases.length > 3 ? (
          <Button
            variant="outline"
            className="mt-4 min-h-12 w-full lg:hidden"
            onClick={() => setShowAllMobileCases((current) => !current)}
          >
            {showAllMobileCases ? "Show Fewer Projects" : "View More Projects"}
          </Button>
        ) : null}
      </section>

      <section className="border-y border-[#eef1f4] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="text-[2rem] font-semibold leading-tight lg:text-[2.25rem]">{t.trustTitle}</h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-4">
            {t.trustCards.map(([title, description]) => (
              <Card key={title} className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#59616e]">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#eef1f4] bg-[#fbfbfc]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="text-[2rem] font-semibold leading-tight lg:text-[2.25rem]">{displayContent.pricingTitle}</h2>
          <p className="mt-2 text-[#59616e]">{displayContent.pricingSubtitle}</p>
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {displayContent.pricing.filter((plan) => plan.visible).map((plan) => {
              const isPopular = Boolean(plan.badge);
              return (
              <Card key={plan.name} className={cn(
                "relative flex h-full flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5 lg:p-6",
                isPopular ? "border-[#101216] shadow-lg shadow-[#101216]/5" : ""
              )}>
                <div className="flex min-h-7 items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold lg:text-2xl">{plan.name}</h3>
                    {plan.subtitle ? <p className="mt-1 text-sm font-medium text-[#69707d]">{plan.subtitle}</p> : null}
                  </div>
                  {isPopular ? (
                    <span className="rounded-full bg-[#0f766e] px-2.5 py-1 text-xs font-medium text-white">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>
                <div className="mt-5 border-y border-[#eef1f4] py-4">
                  {plan.priceLabel ? <p className="text-sm font-medium text-[#69707d]">{plan.priceLabel}</p> : null}
                  <p className="mt-1 text-2xl font-semibold">{plan.price}</p>
                  {plan.priceSuffix ? (
                    <div className="mt-2 space-y-1 text-sm font-semibold text-[#101216]">
                      {plan.priceSuffix.split("\n").map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
                {plan.description ? (
                  <div className="mt-4 space-y-2 text-sm leading-6 text-[#59616e]">
                    {plan.description.split("\n\n").map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : null}
                {plan.highlightBanner ? (
                  <p className="mt-4 rounded-md bg-[#e7f5f2] px-4 py-3 text-sm font-semibold text-[#0f766e]">
                    {plan.highlightBanner}
                  </p>
                ) : null}
                <p className="mt-5 text-sm font-semibold">Included</p>
                <ul className="mt-3 space-y-2 text-sm text-[#59616e] lg:space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 shrink-0 text-[#0f766e]" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.exclusions && plan.exclusions.length > 0 ? (
                  <>
                    <p className="mt-5 text-sm font-semibold">Not Included</p>
                    <ul className="mt-3 space-y-2 text-sm text-[#59616e] lg:space-y-3">
                      {plan.exclusions.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <X className="mt-0.5 shrink-0 text-[#b42318]" size={16} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {plan.note ? (
                  <div className="mt-5 text-sm text-[#69707d]">
                    {plan.note.split("\n").map((line, index) => (
                      <p key={`${line}-${index}`} className={index === 0 ? "font-semibold text-[#101216]" : "mt-1"}>
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
                {plan.bottomNote ? <p className="mt-auto pt-5 text-sm font-medium text-[#69707d]">{plan.bottomNote}</p> : null}
                <Button onClick={openWizard} className="mt-6 min-h-11 w-full">
                  {plan.ctaText} <ArrowRight size={16} />
                </Button>
              </Card>
              );
            })}
          </div>
          <div className="mt-8 rounded-lg border border-[#e8ebef] bg-white p-5 text-center">
            <p className="font-semibold">{displayContent.pricingProofA}</p>
            <p className="mt-2 text-sm text-[#59616e]">{displayContent.pricingProofB}</p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#eef1f4] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-medium text-[#69707d]">About TYORA</p>
            <h2 className="mt-4 text-[2rem] font-semibold leading-tight lg:text-[2.6rem]">
              {displayContent.founderTitle}
            </h2>
            <p className="mt-5 text-base leading-7 text-[#59616e] lg:text-lg lg:leading-8">
              {displayContent.founderText}
            </p>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsEvent("whatsapp_click")}>
              <Button className="mt-6 min-h-12">
                <MessageCircle size={16} /> Talk To TYORA On WhatsApp
              </Button>
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["For early product ideas", "Bring a rough idea, reference image, or product name. TYORA helps turn it into a practical manufacturing conversation."],
              ["For US launch teams", "Get China manufacturing support without trying to manage every supplier detail alone."],
              ["For risk reduction", "Clarify feasibility, samples, quality checks, timelines, and handoff points before production."],
              ["For practical execution", "Move from review to factory matching, sample coordination, production follow-up, and delivery support."]
            ].map(([title, description]) => (
              <Card key={title} className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#59616e]">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#eef1f4] bg-[#fbfbfc]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-7 max-w-3xl">
            <p className="text-sm font-medium text-[#69707d]">FAQ</p>
            <h2 className="mt-3 text-[2rem] font-semibold leading-tight lg:text-[2.25rem]">
              Questions founders ask before building with TYORA
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {faqItems.map((item) => (
              <Card key={item.question} className="p-5">
                <h3 className="font-semibold">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-[#59616e]">{item.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#eef1f4] bg-[#101216] px-4 py-10 text-white lg:hidden">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-[2rem] font-semibold leading-tight">Ready to Build Your Product?</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/70">
            Let&apos;s turn your idea into a real product.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full max-w-sm" onClick={() => trackAnalyticsEvent("whatsapp_click")}>
            <Button variant="secondary" className="min-h-12 w-full">
              <MessageCircle size={16} /> {t.startWhatsAppChat}
            </Button>
          </a>
        </div>
      </section>

      <footer className="border-t border-[#eef1f4] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#59616e] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#101216]">{displayContent.brandName}</p>
            <p>{displayContent.footerSlogan}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href={`mailto:${displayContent.email}`} onClick={() => trackAnalyticsEvent("email_click")}>{t.email}</a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsEvent("whatsapp_click")}>{t.whatsApp}</a>
            <a href={displayContent.linkedInLink} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsEvent("linkedin_click")}>{t.linkedIn}</a>
          </div>
        </div>
      </footer>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackAnalyticsEvent("whatsapp_click")}
        className="fixed bottom-3 right-3 z-40 hidden min-h-12 items-center gap-2 rounded-full bg-[#0f766e] px-4 text-sm font-medium text-white shadow-2xl shadow-[#0f766e]/20 transition hover:scale-[1.02] sm:bottom-5 sm:right-5 sm:inline-flex sm:px-5"
      >
        <MessageCircle size={18} />
        {t.startWhatsAppChat}
      </a>

      <AnimatePresence>
        {wizardOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-[#101216]/30 p-3 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              className="mx-auto flex h-full max-h-[820px] max-w-3xl flex-col overflow-hidden rounded-2xl bg-white soft-shadow"
            >
              <div className="border-b border-[#eef1f4] p-4">
                <div className="flex items-center justify-between">
                  <button
                    className="rounded-lg p-2 hover:bg-[#f5f6f8]"
                    onClick={() => setWizardOpen(false)}
                    aria-label={t.closeConversation}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <p className="text-sm text-[#69707d]">{t.conversationStart}</p>
                  <div className="w-9" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-medium text-[#69707d]">
                  <span className="rounded-full bg-[#f5f6f8] px-2 py-2">{t.uploadYourIdea}</span>
                  <span className="rounded-full bg-[#f5f6f8] px-2 py-2">{t.productName}</span>
                  <span className="rounded-full bg-[#e6f7f4] px-2 py-2 text-[#0f766e]">{t.whatsApp}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-8">
                <div className="space-y-7">
                  <section className="space-y-4">
                    <div className="flex gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#101216] text-white">
                        <Upload size={16} />
                      </span>
                      <div>
                        <h2 className="text-2xl font-semibold">{t.uploadYourIdea}</h2>
                        <p className="mt-2 text-sm leading-6 text-[#59616e]">{t.uploadIdeaSubtitle}</p>
                      </div>
                    </div>
                    <div className="ml-0 rounded-lg border border-[#e1e5ea] bg-[#fbfbfc] p-4 sm:ml-12">
                      <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#cfd5dd] bg-white px-4 text-sm font-medium transition hover:bg-[#f5f6f8]">
                        <Upload size={16} />
                        {fileName || t.uploadDesign}
                        <input
                          className="sr-only"
                          type="file"
                          accept="image/*,.pdf,.step,.stp,.iges,.igs,.obj,.stl,.dwg,.dxf"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setSelectedFile(file);
                            setFileName(file?.name || "");
                          }}
                        />
                      </label>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#69707d]">
                        {supportedUploads.map((item) => (
                          <span key={item} className="rounded-full bg-white px-3 py-1.5 ring-1 ring-[#e8ebef]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#101216] text-white">
                        <PackageCheck size={16} />
                      </span>
                      <div>
                        <h2 className="text-2xl font-semibold">{t.productName}</h2>
                        <p className="mt-2 text-sm leading-6 text-[#59616e]">{t.productNameSubtitle}</p>
                      </div>
                    </div>
                    <div className="ml-0 sm:ml-12">
                      <Input
                        value={productName}
                        placeholder={t.productNamePlaceholder}
                        onChange={(event) => setProductName(event.target.value)}
                        className="min-h-14 text-base"
                      />
                      {!productName.trim() ? (
                        <p className="mt-3 text-sm text-[#8c94a1]">{t.productNameExample}</p>
                      ) : null}
                    </div>
                  </section>
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-[#eef1f4] p-4">
                <Button onClick={() => void startWhatsAppChat()} disabled={!canStartChat || submitting}>
                  <MessageCircle size={16} />
                  {submitting ? t.saving : t.startWhatsAppChat}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
