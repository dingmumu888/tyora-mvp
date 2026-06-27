"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Calendar,
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
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
  UserCheck,
  Video,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
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
  UiText,
  ui
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

function makePrompts(t: UiText) {
  return [
    t.magneticPrompt,
    t.capybaraPrompt,
    languageSafeKickstarter(t),
    t.petPrompt
  ];
}

function languageSafeKickstarter(t: UiText) {
  return t.language === "EN"
    ? "我想发布一个 Kickstarter 产品..."
    : "I want to launch a Kickstarter product...";
}

const trustBadgeIcons = [Wand2, SearchCheck, ClipboardCheck, ShieldCheck, PackageCheck, Truck];

function makeWizardSteps(t: UiText) {
  return [
  {
    key: "productIdea",
    question: t.manufactureQuestion,
    type: "textarea",
    placeholder: t.manufacturePlaceholder
  },
  {
    key: "designType",
    question: t.doYouHaveDesign,
    options: [
      t.aiGeneratedImage,
      t.sketch,
      t.cadFile,
      t.existingReference,
      t.justIdea
    ]
  },
  {
    key: "quantity",
    question: t.estimatedQuantity,
    options: ["100-500", "500-1000", "1000-5000", "5000+"]
  },
  {
    key: "budget",
    question: t.estimatedBudget,
    options: ["Under $1,000", t.quoteDeposit, "$5,000-$20,000", "$20,000+"]
  },
  {
    key: "timeline",
    question: t.startTimeline,
    options: [t.immediately, t.within30, t.within90, t.researchingOnly]
  },
  {
    key: "sampleRequirement",
    question: t.sampleNeed,
    options: [t.yes, t.no]
  },
  {
    key: "sampleReview",
    question: t.sampleReview,
    options: [t.inspectionVideo, t.liveVideoCall, t.shipSample],
    note: t.internationalCourier
  },
  {
    key: "additionalRequirements",
    question: t.additionalRequirements,
    type: "textarea",
    placeholder: t.additionalRequirementsPlaceholder
  }
  ] as const;
}

type Answers = Record<string, string>;

