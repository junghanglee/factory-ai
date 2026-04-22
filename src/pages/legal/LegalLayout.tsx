import { ReactNode } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { COMPANY } from "./CompanyInfo";

interface LegalLayoutProps {
  title: string;
  intro?: string;
  children: ReactNode;
}

const LegalLayout = ({ title, intro, children }: LegalLayoutProps) => (
  <MainLayout>
    <article className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{COMPANY.brand} · Legal</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">{title}</h1>
        {intro && <p className="mt-3 text-sm leading-6 text-muted-foreground">{intro}</p>}
        <p className="mt-3 text-xs text-muted-foreground">시행일: {COMPANY.effectiveDate}</p>
      </header>
      <div
        className="space-y-4 text-sm leading-7 text-foreground/90
          [&_h2]:mt-10 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground
          [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground
          [&_p]:leading-7
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5
          [&_li]:leading-7
          [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline
          [&_strong]:font-semibold [&_strong]:text-foreground"
      >
        {children}
      </div>
      <footer className="mt-10 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{COMPANY.legalName} ({COMPANY.legalNameEn})</p>
        <p className="mt-1">대표자: {COMPANY.representative} · 사업자등록번호 {COMPANY.bizNumber}</p>
        <p>주소: {COMPANY.address}</p>
        <p>고객지원: {COMPANY.email}</p>
      </footer>
    </article>
  </MainLayout>
);

export default LegalLayout;
