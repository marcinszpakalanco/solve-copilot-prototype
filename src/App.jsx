import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ModalOverlay, Modal, Dialog, Heading } from 'react-aria-components';
import { Sidebar } from './serenity/Sidebar.jsx';
import { PromptField } from './serenity/PromptField.jsx';
import { Message, MessageResponse } from './serenity/Message.jsx';
import { Button } from './serenity/Button.jsx';
import { ButtonIcon } from './serenity/ButtonIcon.jsx';
import { LogoSolve } from './serenity/Icon.jsx';

const cx = (...a) => a.filter(Boolean).join(' ');

const PROJECTS = ['Cardiology research', 'Nutrition claims', 'Clinic onboarding'];
const INITIAL_CHATS = [
  { id: 'fasting', title: 'Fasting and blood pressure' },
  { id: 'vitd', title: 'Vitamin D dosage claims' },
  { id: 'tiktok', title: 'TikTok sleep hack check' },
  { id: 'statins', title: 'Statins and memory' },
  { id: 'labs', title: 'Lab report summary' },
  { id: 'keto', title: 'Keto and cholesterol' },
];
const STARTERS = ['Research a topic', 'Check a claim', 'Analyze a document', 'Check a video'];

// The scripted answer the prototype plays for any prompt.
const ANSWER = {
  heading: 'A small drop, mostly from weight loss',
  text: 'In trials of 8 to 12 weeks, time-restricted eating lowered systolic blood pressure by about 3 to 5 mmHg. Most of the effect came from weight loss, so people who kept their weight saw little change. Ask your doctor before you fast if you take blood pressure medicine.',
  citation: 'Lee et al., 2025',
  steps: [
    { icon: 'search-ai', text: 'Searched PubMed and Cochrane for trials of time-restricted eating and blood pressure.', sources: ['PubMed'] },
    { icon: 'file-text', text: 'Read 6 trials from 2019 to 2025 and checked how each measured blood pressure.', sources: ['Lee et al., 2025', 'Cochrane review, 2024'] },
    { icon: 'chart-bar', text: 'Compared the trials and flagged one with no control group.', sources: [] },
  ],
};
const chunk = (t) => t.match(/\S+\s*/g) ?? [];

const doneAnswer = () => ({ role: 'assistant', status: 'done', activityLabel: 'Checked 6 sources in 14 s', heading: ANSWER.heading, chunks: chunk(ANSWER.text), citation: ANSWER.citation, steps: ANSWER.steps });
const FASTING = [{ role: 'user', text: 'Does intermittent fasting lower blood pressure?' }, doneAnswer()];

// The screen map: every state is reachable by a control or by ?screen=<id>.
const SCREENS = {
  new: { chat: null, messages: [] },
  answered: { chat: 'fasting', messages: FASTING },
  thinking: { chat: 'fasting', messages: [FASTING[0], { ...doneAnswer(), status: 'thinking', activityLabel: 'Searching 3 medical databases', chunks: [] }], hold: true },
  streaming: { chat: 'fasting', messages: [FASTING[0], { ...doneAnswer(), status: 'streaming', activityLabel: 'Reading 6 trials', chunks: chunk(ANSWER.text).slice(0, 14) }], hold: true },
  stopped: { chat: 'fasting', messages: [FASTING[0], { ...doneAnswer(), status: 'stopped', activityLabel: 'Stopped', chunks: chunk(ANSWER.text).slice(0, 14), citation: null }] },
  nav: { chat: null, messages: [], nav: true },
};

function useWide(query = '(min-width: 1024px)') {
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => { const m = window.matchMedia(query); const on = () => setWide(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on); }, [query]);
  return wide;
}

