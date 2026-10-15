import { useEffect, useRef } from 'react';
import { FeatureSectionIntro } from './FeatureSectionIntro';
import SiteFooter from './SiteFooter';
import { animateFaqAccordion } from './faqAccordionMotion';
import './faq-section.scss';

const questions = [
  {
    id: 'free',
    question: 'Is Glissform free to use?',
    answer: <p>Yes. Glissform is completely free, including Seamless Close and all its customisation options. There are no subscriptions, trial limits or in-app purchases.</p>,
  },
  {
    id: 'compatibility',
    question: 'Which MacBooks can run Glissform?',
    answer: <p>Seamless Close requires macOS 15 or later and a MacBook with a compatible lid-angle sensor. It has been tested on a 15-inch MacBook Air M5 running macOS 26 and 27.</p>,
  },
  {
    id: 'installation',
    question: 'How do I install Glissform on my Mac?',
    answer: <p>Download Glissform, open the DMG and drag the app into Applications. The current release is not notarized by Apple, so macOS may ask for your approval on first launch. <a href="https://support.apple.com/en-gb/102445" data-installation-guide>Open the installation guide</a> for the steps. Once open, allow Screen Recording access to enable Seamless Close.</p>,
  },
  {
    id: 'screen-access',
    question: 'Why does Glissform need Screen Recording access?',
    answer: <p>Seamless Close uses one screenshot per lid-closing gesture to animate your desktop. macOS groups screenshot access under Screen Recording. The image stays in your Mac’s memory and is never saved or uploaded. There is no continuous recording.</p>,
  },
  {
    id: 'sleep',
    question: 'Will my MacBook still sleep normally?',
    answer: <p>Yes. Your MacBook still sleeps normally when you close the lid. Glissform does not animate the Lock Screen, and the captured desktop image stays hidden while your Mac is locked or asleep.</p>,
  },
  {
    id: 'updates',
    question: 'How do I update Glissform?',
    answer: <p>Glissform checks for updates automatically. Turn on Automatic updates in General to download them in the background and install them when the app quits; macOS may ask for approval. You can also check manually in Privacy &amp; about.</p>,
  },
  {
    id: 'uninstall',
    question: 'How do I quit or uninstall Glissform?',
    answer: <p>Choose Quit Glissform from the menu bar icon, or reopen the app and press ⌘Q if the icon is hidden. Closing Settings can leave Glissform running when Run in background is enabled. To uninstall it, quit the app and move it from Applications to the Trash.</p>,
  },
  {
    id: 'feedback',
    question: 'How can I report a bug or suggest a feature?',
    answer: <p>Open Send feedback in Glissform or email <a href="mailto:support@glissform.app">support@glissform.app</a>. For a bug report, include your Mac model, macOS version, Glissform version and a short description of what happened.</p>,
  },
];

export default function FaqSection() {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) return animateFaqAccordion(listRef.current);
  }, []);

  return <div className="faq-section home-next-desktop">
    <section className="faq-section__layout" id="good-to-know" aria-labelledby="faq-title">
      <FeatureSectionIntro
        className="faq-section__intro"
        headingId="faq-title"
        title={<>Before<br />{' '}you try it</>}
        description="Your questions about Glissform, from MacBook support to privacy."
      />
      <div className="faq-section__list" ref={listRef}>
        {questions.map(({ id, question, answer }, index) => (
          <details className="faq-section__item" name="glissform-faq" key={id} open={index === 0}>
            <summary aria-controls={`faq-answer-${id}`}>
              <h3>{question}</h3>
              <svg className="faq-section__toggle" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path className="faq-section__toggle-vertical" d="M12 5v14" />
              </svg>
            </summary>
            <div className="faq-section__answer" id={`faq-answer-${id}`}>{answer}</div>
          </details>
        ))}
      </div>
    </section>
    <SiteFooter />
  </div>;
}
