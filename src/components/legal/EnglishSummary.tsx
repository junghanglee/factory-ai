/**
 * Bilingual summary box shown at the top of every legal page.
 * Required for Paddle (UK) reviewers to verify business model in English.
 */
import { COMPANY } from "@/pages/legal/CompanyInfo";

interface EnglishSummaryProps {
  /** Short English summary of this specific legal page */
  summary: string;
}

const EnglishSummary = ({ summary }: EnglishSummaryProps) => (
  <aside className="not-prose mb-8 rounded-lg border border-primary/20 bg-primary/5 p-5 text-sm leading-6 text-foreground/90">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
      English Summary (for international reviewers)
    </p>
    <p className="mb-3">
      <strong>{COMPANY.legalNameEn}</strong> ({COMPANY.legalName}) operates{" "}
      <strong>{COMPANY.brand}</strong> at{" "}
      <a href={`https://${COMPANY.domain}`} className="text-primary underline-offset-4 hover:underline">
        {COMPANY.domain}
      </a>
      , a <strong>first-party digital content store</strong> selling AI-generated
      digital assets (images, videos, writing, music, AI assistants, webtoons,
      ad creatives) produced in-house. We are <strong>not a marketplace</strong>{" "}
      that resells third-party seller content. All payments are processed in
      USD by <strong>Paddle.com Market Limited</strong> (UK) as the Merchant of
      Record. Customer support:{" "}
      <a href={`mailto:${COMPANY.email}`} className="text-primary underline-offset-4 hover:underline">
        {COMPANY.email}
      </a>
      . Business address: {COMPANY.address}, South Korea. Business registration:{" "}
      {COMPANY.bizNumber}.
    </p>
    <p className="text-foreground/80">{summary}</p>
  </aside>
);

export default EnglishSummary;