export function App({ initial }) {
  const start = SCREENS[initial] ?? SCREENS.new;
  const wide = useWide();
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [chatId, setChatId] = useState(start.chat);
  const [messages, setMessages] = useState(start.messages);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('solve-1.5');
  const [webSearch, setWebSearch] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(!!start.nav);
  const [viewKey, setViewKey] = useState(0);
  const timers = useRef([]);
  const threadRef = useRef(null);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => clearTimers, []);

  const last = messages[messages.length - 1];
  const isPending = last?.role === 'assistant' && (last.status === 'thinking' || last.status === 'streaming');

  const patchLast = (fn) => setMessages((ms) => { const c = ms.slice(); c[c.length - 1] = fn(c[c.length - 1]); return c; });

  // Plays the answer: thinking, then streaming word by word, then done.
  const play = useCallback(() => {
    clearTimers();
    const words = chunk(ANSWER.text);
    later(() => patchLast((m) => ({ ...m, activityLabel: 'Reading 6 trials' })), 1400);
    later(() => patchLast((m) => ({ ...m, status: 'streaming', activityLabel: 'Writing the answer' })), 2600);
    words.forEach((w, i) => later(() => patchLast((m) => (m.status === 'streaming' ? { ...m, chunks: [...m.chunks, w] } : m)), 2700 + i * 55));
    later(() => patchLast((m) => (m.status === 'streaming' ? { ...m, status: 'done', activityLabel: 'Checked 6 sources in 14 s' } : m)), 2800 + words.length * 55);
  }, []);

  const send = (text) => {
    const pending = { role: 'assistant', status: 'thinking', activityLabel: 'Searching 3 medical databases', heading: ANSWER.heading, chunks: [], citation: ANSWER.citation, steps: ANSWER.steps };
    setMessages((ms) => [...ms, { role: 'user', text }, pending]);
    if (!chatId) {
      const id = `chat-${Date.now()}`;
      setChats((cs) => [{ id, title: text.length > 32 ? `${text.slice(0, 32).trim()}…` : text }, ...cs]);
      setChatId(id);
    }
    setPrompt('');
    play();
  };

  const stop = () => { clearTimers(); patchLast((m) => ({ ...m, status: 'stopped', activityLabel: 'Stopped', citation: null })); };

  const regenerate = () => { patchLast((m) => ({ ...m, status: 'thinking', activityLabel: 'Searching 3 medical databases', chunks: [], citation: ANSWER.citation })); play(); };

  const newChat = () => { clearTimers(); setChatId(null); setMessages([]); setPrompt(''); setNavOpen(false); setViewKey((k) => k + 1); };
  const openChat = (id) => { clearTimers(); setChatId(id); setMessages(id === 'fasting' ? FASTING : [{ role: 'user', text: chats.find((c) => c.id === id)?.title ?? '' }, doneAnswer()]); setNavOpen(false); setViewKey((k) => k + 1); };

  // Esc stops a streaming answer anywhere on the page.
  useEffect(() => { const on = (e) => { if (e.key === 'Escape' && isPending) stop(); }; window.addEventListener('keydown', on); return () => window.removeEventListener('keydown', on); }, [isPending]);
  // Keep the newest message in view.
  useEffect(() => { const t = threadRef.current; if (t) t.scrollTop = t.scrollHeight; }, [messages]);

  const sidebar = (inSheet) => (
    <Sidebar projects={PROJECTS} chats={chats} currentChat={chatId} onNewChat={newChat} onOpenChat={openChat}
      inSheet={inSheet} collapseLabel={inSheet ? 'Close menu' : 'Close sidebar'}
      onCollapse={() => (inSheet ? setNavOpen(false) : setSidebarOpen(false))} />
  );
  const showSidebar = wide && sidebarOpen;
  const field = (
    <PromptField value={prompt} onChange={setPrompt} onSubmit={send} onStop={stop} isPending={isPending}
      size={wide ? 'l' : 'm'} placeholder={wide ? undefined : 'Ask anything'} model={model} onModelChange={setModel}
      webSearch={webSearch} onWebSearchChange={setWebSearch} autoFocus={wide && messages.length === 0} />
  );

  return (
    <div className={cx('srn-shell', showSidebar && 'has-sidebar')}>
      {wide && <div className={cx('srn-sidebar-slot', 'motion-expand-width')} data-expanded={sidebarOpen || undefined} aria-hidden={!sidebarOpen || undefined} inert={!sidebarOpen ? '' : undefined}>{sidebar(false)}</div>}
      <main className="srn-pane" aria-label="Chat">
        <header className="srn-header">
          {(!wide || !sidebarOpen) && (
            <div className="srn-header-start motion-enter-fade">
              <ButtonIcon icon={wide ? 'sidebar' : 'menu'} label={wide ? 'Open sidebar' : 'Open menu'} onPress={() => (wide ? setSidebarOpen(true) : setNavOpen(true))} />
              {wide && <ButtonIcon icon="edit" label="New chat" onPress={newChat} />}
            </div>
          )}
          <span className="srn-header-spacer" />
          {messages.length > 0 && <ButtonIcon icon="share" label="Share chat" />}
          <ButtonIcon icon="more" label="More actions" />
          {!wide && <ButtonIcon icon="edit" label="New chat" onPress={newChat} />}
        </header>

        {messages.length === 0 ? (
          <section key={`start-${viewKey}`} className="srn-start motion-navigate-fade" aria-labelledby="start-title">
            <div className="srn-column srn-start-column">
              <Heading level={1} id="start-title" className="text-subtitle-large srn-start-title">How can I help you?</Heading>
              {field}
              <div role="group" aria-label="Suggested prompts" className="srn-starters">
                {STARTERS.map((s) => <Button key={s} variant="outlined" tone="secondary" size="s" onPress={() => send(s)}>{s}</Button>)}
              </div>
            </div>
          </section>
        ) : (
          <>
            <section key={`thread-${viewKey}`} ref={threadRef} className="srn-thread motion-navigate-fade" aria-label="Conversation" aria-live="polite">
              <div className="srn-column srn-thread-column">
                {messages.map((m, i) => (m.role === 'user'
                  ? <Message key={i}>{m.text}</Message>
                  : <MessageResponse key={i} {...m} onRegenerate={regenerate} />))}
              </div>
            </section>
            <footer className="srn-footer">
              <div className="srn-column">{field}</div>
              <p className="text-caption-medium srn-text-secondary srn-disclaimer">Solve can make mistakes. Check the sources.</p>
            </footer>
          </>
        )}
      </main>

      {/* Below 1024 the Sidebar opens as a Sheet position=start over a modal Scrim (Enter/Sheet, Enter/Scrim). */}
      <ModalOverlay isOpen={!wide && navOpen} onOpenChange={setNavOpen} isDismissable className="srn-scrim motion-enter-scrim motion-exit-scrim">
        <Modal className="srn-sheet motion-enter-sheet motion-exit-sheet" data-motion-edge="start">
          <Dialog aria-label="Chats and projects" className="srn-sheet-dialog">{sidebar(true)}</Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  );
}
