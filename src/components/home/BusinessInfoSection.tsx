/**
 * Bilingual business-info section shown above the footer on the home page.
 * Helps payment-provider reviewers (e.g., Paddle UK) verify business identity,
 * product type, pricing currency, and customer-support contact in English.
 */
import { COMPANY } from "@/pages/legal/CompanyInfo";

const BusinessInfoSection = () => (
  <section
    aria-label="Business information"
    className="border-t border-border bg-secondary/40 py-12"
  >
    <div className="mx-auto max-w-[1200px] px-5">
      <div className="grid gap-8 md:grid-cols-2">
        {/* English (for international payment reviewers) */}
        <div className="space-y-3 text-sm leading-6 text-foreground/85">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            About this store · English
          </p>
          <p>
            <strong>{COMPANY.legalNameEn}</strong> operates{" "}
            <strong>{COMPANY.brand}</strong> at {COMPANY.domain} as a{" "}
            <strong>first-party digital content store</strong>. We design, produce
            and sell AI-generated digital content (images, videos, writing, music,
            AI assistants, webtoons, ad creatives) directly. We are{" "}
            <strong>not a marketplace</strong> for third-party sellers.
          </p>
          <p>
            All payments are processed in <strong>USD</strong> by{" "}
            <strong>Paddle.com Market Limited</strong> (UK) as the Merchant of
            Record. Standard digital items are delivered immediately after
            payment; custom-made items are delivered via email or in-app chat
            within 3–14 business days.
          </p>
          <p className="text-foreground/70">
            Customer support:{" "}
            <a
              href={`mailto:${COMPANY.email}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {COMPANY.email}
            </a>{" "}
            · We reply within 24 business hours.
          </p>
        </div>

        {/* Korean business identity */}
        <div className="space-y-3 text-sm leading-6 text-foreground/85">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            사업자 정보 · 한국어
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt className="text-muted-foreground">상호</dt>
            <dd className="font-medium">
              {COMPANY.legalName} ({COMPANY.legalNameEn})
            </dd>
            <dt className="text-muted-foreground">대표자</dt>
            <dd>{COMPANY.representative}</dd>
            <dt className="text-muted-foreground">사업자등록번호</dt>
            <dd>{COMPANY.bizNumber}</dd>
            <dt className="text-muted-foreground">소재지</dt>
            <dd>{COMPANY.address}</dd>
            <dt className="text-muted-foreground">고객지원</dt>
            <dd>
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {COMPANY.email}
              </a>
            </dd>
            <dt className="text-muted-foreground">결제 처리</dt>
            <dd>Paddle.com Market Limited (영국, MoR) · USD</dd>
          </dl>
        </div>
      </div>
    </div>
  </section>
);

export default BusinessInfoSection;
