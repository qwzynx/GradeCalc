import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";
import OpenAccessibilitySettings from "../components/OpenAccessibilitySettings";
import { LEGAL, formatLegalDate } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Accessibility · ${LEGAL.siteName}`,
  description: `${LEGAL.siteName}'s commitment to accessibility, its accessibility settings, known limitations and how to get help.`,
};

const sections = [
  { id: "commitment", title: "Our commitment" },
  { id: "settings", title: "Accessibility settings" },
  { id: "features", title: "Built-in accessibility features" },
  { id: "status", title: "Conformance status" },
  { id: "limitations", title: "Known limitations" },
  { id: "compatibility", title: "Compatibility" },
  { id: "feedback", title: "Feedback and alternative formats" },
  { id: "assessment", title: "How we assess accessibility" },
];

export default function AccessibilityPage() {
  const name = LEGAL.siteName;
  const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

  return (
    <LegalPage
      title="Accessibility Statement"
      sections={sections}
      intro={
        <p>
          Everyone should be able to track their grades and plan their studies. This statement explains how{" "}
          {name} supports accessibility, where it still falls short, and how to reach us if something gets in your way.
        </p>
      }
    >
      <h2 id="commitment">1. Our commitment</h2>
      <p>
        We aim for {name} to meet the <strong>Web Content Accessibility Guidelines (WCAG) 2.1, Level AA</strong>{" "}
        — the standard behind the <em>Accessibility for Ontarians with Disabilities Act</em> (AODA) web requirements
        — and to be usable with a keyboard, screen readers, magnification and other assistive technologies. We
        treat accessibility barriers as bugs.
      </p>

      <h2 id="settings">2. Accessibility settings</h2>
      <p>
        {name} has its own accessibility settings, available from the accessibility button in the app header and
        the &ldquo;Accessibility settings&rdquo; link at the bottom of every page — including the sign-in screen.
        Settings are saved on your device and apply everywhere:
      </p>
      <ul>
        <li><strong>Text size</strong> — up to 150%, scaling all text in the app.</li>
        <li><strong>High contrast</strong> — darker secondary text and stronger borders and focus outlines.</li>
        <li><strong>Reduce motion</strong> — turns off animations and transitions, even if your device setting is off.</li>
        <li><strong>Readable font</strong> — switches to Atkinson Hyperlegible, a typeface designed for low-vision readers.</li>
        <li><strong>Underline links</strong> — so links can be identified without relying on colour.</li>
        <li><strong>Increase text spacing</strong> — wider letter, word and line spacing (WCAG 1.4.12).</li>
        <li><strong>Dark mode</strong> — light text on a dark background.</li>
      </ul>
      <div className="mb-4">
        <OpenAccessibilitySettings />
      </div>

      <h2 id="features">3. Built-in accessibility features</h2>
      <ul>
        <li>A &ldquo;Skip to main content&rdquo; link as the first item on every page.</li>
        <li>Visible keyboard focus indicators on links and buttons.</li>
        <li>Dialogs that move focus inside when opened, keep keyboard focus within them, close with Escape and return focus when closed.</li>
        <li>Pinch-to-zoom is never blocked, and text is sized in relative units so it respects your browser&apos;s font-size setting.</li>
        <li>Your operating system&apos;s &ldquo;reduce motion&rdquo; and light/dark preferences are respected automatically.</li>
        <li>Main buttons and controls have touch targets of at least 44 × 44 pixels.</li>
        <li>Syllabus upload works by clicking or keyboard as well as drag-and-drop, and everything the AI features do can also be done by entering courses manually.</li>
      </ul>

      <h2 id="status">4. Conformance status</h2>
      <p>
        {name} is <strong>partially conformant</strong> with WCAG 2.1 Level AA: most of the service meets the
        standard, but some parts do not yet fully, as listed below. We are working to close these gaps.
      </p>

      <h2 id="limitations">5. Known limitations</h2>
      <ul>
        <li>
          <strong>Charts.</strong> The grade-distribution and GPA-trend charts are visual. The key figures they
          summarise — GPA, averages, credits and per-course marks — are also shown as text, but the charts do not
          yet have a full data-table alternative.
        </li>
        <li>
          <strong>Form labels.</strong> Some course and assignment form fields are described by visible text
          placed next to them but are not yet programmatically linked to it, so some screen readers may announce
          them without a name.
        </li>
        <li>
          <strong>Small uppercase labels.</strong> Some secondary labels use small, uppercase, widely-spaced text.
          The text-size, readable-font and text-spacing settings help here.
        </li>
        <li>
          <strong>York University and Duo.</strong> eClass Sync depends on York University&apos;s Passport York and
          Cisco&apos;s Duo Mobile app, whose accessibility we don&apos;t control. Entering grades manually is always
          available as an alternative.
        </li>
        <li>
          <strong>Syllabus PDFs.</strong> AI Import reads the PDF you provide; scanned or image-only PDFs may not
          import correctly.
        </li>
      </ul>

      <h2 id="compatibility">6. Compatibility</h2>
      <p>
        {name} is built with semantic HTML, CSS, JavaScript and WAI-ARIA, and is designed for the current versions
        of Chrome, Edge, Firefox and Safari on desktop and mobile, together with common assistive technologies such
        as NVDA, JAWS, VoiceOver and TalkBack. Older browsers may not display everything correctly.
      </p>

      <h2 id="feedback">7. Feedback and alternative formats</h2>
      <p>
        If you run into a barrier, need information from {name} in another format (for example, your grade data as
        a plain-text or large-print document, or these policies in an accessible format), or have a suggestion,
        email {mail}. Please tell us the page and what happened. We aim to respond within{" "}
        {LEGAL.accessibilityResponseDays} business days and will provide accessible formats at no cost, in a
        timely way that takes your needs into account.
      </p>

      <h2 id="assessment">8. How we assess accessibility</h2>
      <p>
        We assess {name} through self-evaluation: keyboard-only testing, checks of colour contrast, zoom and
        text-spacing behaviour, and review of the code against WCAG 2.1 AA. This statement was last reviewed on{" "}
        {formatLegalDate(LEGAL.effectiveDate)} and will be reviewed again whenever major features change.
      </p>
    </LegalPage>
  );
}
