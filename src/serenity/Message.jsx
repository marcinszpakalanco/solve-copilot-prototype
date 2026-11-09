import React, { useEffect, useRef, useState } from 'react';
import { Disclosure, DisclosurePanel, Heading, Button as AriaButton, Toolbar, Link } from 'react-aria-components';
import { Icon } from './Icon.jsx';
import { ButtonIcon, ToggleButtonIcon } from './ButtonIcon.jsx';

const cx = (...a) => a.filter(Boolean).join(' ');

// Serenity Message, content=text, variant=subtle: the person's message, right-aligned (Enter/Item when it arrives).
export function Message({ children, index = 0 }) {
  return (
    <div className="srn-message-row motion-enter-item" style={{ '--i': index }}>
      <div className="srn-message srn-message--subtle text-body-large">{children}</div>
    </div>
  );
}

// Serenity Link: Citation: a source chip inside an answer.
export function LinkCitation({ children }) {
  return (
    <Link href="#" onPress={() => {}} className={({ isFocusVisible }) => cx('srn-citation', 'text-caption-medium', 'motion-feedback-hover', isFocusVisible && 'effect-focus-neutral')}>
      <Icon name="file-text" className="srn-icon srn-icon--xs" />
      {children}
    </Link>
  );
}

// A label that cross-fades when its word changes (Feedback/Label).
function ChangingLabel({ text, className }) {
  return (
    <span className={cx('motion-feedback-label', className)}>
      <span key={text} data-motion-part="enter">{text}</span>
    </span>
  );
}

// Serenity Disclosure: Activity: the model's reasoning and tool use above the answer, collapsed by default.
// While pending the leading icon is a spinner (Loop/Spin) and the label shimmers (Loop/Shimmer).
export function DisclosureActivity({ label, steps, isPending }) {
  return (
    <Disclosure className="srn-activity">
      {({ isExpanded }) => (
        <>
          <Heading level={3} className="srn-activity-heading">
            <AriaButton slot="trigger" className={({ isFocusVisible }) => cx('srn-activity-trigger', 'text-body-medium', 'motion-feedback-hover', isFocusVisible && 'effect-focus-neutral')}>
              {isPending
                ? <span className="srn-spinner motion-loop-spin" aria-hidden="true" />
                : <Icon name="thought" className="srn-icon srn-icon--s" />}
              <ChangingLabel text={label} className={isPending ? 'motion-loop-shimmer' : undefined} />
              <Icon name={isExpanded ? 'chevron-down-small' : 'chevron-right-small'} className="srn-icon srn-icon--s" />
            </AriaButton>
          </Heading>
          <DisclosurePanel className="srn-activity-panel motion-expand-height">
            <ol className="srn-activity-steps">
              {steps.map((s, i) => (
                <li key={i} className="srn-activity-step motion-enter-item" style={{ '--i': i }}>
                  <span className="srn-activity-row text-body-medium">
                    <Icon name={s.icon} className="srn-icon srn-icon--s" />
                    {s.text}
                  </span>
                  {s.sources?.length > 0 && (
                    <span className="srn-activity-sources">{s.sources.map((c) => <LinkCitation key={c}>{c}</LinkCitation>)}</span>
                  )}
                </li>
              ))}
            </ol>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

// Serenity Toolbar: Message: copy, good response, bad response, regenerate, read aloud.
export function ToolbarMessage({ text, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(null);
  const [reading, setReading] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch (e) { /* the prototype still confirms */ }
    setCopied(true); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Toolbar aria-label="Message actions" className="srn-toolbar-message motion-enter-fade">
      <ButtonIcon
        label={copied ? 'Copied' : 'Copy'}
        size="xs"
        onPress={copy}
        icon={
          <span className={cx('motion-feedback-icon', copied && 'is-on')} data-motion-play={copied || undefined}>
            <Icon name="copy" data-motion-part="off" />
            <Icon name="check" data-motion-part="on" />
          </span>
        }
      />
      {rating !== 'bad' && <ToggleButtonIcon icon="thumbs-up" label="Good response" isSelected={rating === 'good'} onChange={(on) => setRating(on ? 'good' : null)} />}
      {rating !== 'good' && <ToggleButtonIcon icon="thumbs-down" label="Bad response" isSelected={rating === 'bad'} onChange={(on) => setRating(on ? 'bad' : null)} />}
      <ButtonIcon icon="refresh-ai" label="Regenerate" size="xs" onPress={onRegenerate} />
      <ToggleButtonIcon icon="sound-high" label="Read aloud" isSelected={reading} onChange={setReading} />
      <span className="srn-visually-hidden" role="status" aria-live="polite">{copied ? 'Copied' : ''}</span>
    </Toolbar>
  );
}

// Serenity Message: Response: the answer with no bubble. isPending streams with the caret (Enter/Stream).
export function MessageResponse({ status, activityLabel, steps, heading, chunks, citation, onRegenerate, index = 0 }) {
  const isPending = status === 'thinking' || status === 'streaming';
  const text = chunks.join('');
  return (
    <article className="srn-response motion-enter-item" style={{ '--i': index }} aria-busy={isPending || undefined} aria-label="Answer">
      <DisclosureActivity label={activityLabel} steps={steps} isPending={isPending} />
      {(status !== 'thinking' || chunks.length > 0) && (
        <div className="srn-response-slot motion-enter-stream" aria-busy={status === 'streaming' || undefined}>
          {heading && chunks.length > 0 && <h2 className="text-subtitle-small srn-response-heading motion-enter-fade">{heading}</h2>}
          <p className="text-body-large srn-response-text">
            {chunks.map((c, i) => <span key={i} data-motion-part="chunk">{c}</span>)}
            <span className="srn-caret" data-motion-part="caret" aria-hidden="true" />
          </p>
          {citation && !isPending && <div className="srn-response-citations motion-enter-fade"><LinkCitation>{citation}</LinkCitation></div>}
          {status === 'stopped' && <p className="text-caption-medium srn-text-secondary motion-enter-fade">You stopped this answer.</p>}
        </div>
      )}
      {!isPending && <ToolbarMessage text={`${heading ? heading + '\n\n' : ''}${text}`} onRegenerate={onRegenerate} />}
    </article>
  );
}
