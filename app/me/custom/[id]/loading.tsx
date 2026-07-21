export default function PrivateCustomInquiryLoading() {
  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#f4f7fb] px-4 pb-[calc(8.75rem+env(safe-area-inset-bottom))] pt-20 text-[#101216] md:pb-16"
      aria-busy="true"
      aria-label="Loading private Custom inquiry"
    >
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-11 w-36 rounded-full bg-[#e2e8f0]" />
        <div className="mt-8 h-8 w-2/3 rounded-lg bg-[#dbe3ed]" />
        <div className="mt-4 h-4 w-full max-w-2xl rounded bg-[#e2e8f0]" />
        <div className="mt-8 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-24 bg-white" />
          ))}
        </div>
        <p className="sr-only">Loading private Custom inquiry.</p>
      </div>
    </main>
  );
}
