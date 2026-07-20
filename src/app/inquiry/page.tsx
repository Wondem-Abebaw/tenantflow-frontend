import type { Metadata } from "next";

import { InquiryForm } from "@/features/inquiry/inquiry-form";

export const metadata: Metadata = {
  title: "Property inquiry",
};

interface InquiryPageProps {
  searchParams: Promise<{
    propertyId?: string | string[];
  }>;
}

export default async function InquiryPage({ searchParams }: InquiryPageProps) {
  const params = await searchParams;

  const propertyId =
    typeof params.propertyId === "string" ? params.propertyId.trim() : "";

  return <InquiryForm propertyId={propertyId} />;
}
