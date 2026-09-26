import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "../components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy · ${LEGAL.siteName}`,
  description: `How ${LEGAL.siteName} collects, uses, shares and protects your information.`,
};

const sections = [
  { id: "who-we-are", title: "Who we are" },
  { id: "summary", title: "The short version" },
  { id: "collect", title: "Information we collect" },
  { id: "eclass", title: "eClass Sync and your York credentials" },
  { id: "use", title: "How we use information" },
  { id: "consent", title: "Consent and legal bases" },
  { id: "sharing", title: "Service providers and sharing" },
  { id: "ai", title: "AI processing by Google Gemini" },
  { id: "transfers", title: "Where your data is stored" },
  { id: "storage", title: "Cookies and on-device storage" },
  { id: "retention", title: "How long we keep data" },
  { id: "security", title: "Security" },
  { id: "rights", title: "Your rights and choices" },
  { id: "children", title: "Age requirement" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact and complaints" },
];

export default function PrivacyPage() {
  const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

  return (
    <LegalPage
      title="Privacy Policy"
      sections={sections}
      intro={
        <p>
          This policy explains what personal information {LEGAL.siteName} handles when you use the website and its
          features, why, who it is shared with, and the choices you have. It is written to meet Canada&apos;s{" "}
          <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) and to respect the
          rights people have under similar laws elsewhere, including the GDPR.
        </p>
      }
    >
      <h2 id="who-we-are">1. Who we are</h2>
      <p>
        {LEGAL.siteName} is a grade-tracking and GPA-planning tool for university students, operated by{" "}
        {LEGAL.operatorName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). We are responsible for the personal
        information described here. Our designated privacy contact is {LEGAL.privacyOfficer}, reachable at {mail}.
      </p>
      <p>
        {LEGAL.siteName} is an independent project. It is <strong>not</strong> operated by, affiliated with or
        endorsed by York University, and this policy does not cover York&apos;s own systems (Passport York, Duo,
        eClass), which are governed by York University&apos;s privacy practices.
      </p>

      <h2 id="summary">2. The short version</h2>
      <ul>
        <li>We store your email address and the course and grade information you enter or choose to import.</li>
        <li>
          If you use eClass Sync, your Passport York username and password pass through our server once, in memory,
          to sign in on your behalf. They are <strong>never saved</strong> to our database, files or logs.
        </li>
        <li>Syllabus files and eClass grade data are sent to Google&apos;s Gemini AI to be read and matched.</li>
        <li>No advertising, no analytics trackers, no selling or renting of your data — ever.</li>
        <li>
          You can download or permanently delete your data at any time from the{" "}
          <Link href="/account">Your data</Link> page.
        </li>
      </ul>

      <h2 id="collect">3. Information we collect</h2>
      <h3>Account information</h3>
      <ul>
        <li>Your email address, used to sign in and to send account emails (verification, password reset, notices about material changes to these policies).</li>
        <li>Your password, which is stored only as a salted hash by our authentication provider. We cannot read it.</li>
        <li>Account timestamps (created, last signed in) and the version and date of the Terms and Privacy Policy you accepted.</li>
      </ul>

      <h3>Academic information you add</h3>
      <p>
        Course names and codes, professor names, semester, year, credits, department category, whether a course is
        in progress, assignment names, weights, marks, bonus flags and any final-grade overrides. This comes from
        you — typed in, imported from a syllabus, or synced from eClass after you review and approve it.
      </p>

      <h3>Syllabus files</h3>
      <p>
        When you use AI Import, the PDF you choose is sent to our server and then to Google Gemini to extract the
        course details and grading scheme. <strong>We do not store the file.</strong> Only the details you review
        and choose to import are saved.
      </p>

      <h3>eClass sync history</h3>
      <p>
        Each time you apply an eClass sync, we save a record of that sync — the number of courses matched and items
        created or updated, plus a snapshot of the sync plan (the eClass courses, grade items and marks that were
        read). This lets you see what a sync changed. It is covered in detail in <a href="#eclass">section 4</a>.
      </p>

      <h3>Technical information</h3>
      <p>
        Like any website, our hosting and database providers automatically record basic request information — IP
        address, browser type, date and time, the page or API route requested and any error messages — to operate
        the service, keep it secure and diagnose problems. Our server also logs error messages when a sync or
        import fails; those messages never include your password.
      </p>

      <h3>What we don&apos;t collect</h3>
      <p>
        We don&apos;t ask for your student number, date of birth, address, phone number or payment details, and
        we don&apos;t use analytics, advertising or social-media tracking tools. Please don&apos;t enter sensitive
        personal information (such as health or accommodation details) into course or assignment names.
      </p>

      <h2 id="eclass">4. eClass Sync and your York credentials</h2>
      <p>eClass Sync is optional. You only use it if you choose to, and you must confirm you understand how it works each time before signing in.</p>
      <h3>If you sign in with your Passport York username and password</h3>
      <ul>
        <li>Your username and password are sent over an encrypted (HTTPS) connection to our server.</li>
        <li>
          A temporary, automated web browser running on our server enters them on York University&apos;s Passport
          York sign-in page, then waits while you approve the Duo request on your phone. If Duo shows a
          verification code, we relay it to your screen so you can enter it on your phone.
        </li>
        <li>
          Your credentials exist only in the server&apos;s memory for the length of that one request. They are{" "}
          <strong>never written to our database, to disk or to logs</strong>, and are discarded when the request
          ends. The temporary browser is closed after every attempt and always declines Duo&apos;s &ldquo;remember
          this device&rdquo; option.
        </li>
      </ul>
      <h3>If you paste an eClass session cookie instead</h3>
      <p>The session value you paste is used the same way — for that one request only — and is not stored.</p>
      <h3>What we read from eClass</h3>
      <p>
        Using the resulting eClass session, we read your list of courses, the grade report for each course (item
        names, marks, ranges and weights) and, where a course has one, its syllabus file. That information is sent
        to Google Gemini to match it to your existing courses (see <a href="#ai">section 8</a>), and the proposed
        changes are shown to you. <strong>Nothing is saved until you review and apply it.</strong>
      </p>
      <p>
        The eClass session York issues stays valid on York&apos;s systems until it expires or you sign out of
        eClass; we do not keep a copy. Using eClass Sync means you are asking us to access your eClass account on
        your behalf — please read the <Link href="/terms#eclass">eClass Sync section of our Terms</Link>, including
        your responsibility to follow York University&apos;s own policies.
      </p>

      <h2 id="use">5. How we use information</h2>
      <ul>
        <li>To provide the service: store your courses, calculate averages, required marks and GPAs, and show charts.</li>
        <li>To run the features you choose: AI Import and eClass Sync.</li>
        <li>To authenticate you and keep your account secure, including rate-limiting sign-in attempts to prevent abuse.</li>
        <li>To send essential account emails. We don&apos;t send marketing email.</li>
        <li>To diagnose errors and keep the service working.</li>
        <li>To comply with the law and enforce our Terms.</li>
      </ul>
      <p>
        We don&apos;t use your information for advertising, we don&apos;t sell or rent it, and we don&apos;t use it
        to make decisions about you that have legal or similarly significant effects. AI suggestions are always
        shown to you for review before anything is saved.
      </p>

      <h2 id="consent">6. Consent and legal bases</h2>
      <p>
        By creating an account you consent to the collection and use of your information as described here. AI
        Import and eClass Sync involve additional processing, so you choose to use them each time, and eClass Sync
        asks for your express confirmation before any credentials are sent. You can withdraw consent at any time by
        no longer using a feature or by deleting your account; withdrawing consent may mean we can no longer
        provide that part of the service.
      </p>
      <p>
        If you are in the European Economic Area or the United Kingdom, we rely on: performance of our contract
        with you (running your account and the calculator); your consent (AI Import and eClass Sync); our
        legitimate interests in keeping the service secure and working; and compliance with legal obligations.
      </p>

      <h2 id="sharing">7. Service providers and sharing</h2>
      <p>We share personal information only with the providers we need to run {LEGAL.siteName}, and only for that purpose:</p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr><th scope="col">Provider</th><th scope="col">What it does</th><th scope="col">Data involved</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase</td>
              <td>Database and sign-in</td>
              <td>Email, hashed password, account metadata, courses, assignments, sync history</td>
            </tr>
            <tr>
              <td>Vercel</td>
              <td>Website hosting and server functions</td>
              <td>Request data and logs; syllabus files and credentials in transit and in memory only</td>
            </tr>
            <tr>
              <td>Google (Gemini API)</td>
              <td>Reading syllabi and matching eClass grades</td>
              <td>Syllabus files; eClass course, grade and syllabus content; the courses and assignments (names, terms, weights and marks) you are syncing against</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        When you use eClass Sync, your credentials are also submitted to York University&apos;s Passport York, Duo
        and eClass systems, because that is how signing in works.
      </p>
      <p>
        We may also disclose information if required by law or a valid legal order, to protect the rights, safety
        or security of users or the public, or as part of a transfer of the service to a new operator — in which
        case this policy would continue to apply and we would notify you beforehand.
      </p>

      <h2 id="ai">8. AI processing by Google Gemini</h2>
      <p>
        AI Import and eClass Sync send content to Google&apos;s Gemini API: the syllabus you upload, or the eClass
        grade data and syllabus files read during a sync, together with the details (names, terms, weights and
        marks) of your in-progress and eClass-linked courses so they can be matched.
        Google processes this to return the extracted or matched information to us.
      </p>
      {LEGAL.aiProviderUsesDataForTraining ? (
        <p>
          <strong>Please note:</strong> under Google&apos;s terms for the tier of the Gemini API we currently use,
          Google may use content sent to it to provide, improve and develop its products, and trained reviewers at
          Google may read it. Don&apos;t upload files that contain other people&apos;s personal information or
          anything you wouldn&apos;t want seen. If you prefer, you can enter courses manually and never use the AI
          features.
        </p>
      ) : (
        <p>
          We use a paid tier of the Gemini API. Under Google&apos;s terms for that tier, Google does not use the
          content we send to improve its products, and handles it under its data processing terms.
        </p>
      )}
      <p>AI output can be wrong. That&apos;s why every import and sync is shown to you for review before it is saved.</p>

      <h2 id="transfers">9. Where your data is stored</h2>
      <p>
        Our service providers store and process data in the United States and possibly other countries, so your
        information may be handled outside Canada and your province. While there, it is protected by our providers&apos;
        contractual commitments, but it may be accessible to courts, law-enforcement and national-security
        authorities of those countries under their laws.
      </p>

      <h2 id="storage">10. Cookies and on-device storage</h2>
      <p>
        {LEGAL.siteName} does not use advertising, analytics or tracking cookies. We use your browser&apos;s local
        storage only for things the site needs to work or that you have chosen:
      </p>
      <ul>
        <li><strong>Sign-in session</strong> — keeps you signed in (strictly necessary).</li>
        <li><strong>Theme</strong> — remembers light or dark mode.</li>
        <li><strong>Dashboard filters</strong> — remembers your course filters.</li>
        <li><strong>Accessibility settings</strong> — remembers text size, contrast and other display choices.</li>
      </ul>
      <p>
        This information stays on your device and is not used to track you. Because nothing here is optional
        tracking, we don&apos;t show a cookie banner. Signing out removes the session; clearing your browser&apos;s
        site data removes the rest.
      </p>

      <h2 id="retention">11. How long we keep data</h2>
      <ul>
        <li><strong>Account, courses, assignments and sync history</strong> — until you delete them or your account.</li>
        <li><strong>Passport York credentials, eClass session values and syllabus files</strong> — not retained; discarded when the request ends.</li>
        <li><strong>Server and error logs</strong> — kept by our hosting providers for a short, limited period under their retention settings, then deleted automatically.</li>
        <li><strong>Backups</strong> — deleted data can remain in our database provider&apos;s backups for a limited period (typically up to 30 days) before it is overwritten.</li>
      </ul>
      <p>If we ever shut down {LEGAL.siteName}, we&apos;ll give at least 30 days&apos; notice so you can export your data first, and then delete it.</p>

      <h2 id="security">12. Security</h2>
      <p>
        We protect your information with encrypted connections (HTTPS), hashed passwords, database row-level
        security so each account can only reach its own records, server-side verification of every request,
        rate limits on sign-in attempts, and by never storing York credentials. No online service can be perfectly
        secure, though. If a breach of security involving your information creates a real risk of significant
        harm, we will notify you and the Office of the Privacy Commissioner of Canada as the law requires.
      </p>
      <p>Keep your {LEGAL.siteName} password unique and don&apos;t reuse your Passport York password here.</p>

      <h2 id="rights">13. Your rights and choices</h2>
      <p>You can:</p>
      <ul>
        <li><strong>Access and download</strong> your data at any time from <Link href="/account">Your data</Link> (a machine-readable JSON file).</li>
        <li><strong>Correct</strong> your courses and grades directly in the app.</li>
        <li><strong>Delete</strong> your eClass sync history, or your entire account and all its data, from <Link href="/account">Your data</Link>.</li>
        <li><strong>Withdraw consent</strong> to optional features by not using them.</li>
        <li>
          <strong>Ask us</strong> about the information we hold, how it has been used and who it has been shared
          with, or — in the EEA/UK — to restrict or object to processing, by emailing {mail}.
        </li>
      </ul>
      <p>
        We&apos;ll respond within {LEGAL.responseDays} days and may need to confirm your identity (usually by
        replying from your account email) before acting. We don&apos;t charge for requests and won&apos;t treat you
        differently for exercising your rights.
      </p>

      <h2 id="children">14. Age requirement</h2>
      <p>
        {LEGAL.siteName} is designed for university students and is not intended for anyone under {LEGAL.minimumAge}.
        We don&apos;t knowingly collect information from anyone under {LEGAL.minimumAge}; if we learn we have, we
        will delete it. If you believe a child has created an account, contact us at {mail}.
      </p>

      <h2 id="changes">15. Changes to this policy</h2>
      <p>
        We&apos;ll update this policy if our practices change, and revise the effective date above. For material
        changes — for example, a new category of data or a new service provider that receives your information —
        we&apos;ll tell you in the app and ask you to review the updated policy before continuing.
      </p>

      <h2 id="contact">16. Contact and complaints</h2>
      <p>
        Questions, requests or concerns about privacy: {mail}. If you&apos;re not satisfied with our response, you
        can complain to the{" "}
        <a href="https://www.priv.gc.ca/en/report-a-concern/" target="_blank" rel="noopener noreferrer">
          Office of the Privacy Commissioner of Canada
        </a>
        , to the Commission d&apos;accès à l&apos;information if you live in Québec, or to the data protection
        authority where you live if you are in the EEA or UK.
      </p>
    </LegalPage>
  );
}