export default function Home() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [language, setLanguage] = useState<Language>("en");
  const [promptIndex, setPromptIndex] = useState(0);
  const [idea, setIdea] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAllMobileCases, setShowAllMobileCases] = useState(false);

  useEffect(() => {
    void loadContent().then(setContent).catch(() => setContent(defaultContent));
  }, []);

  const t = ui[language];
  const displayContent = useMemo(
    () => localizeContent(content, language),
    [content, language]
  );
  const prompts = useMemo(
    () => displayContent.heroPlaceholders.length ? displayContent.heroPlaceholders : makePrompts(t),
    [displayContent.heroPlaceholders, t]
  );
  const wizardSteps = useMemo(() => makeWizardSteps(t), [t]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPromptIndex((current) => (current + 1) % prompts.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [prompts.length]);

  const activeSteps = useMemo(() => {
    return wizardSteps.filter(
      (step) => step.key !== "sampleReview" || answers.sampleRequirement === t.yes
    );
  }, [answers.sampleRequirement, t.yes, wizardSteps]);

  const currentStep = activeSteps[stepIndex] ?? activeSteps[0];
  const progress = Math.round(((stepIndex + 1) / activeSteps.length) * 100);
  const visibleCases = displayContent.cases.filter((story) => story.visible);
  const mobileJourneySteps = [
    { title: "Idea Review", icon: SearchCheck },
    { title: "Prototype", icon: ClipboardCheck },
    { title: "Production Prep", icon: PackageCheck },
    { title: "Manufacturing", icon: Layers }
  ];

  function openWizard() {
    setWizardOpen(true);
    setSubmitted(false);
    setStepIndex(0);
    setAnswers((current) => ({ ...current, productIdea: current.productIdea || idea }));
  }

  function setAnswer(key: string, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  async function nextStep() {
    if (submitting) return;

    if (stepIndex < activeSteps.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    setSubmitting(true);
    let uploadedFiles: string[] = [];
    try {
      if (selectedFile) {
        const asset = await uploadProjectFile(selectedFile);
        uploadedFiles = [asset.url];
      }

      const lead: Lead = {
        id: crypto.randomUUID(),
        productIdea: answers.productIdea || idea,
        designType: answers.designType || "",
        quantity: answers.quantity || "",
        budget: answers.budget || "",
        timeline: answers.timeline || "",
        sampleRequirement: answers.sampleRequirement || t.no,
        sampleReview: answers.sampleReview,
        additionalRequirements: answers.additionalRequirements || "",
        uploadedFile: uploadedFiles[0] || fileName,
        uploadedFiles,
        submissionDate: new Date().toISOString(),
        status: "New"
      };

      await saveLead(lead);
      setSubmitted(true);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to submit project.");
    } finally {
      setSubmitting(false);
    }
  }

  const canContinue = Boolean(answers[currentStep?.key] || (currentStep?.key === "productIdea" && idea));
  const toggleLanguage = () => {
    const next = language === "en" ? "zh" : "en";
    setLanguage(next);
  };

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
          <Button variant="outline" className="min-h-10 px-3" onClick={toggleLanguage}>
            {t.language}
          </Button>
          <a href={displayContent.whatsappLink} target="_blank" rel="noreferrer">
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
            <h1 className="max-w-3xl text-[2.65rem] font-semibold leading-[1.04] tracking-normal lg:hidden">
              Turn Your Product Idea Into Reality.
            </h1>
            <h1 className="hidden max-w-3xl text-[4.85rem] font-semibold leading-[1.04] tracking-normal lg:block">
              {displayContent.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#59616e] lg:hidden">
              Whether your idea came from ChatGPT, Midjourney, a sketch, or a napkin, we help transform it into a manufacturable product.
            </p>
            <p className="mt-6 hidden max-w-2xl text-lg leading-8 text-[#59616e] lg:block">
              {displayContent.heroSubtitle}
            </p>

            <div className="mt-5 grid gap-3 lg:hidden">
              <a href={displayContent.whatsappLink} target="_blank" rel="noreferrer">
                <Button variant="secondary" className="min-h-12 w-full">
                  <MessageCircle size={16} /> Chat With Us (WhatsApp)
                </Button>
              </a>
              <Button variant="outline" className="min-h-12 w-full" onClick={openWizard}>
                <Upload size={16} /> Upload Your Idea
              </Button>
            </div>

            <div className="soft-shadow mt-6 rounded-[20px] border border-[#e1e5ea] bg-white p-2 transition hover:shadow-xl hover:shadow-[#101216]/5 lg:mt-9 lg:p-3">
              <div className="flex min-h-36 flex-col gap-3 rounded-2xl bg-[#fbfbfc] p-3 lg:min-h-44 lg:gap-4 lg:p-4">
                <Textarea
                  value={idea}
                  onChange={(event) => setIdea(event.target.value)}
                  placeholder={prompts[promptIndex]}
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
                      {displayContent.ctaText} <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="flex items-center max-lg:hidden"
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
                  ["Product", "Magnetic Phone Stand"],
                  ["Quantity", "1000 Units"],
                  ["Target Market", "United States"],
                  ["Status", "Ready For Manufacturing Review"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#e8ebef] bg-white p-4">
                    <p className="text-xs uppercase text-[#8c94a1]">{label}</p>
                    <p className="mt-2 font-medium">{value}</p>
                  </div>
                ))}
                <div className="rounded-lg bg-[#101216] p-4 text-white">
                  <p className="text-sm text-white/70">Next Step</p>
                  <p className="mt-2 text-xl font-semibold">Chat With TYORA</p>
                </div>
              </div>
            </Card>
          </motion.div>
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
            We Don&apos;t Help You Find Factories.
            <span className="block">We Help You Build Products.</span>
          </h2>
          <div className="mt-5 grid gap-2">
            {["Product Development", "Manufacturing Partner Matching", "Project Management"].map((item) => (
              <div key={item} className="flex min-h-11 items-center gap-2 rounded-lg border border-[#e8ebef] bg-white px-3 text-sm font-medium text-[#59616e]">
                <Check size={16} className="text-[#0f766e]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[0.62fr_1.38fr] lg:px-8 lg:py-20">
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
        </div>
      </section>

      <section className="border-y border-[#eef1f4] bg-[#fbfbfc]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-5 lg:mb-9">
            <h2 className="text-[2rem] font-semibold leading-tight lg:text-[2.25rem]">{t.productJourney}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {mobileJourneySteps.map(({ title, icon: Icon }) => (
              <Card key={title} className="p-4">
                <Icon size={18} className="text-[#101216]" />
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              </Card>
            ))}
          </div>
          <div className="hidden gap-4 lg:grid lg:grid-cols-5">
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
              <div className="grid gap-2">
                {[
                  [story.concept, story.conceptImage],
                  [story.prototype, story.prototypeImage],
                  [story.final, story.finalImage]
                ].map(([label, image], itemIndex) => (
                  <div key={label}>
                  <div
                    className="flex min-h-16 items-center justify-center rounded-lg bg-[#f2f4f6] p-3 text-center text-sm font-medium text-[#69707d] lg:min-h-24"
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={label} className="h-full max-h-32 w-full rounded-lg object-cover" />
                    ) : (
                      label
                    )}
                  </div>
                  {itemIndex < 2 ? (
                    <div className="py-1 text-center text-[#8c94a1]">↓</div>
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
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {displayContent.pricing.filter((plan) => plan.visible).map((plan) => {
              const isPopular = plan.price.includes("$149");
              return (
              <Card key={plan.name} className={cn(
                "relative p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5 lg:p-5",
                isPopular ? "border-[#101216] shadow-lg shadow-[#101216]/5" : ""
              )}>
                <div className="flex min-h-7 items-start justify-between gap-3">
                  <p className="text-sm text-[#69707d]">{plan.name}</p>
                  {isPopular ? (
                    <span className="rounded-full bg-[#0f766e] px-2.5 py-1 text-xs font-medium text-white">
                      Most Popular
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-2 text-xl font-semibold lg:mt-3 lg:text-2xl">{plan.price}</h3>
                <ul className="mt-4 space-y-2 text-sm text-[#59616e] lg:mt-5 lg:space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 shrink-0 text-[#0f766e]" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.note ? <p className="mt-4 text-sm text-[#69707d] lg:mt-5">{plan.note}</p> : null}
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

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.65fr_1.35fr] lg:px-8 lg:py-20">
        <div className="aspect-[4/3] rounded-lg bg-[#f2f4f6] lg:aspect-square">
          {displayContent.founderPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayContent.founderPhoto}
              alt={displayContent.founderName}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-[linear-gradient(135deg,#f7f8fa_0%,#eef1f4_100%)] p-8 text-center text-[#69707d]">
              <div className="relative flex size-24 items-center justify-center rounded-full bg-white ring-1 ring-[#e1e5ea] lg:size-32">
                <UserCheck size={44} className="text-[#101216] lg:size-[54px]" />
                <span className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-[#0f766e] text-white ring-4 ring-white">
                  <Check size={15} />
                </span>
              </div>
              <p className="mt-5 text-sm font-medium text-[#101216]">{displayContent.founderName}</p>
              <p className="mt-1 max-w-48 text-xs leading-5">Professional founder photo placeholder</p>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <p className="mb-3 text-sm font-medium text-[#69707d]">
            {displayContent.founderTitle}
          </p>
          <h2 className="text-[2rem] font-semibold leading-tight lg:text-[2.25rem]">{language === "zh" ? `你好，我是 ${displayContent.founderName}。` : <>Hi, I&apos;m {displayContent.founderName}.</>}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#59616e] lg:mt-5 lg:text-lg lg:leading-8">
            {language === "zh"
              ? displayContent.founderText
              : "I help entrepreneurs transform product ideas into manufacturable products through trusted manufacturing partners in China. Every project is personally reviewed."}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={displayContent.whatsappLink} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="min-h-12 lg:min-h-11">
                <MessageCircle size={16} /> {t.whatsApp}
              </Button>
            </a>
            <a href={displayContent.linkedInLink} target="_blank" rel="noreferrer">
              <Button variant="outline">{t.linkedIn}</Button>
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-[#eef1f4] bg-[#101216] px-4 py-10 text-white lg:hidden">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-[2rem] font-semibold leading-tight">Ready to Build Your Product?</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/70">
            Let&apos;s turn your idea into a real product.
          </p>
          <a href={displayContent.whatsappLink} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full max-w-sm">
            <Button variant="secondary" className="min-h-12 w-full">
              <MessageCircle size={16} /> Chat With Us
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
            <a href={`mailto:${displayContent.email}`}>{t.email}</a>
            <a href={displayContent.whatsappLink} target="_blank" rel="noreferrer">{t.whatsApp}</a>
            <a href={displayContent.linkedInLink} target="_blank" rel="noreferrer">{t.linkedIn}</a>
            <a href="/admin">{t.admin}</a>
          </div>
        </div>
      </footer>

      <a
        href={displayContent.whatsappLink}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-3 right-3 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0f766e] px-4 text-sm font-medium text-white shadow-2xl shadow-[#0f766e]/20 transition hover:scale-[1.02] sm:bottom-5 sm:right-5 sm:px-5"
      >
        <MessageCircle size={18} />
        {t.chatWithUs}
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
                    aria-label="Close questionnaire"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <p className="text-sm text-[#69707d]">{t.projectIntake}</p>
                  <div className="w-9" />
                </div>
                {!submitted ? (
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eef1f4]">
                    <div
                      className="h-full rounded-full bg-[#101216] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-8">
                {submitted ? (
                  <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-16 text-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-[#e6f7f4] text-[#0f766e]">
                      <PackageCheck size={26} />
                    </span>
                    <h2 className="mt-5 text-3xl font-semibold">{t.projectReceived}</h2>
                    <p className="mt-3 text-[#59616e]">
                      {t.projectReceivedText}
                    </p>
                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                      <a href={displayContent.whatsappLink} target="_blank" rel="noreferrer">
                        <Button variant="secondary">
                          <MessageCircle size={16} /> {t.chatOnWhatsApp}
                        </Button>
                      </a>
                      <a href={displayContent.callLink} target="_blank" rel="noreferrer">
                        <Button variant="outline">
                          <Calendar size={16} /> {t.bookACall}
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#101216] text-white">
                        <Sparkles size={16} />
                      </span>
                      <div className="rounded-2xl rounded-tl-sm bg-[#f5f6f8] p-4">
                        <p className="text-lg font-semibold">{currentStep.question}</p>
                        {"note" in currentStep && currentStep.note ? (
                          <p className="mt-2 text-sm text-[#69707d]">{currentStep.note}</p>
                        ) : null}
                      </div>
                    </div>

                    {"options" in currentStep ? (
                      <div className="ml-0 grid gap-3 sm:ml-12 sm:grid-cols-2">
                        {currentStep.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setAnswer(currentStep.key, option);
                              window.setTimeout(() => void nextStep(), 180);
                            }}
                            className={cn(
                              "min-h-14 rounded-lg border px-4 text-left text-sm font-medium transition hover:border-[#101216]",
                              answers[currentStep.key] === option
                                ? "border-[#101216] bg-[#101216] text-white"
                                : "border-[#e1e5ea] bg-white"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="ml-0 sm:ml-12">
                        <Textarea
                          value={
                            currentStep.key === "productIdea"
                              ? answers.productIdea || idea
                              : answers[currentStep.key] || ""
                          }
                          placeholder={
                            "placeholder" in currentStep ? currentStep.placeholder : ""
                          }
                          onChange={(event) => {
                            if (currentStep.key === "productIdea") {
                              setIdea(event.target.value);
                            }
                            setAnswer(currentStep.key, event.target.value);
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!submitted ? (
                <div className="flex items-center justify-between border-t border-[#eef1f4] p-4">
                  <Button
                    variant="ghost"
                    onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                    disabled={stepIndex === 0}
                  >
                    {t.back}
                  </Button>
                  <Button onClick={() => void nextStep()} disabled={!canContinue || submitting}>
                    {stepIndex === activeSteps.length - 1 ? t.submitProject : t.continue}
                    <Send size={16} />
                  </Button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
