import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inquiry received",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LeadPage() {
  return (
    <main className="min-h-screen bg-[#f4f5f1] text-[#18201d]">
      <header className="border-b border-[#cbd1c9] px-5 py-5 sm:px-8 lg:px-12">
        <p className="text-sm font-semibold text-[#174c3b]">TenantFlow</p>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-65px)] w-full max-w-6xl content-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-12">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold text-[#b34f32]">
            Inquiry received
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-[#102e25] sm:text-4xl">
            Your message is with the leasing team.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#50605a]">
            This page is the home for your rental inquiry and the next steps in
            the screening process.
          </p>
        </div>

        <dl className="border-l-4 border-[#d97a54] pl-5">
          <dt className="text-xs font-semibold uppercase text-[#68756f]">
            Current status
          </dt>
          <dd className="mt-2 text-lg font-semibold text-[#174c3b]">
            Submitted
          </dd>
          <dt className="mt-7 text-xs font-semibold uppercase text-[#68756f]">
            What happens next
          </dt>
          <dd className="mt-2 text-sm leading-6 text-[#50605a]">
            Continue from this page when the leasing conversation is ready.
          </dd>
        </dl>
      </section>
    </main>
  );
}
