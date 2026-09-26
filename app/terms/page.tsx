import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "../components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Terms of Use · ${LEGAL.siteName}`,
  description: `The terms that apply when you use ${LEGAL.siteName}.`,
};

const sections = [
  { id: "agreement", title: "Agreeing to these terms" },
  { id: "eligibility", title: "Who can use GradeMatrix" },
  { id: "account", title: "Your account" },
  { id: "service", title: "The service" },
  { id: "not-official", title: "Estimates, not official grades" },
  { id: "ai", title: "AI features" },
  { id: "eclass", title: "eClass Sync" },
  { id: "york", title: "No affiliation with York University" },
  { id: "content", title: "Your content" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "third-party", title: "Third-party services" },
  { id: "ip", title: "Our intellectual property" },
  { id: "termination", title: "Suspension and termination" },
  { id: "disclaimers", title: "Disclaimers" },
  { id: "liability", title: "Limitation of liability" },
  { id: "indemnity", title: "Indemnity" },
  { id: "consumer", title: "Your statutory rights" },
  { id: "law", title: "Governing law and disputes" },
  { id: "changes", title: "Changes to these terms" },
  { id: "general", title: "General" },
  { id: "contact", title: "Contact" },
];

export default function TermsPage() {
  const name = LEGAL.siteName;
  const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

  return (
    <LegalPage
      title="Terms of Use"
      sections={sections}
      intro={
        <p>
          These terms are an agreement between you and {LEGAL.operatorName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;)
          about your use of {name}. Please read them — especially the sections on{" "}
          <a href="#not-official" className="text-primary font-semibold underline">estimates</a>,{" "}
          <a href="#eclass" className="text-primary font-semibold underline">eClass Sync</a> and{" "}
          <a href="#liability" className="text-primary font-semibold underline">liability</a>.
        </p>
      }
    >
      <h2 id="agreement">1. Agreeing to these terms</h2>
      <p>
        By creating an account or using {name}, you agree to these Terms of Use and to our{" "}
        <Link href="/privacy">Privacy Policy</Link>, which explains how we handle your information. If you
        don&apos;t agree, please don&apos;t use {name}.
      </p>

      <h2 id="eligibility">2. Who can use {name}</h2>
      <p>
        You must be at least {LEGAL.minimumAge} years old to use {name}. If you are under the age of majority where
        you live, you confirm that a parent or guardian has agreed to these terms on your behalf. You may not use{" "}
        {name} if you are barred from doing so under applicable law.
      </p>

      <h2 id="account">3. Your account</h2>
      <ul>
        <li>Give an email address you control and keep your password confidential. Use a password unique to {name}.</li>
        <li>You are responsible for activity under your account. Tell us promptly at {mail} if you think it has been compromised.</li>
        <li>One person per account; accounts are personal and can&apos;t be transferred.</li>
      </ul>

      <h2 id="service">4. The service</h2>
      <p>
        {name} helps you record courses and assessments, calculate averages and GPAs, and plan the marks you need.
        It is currently provided free of charge. We may add, change or remove features, and we may suspend or
        discontinue {name}; if we discontinue it, we&apos;ll give at least 30 days&apos; notice so you can export
        your data. We don&apos;t promise that {name} will always be available or free of errors.
      </p>

      <h2 id="not-official">5. Estimates, not official grades</h2>
      <p>
        Every average, letter grade, GPA, &ldquo;required mark&rdquo; and projection in {name} is an{" "}
        <strong>estimate</strong> based on the information you or an import provides and on general grading scales.
        Instructors may weight, round, curve, drop or adjust marks differently, and institutional policies change.
      </p>
      <ul>
        <li>{name} is not an official academic record, transcript or grade report.</li>
        <li>
          It is not academic advising. Don&apos;t rely on it alone for decisions such as dropping a course,
          withdrawing, appealing a grade, applying to programs or meeting scholarship or standing requirements —
          always confirm with your official records, your instructor or an academic advisor.
        </li>
      </ul>

      <h2 id="ai">6. AI features</h2>
      <p>
        AI Import and eClass Sync use Google&apos;s Gemini AI to read documents and match grades. AI output can be
        incomplete or wrong, so you must review every suggested change before you apply it; you are responsible
        for what you choose to save. Only upload files you have the right to use, and don&apos;t upload documents
        containing other people&apos;s personal information. See the <Link href="/privacy#ai">Privacy Policy</Link>{" "}
        for how Google processes this content.
      </p>

      <h2 id="eclass">7. eClass Sync</h2>
      <p>eClass Sync is optional. By using it, you agree that:</p>
      <ul>
        <li>
          <strong>You authorize us to act for you.</strong> You direct {name} to use the credentials or session you
          provide to sign in to York University&apos;s eClass <em>as you</em>, solely to read your course list,
          grades and course syllabi for the sync you requested. We won&apos;t use your access for anything else.
        </li>
        <li>
          <strong>It must be your own account.</strong> Only ever enter your own Passport York credentials or
          session.
        </li>
        <li>
          <strong>York&apos;s rules still apply to you.</strong> Your use of Passport York, Duo and eClass is
          governed by York University&apos;s own policies, which may restrict sharing your password with, or
          allowing automated access by, third-party services. You are responsible for checking and following those
          policies, and for any consequences with York of choosing to use eClass Sync. If you&apos;re unsure, use
          the manual session option, or enter your grades yourself.
        </li>
        <li>
          <strong>It can stop working.</strong> eClass Sync depends on York&apos;s systems, which we don&apos;t
          control and which may change without notice. It may fail, return incomplete data, or be limited or
          withdrawn by us at any time, including at York&apos;s request.
        </li>
        <li>Sign-in attempts are rate-limited, because each attempt sends a real Duo request to your phone.</li>
      </ul>
      <p>
        How your credentials are handled — only in memory, never stored — is described in the{" "}
        <Link href="/privacy#eclass">Privacy Policy</Link>.
      </p>

      <h2 id="york">8. No affiliation with York University</h2>
      <p>
        {name} is an independent project. It is <strong>not affiliated with, endorsed by, sponsored by or
        operated by York University</strong>. &ldquo;York University&rdquo;, &ldquo;eClass&rdquo;,
        &ldquo;Passport York&rdquo; and related names belong to York University and are used only to describe
        compatibility. &ldquo;Duo&rdquo; is a trademark of Cisco Systems, Inc. York University is not responsible
        for {name}; please don&apos;t contact York for support with it.
      </p>

      <h2 id="content">9. Your content</h2>
      <p>
        You keep ownership of the courses, grades and files you add (&ldquo;your content&rdquo;). You give us a
        limited, non-exclusive, royalty-free licence to store, copy, process and display your content only as
        needed to operate {name} for you — including sending it to the service providers listed in the Privacy
        Policy. This licence ends when you delete the content or your account, apart from residual backup copies
        that expire on their own. You are responsible for your content and confirm you have the right to provide it.
      </p>

      <h2 id="acceptable-use">10. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use {name} for anything unlawful, or to breach your institution&apos;s academic-integrity rules;</li>
        <li>enter credentials, sessions or data belonging to anyone else;</li>
        <li>access or try to access other users&apos; accounts or data, or probe, scan or test the security of {name} without our written permission;</li>
        <li>interfere with or overload the service, get around rate limits, or use bots, scrapers or other automated means to access {name};</li>
        <li>upload malware, or content that infringes someone else&apos;s rights;</li>
        <li>copy, resell or reverse-engineer the service, except where the law expressly allows it.</li>
      </ul>
      <p>
        Found a security issue? Please tell us privately at {mail} rather than exploiting it — we appreciate
        responsible disclosure.
      </p>

      <h2 id="third-party">11. Third-party services</h2>
      <p>
        {name} relies on third-party services — including Supabase, Vercel, Google and, when you use eClass Sync,
        York University&apos;s systems. Their availability and terms are outside our control, and your use of York&apos;s
        systems remains subject to York&apos;s terms. Links to other websites are provided for convenience; we
        aren&apos;t responsible for their content.
      </p>

      <h2 id="ip">12. Our intellectual property</h2>
      <p>
        {name}&apos;s software, design, text and logos are owned by us or our licensors and protected by
        intellectual-property laws. We grant you a personal, revocable, non-transferable licence to use {name} in
        line with these terms. If you send us feedback or suggestions, we may use them without any obligation to you.
      </p>

      <h2 id="termination">13. Suspension and termination</h2>
      <p>
        You can stop using {name} and delete your account at any time from{" "}
        <Link href="/account">Your data</Link>. We may suspend or close an account that breaches these terms,
        puts other users or the service at risk, or where the law requires it. Where reasonable, we&apos;ll tell
        you first and give you a chance to export your data. Sections that by their nature should survive
        termination (including 9, 14, 15, 16, 18 and 20) continue to apply.
      </p>

      <h2 id="disclaimers">14. Disclaimers</h2>
      <p>
        To the fullest extent permitted by law, {name} is provided <strong>&ldquo;as is&rdquo; and &ldquo;as
        available&rdquo;</strong>, without warranties of any kind, whether express or implied — including
        warranties of merchantability, fitness for a particular purpose, accuracy, non-infringement, and that the
        service will be uninterrupted, secure or error-free. We don&apos;t warrant that any calculation, AI
        output or synced grade is correct. Keep your own copies of important academic information.
      </p>

      <h2 id="liability">15. Limitation of liability</h2>
      <p>To the fullest extent permitted by law:</p>
      <ul>
        <li>
          we are not liable for indirect, incidental, special, consequential or punitive damages, or for lost data,
          lost opportunities, academic outcomes (such as grades, standing, admission or scholarships) or decisions
          you make based on {name}; and
        </li>
        <li>
          our total liability for all claims relating to {name} is limited to the greater of the amount you paid us
          for the service in the 12 months before the claim, or CAD $50.
        </li>
      </ul>
      <p>
        These limits don&apos;t apply to liability that cannot be limited by law, such as for fraud, gross
        negligence or intentional misconduct.
      </p>

      <h2 id="indemnity">16. Indemnity</h2>
      <p>
        To the extent permitted by law, you agree to indemnify us against third-party claims and resulting losses
        caused by your breach of these terms, your misuse of {name}, or your violation of someone else&apos;s
        rights or of York University&apos;s policies.
      </p>

      <h2 id="consumer">17. Your statutory rights</h2>
      <p>
        Nothing in these terms removes or limits rights you have as a consumer that can&apos;t be waived under
        applicable law, including Ontario&apos;s <em>Consumer Protection Act</em> and Québec&apos;s{" "}
        <em>Consumer Protection Act</em>. If a provision of these terms conflicts with such a right, that right
        prevails.
      </p>

      <h2 id="law">18. Governing law and disputes</h2>
      <p>
        These terms are governed by the laws of {LEGAL.jurisdiction}. Before starting any formal claim, please
        contact us at {mail} so we can try to resolve the issue informally within 30 days. If we can&apos;t, the
        courts located in {LEGAL.courts} have jurisdiction — unless the consumer-protection law where you live gives
        you the right to bring proceedings in your local courts, in which case you keep that right.
      </p>

      <h2 id="changes">19. Changes to these terms</h2>
      <p>
        We may update these terms as {name} changes or the law requires. We&apos;ll post the new version here with
        a new effective date and, for material changes, tell you in the app and ask you to accept them before you
        keep using your account. If you don&apos;t accept the changes, you can export your data and delete your
        account.
      </p>

      <h2 id="general">20. General</h2>
      <ul>
        <li>These terms and the Privacy Policy are the whole agreement between you and us about {name}.</li>
        <li>If any provision is found unenforceable, it will be limited to the minimum extent necessary and the rest remains in effect.</li>
        <li>Our not enforcing a provision isn&apos;t a waiver of our right to do so later.</li>
        <li>You may not transfer your rights under these terms. We may transfer ours to a successor operator of {name}, who must honour them and the Privacy Policy.</li>
        <li>Headings are for convenience only.</li>
      </ul>

      <h2 id="contact">21. Contact</h2>
      <p>Questions about these terms, legal notices or support requests: {mail}.</p>
    </LegalPage>
  );
}
