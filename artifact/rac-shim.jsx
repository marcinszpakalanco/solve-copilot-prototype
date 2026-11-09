// A small stand-in for react-aria-components, used only for the single-file artifact build
// (the container has no react-aria-components package). It keeps the same props, render props
// and data attributes (data-hovered, data-pressed, data-focus-visible, data-selected, data-expanded,
// data-exiting) so the prototype's Serenity CSS and motion classes behave the same.
import React, { createContext, forwardRef, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const cx = (...a) => a.filter(Boolean).join(' ');
const call = (v, s) => (typeof v === 'function' ? v(s) : v);
const setRef = (ref, el) => { if (typeof ref === 'function') ref(el); else if (ref) ref.current = el; };
const STRIP = ['onPress', 'isPending', 'isDisabled', 'isSelected', 'onChange', 'slot', 'textValue', 'onHoverStart', 'onHoverEnd'];
const strip = (p) => { const o = { ...p }; STRIP.forEach((k) => delete o[k]); return o; };

// Hover (mouse only), press and keyboard focus-visible state for any element.
function useInteractions(extra = {}) {
  const [st, setSt] = useState({ isHovered: false, isPressed: false, isFocusVisible: false, isFocused: false });
  const set = (k, v) => setSt((s) => (s[k] === v ? s : { ...s, [k]: v }));
  const handlers = {
    onPointerEnter: (e) => { if (e.pointerType === 'mouse') set('isHovered', true); extra.onPointerEnter?.(e); },
    onPointerLeave: (e) => { set('isHovered', false); set('isPressed', false); extra.onPointerLeave?.(e); },
    onPointerDown: (e) => { set('isPressed', true); extra.onPointerDown?.(e); },
    onPointerUp: () => set('isPressed', false),
    onPointerCancel: () => set('isPressed', false),
    onFocus: (e) => { set('isFocused', true); let fv = false; try { fv = e.currentTarget.matches(':focus-visible'); } catch (_) {} set('isFocusVisible', fv); extra.onFocus?.(e); },
    onBlur: (e) => { set('isFocused', false); set('isFocusVisible', false); extra.onBlur?.(e); },
  };
  const data = {
    'data-hovered': st.isHovered || undefined,
    'data-pressed': st.isPressed || undefined,
    'data-focus-visible': st.isFocusVisible || undefined,
    'data-focused': st.isFocused || undefined,
  };
  return { st, handlers, data };
}

// ---------- Tooltip ----------
const TooltipCtx = createContext(null);
export function TooltipTrigger({ children, delay = 600 }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const timer = useRef(null);
  const show = (el, now) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setRect(el.getBoundingClientRect()); setOpen(true); }, now ? 0 : delay);
  };
  const hide = () => { clearTimeout(timer.current); setOpen(false); };
  useEffect(() => () => clearTimeout(timer.current), []);
  const kids = React.Children.toArray(children);
  return (
    <TooltipCtx.Provider value={{ open, rect }}>
      <span
        style={{ display: 'contents' }}
        onPointerOver={(e) => { if (e.pointerType === 'mouse') { const t = e.target.closest('button,a'); if (t) show(t); } }}
        onPointerOut={hide}
        onPointerDown={hide}
        onFocus={(e) => { let fv = false; try { fv = e.target.matches(':focus-visible'); } catch (_) {} if (fv) show(e.target, true); }}
        onBlur={hide}
      >
        {kids[0]}
      </span>
      {kids.slice(1)}
    </TooltipCtx.Provider>
  );
}
export function Tooltip({ children, className, placement = 'bottom', offset = 6 }) {
  const ctx = useContext(TooltipCtx);
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    if (!ctx?.open || !ctx.rect || !ref.current) return;
    const r = ctx.rect; const t = ref.current.getBoundingClientRect();
    let top = placement === 'top' ? r.top - t.height - offset : r.bottom + offset;
    if (top + t.height > innerHeight - 4) top = r.top - t.height - offset;
    let left = r.left + r.width / 2 - t.width / 2;
    left = Math.max(4, Math.min(left, innerWidth - t.width - 4));
    setPos({ top, left });
  }, [ctx?.open, ctx?.rect]);
  if (!ctx?.open) return null;
  return createPortal(
    <div ref={ref} role="tooltip" className={className} data-placement={placement}
      style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, zIndex: 50, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
      {children}
    </div>, document.body);
}
export const OverlayArrow = () => null;

// ---------- Button, ToggleButton, Link ----------
const MenuCtx = createContext(null);
const DisclosureCtx = createContext(null);

export const Button = forwardRef(function Button(props, ref) {
  const menu = useContext(MenuCtx);
  const disc = useContext(DisclosureCtx);
  const isTrigger = props.slot === 'trigger' && disc;
  const isMenuTrigger = menu && !menu.inside;
  const { st, handlers, data } = useInteractions();
  const state = { ...st, isPending: !!props.isPending, isDisabled: !!props.isDisabled };
  const onClick = (e) => {
    if (props.isPending || props.isDisabled) { e.preventDefault(); return; }
    if (isTrigger) disc.toggle();
    if (isMenuTrigger) menu.toggle(e.currentTarget);
    props.onPress?.(e);
  };
  const aria = {};
  if (isTrigger) { aria['aria-expanded'] = disc.isExpanded; aria['aria-controls'] = disc.panelId; }
  if (isMenuTrigger) { aria['aria-haspopup'] = 'menu'; aria['aria-expanded'] = menu.open; }
  return (
    <button
      {...strip(props)}
      {...aria}
      ref={(el) => { setRef(ref, el); if (isMenuTrigger) menu.triggerRef.current = el; }}
      type={props.type ?? 'button'}
      disabled={props.isDisabled}
      aria-disabled={props.isPending || undefined}
      data-pending={props.isPending || undefined}
      data-disabled={props.isDisabled || undefined}
      {...data}
      {...handlers}
      onClick={onClick}
      className={call(props.className, state)}
      style={call(props.style, state)}
    >
      {call(props.children, state)}
    </button>
  );
});

export const ToggleButton = forwardRef(function ToggleButton(props, ref) {
  const { st, handlers, data } = useInteractions();
  const [inner, setInner] = useState(!!props.defaultSelected);
  const isSelected = props.isSelected ?? inner;
  const state = { ...st, isSelected };
  return (
    <button
      {...strip(props)}
      ref={ref}
      type="button"
      aria-pressed={isSelected}
      data-selected={isSelected || undefined}
      {...data}
      {...handlers}
      onClick={() => { const v = !isSelected; setInner(v); props.onChange?.(v); }}
      className={call(props.className, state)}
    >
      {call(props.children, state)}
    </button>
  );
});

export const Link = forwardRef(function Link(props, ref) {
  const { st, handlers, data } = useInteractions();
  return (
    <a
      {...strip(props)}
      ref={ref}
      {...data}
      {...handlers}
      onClick={(e) => { if (props.href === '#' || props.onPress) e.preventDefault(); props.onPress?.(e); }}
      className={call(props.className, st)}
    >
      {call(props.children, st)}
    </a>
  );
});

// ---------- Plain wrappers ----------
export function Heading({ level = 3, children, ...p }) { const H = `h${level}`; return <H {...p}>{children}</H>; }
export function Text({ slot, children, elementType = 'span', ...p }) { const E = elementType; return <E {...p}>{children}</E>; }
export function Label({ children, ...p }) { return <label {...p}>{children}</label>; }
export function Toolbar({ children, className, ...p }) { return <div role="toolbar" aria-orientation="horizontal" {...p} className={call(className, {})}>{children}</div>; }

// ---------- TextField / TextArea ----------
const FieldCtx = createContext(null);
export function TextField({ children, value, onChange, className, autoFocus, ...p }) {
  return (
    <div className={call(className, {})}>
      <FieldCtx.Provider value={{ value, onChange, autoFocus, ariaLabel: p['aria-label'] }}>{children}</FieldCtx.Provider>
    </div>
  );
}
export const TextArea = forwardRef(function TextArea({ className, ...p }, ref) {
  const f = useContext(FieldCtx) || {};
  const local = useRef(null);
  useEffect(() => {
    // keep the auto-grow height in sync when the value is cleared after sending
    const t = local.current; if (!t) return; t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`;
  }, [f.value]);
  return (
    <textarea
      {...p}
      ref={(el) => { local.current = el; setRef(ref, el); }}
      aria-label={f.ariaLabel}
      autoFocus={f.autoFocus}
      value={f.value}
      onChange={(e) => f.onChange?.(e.target.value)}
      className={call(className, {})}
    />
  );
});

// ---------- Disclosure ----------
let uid = 0;
export function Disclosure({ children, className, defaultExpanded = false }) {
  const [isExpanded, setExpanded] = useState(defaultExpanded);
  const [panelId] = useState(() => `disclosure-${++uid}`);
  const state = { isExpanded };
  return (
    <DisclosureCtx.Provider value={{ isExpanded, toggle: () => setExpanded((v) => !v), panelId }}>
      <div className={call(className, state)} data-expanded={isExpanded || undefined}>{call(children, state)}</div>
    </DisclosureCtx.Provider>
  );
}
export function DisclosurePanel({ children, className }) {
  const d = useContext(DisclosureCtx);
  const ref = useRef(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    // like React Aria, a collapsed panel is hidden once its height transition ends
    if (first.current) { first.current = false; el.style.setProperty('--disclosure-panel-height', d.isExpanded ? 'auto' : '0px'); el.hidden = !d.isExpanded; return; }
    clearTimeout(el._t);
    if (d.isExpanded) {
      el.hidden = false;
      el.style.setProperty('--disclosure-panel-height', `${el.scrollHeight}px`);
      el._t = setTimeout(() => el.style.setProperty('--disclosure-panel-height', 'auto'), 260);
    } else {
      el.style.setProperty('--disclosure-panel-height', `${el.scrollHeight}px`);
      el.getBoundingClientRect();
      requestAnimationFrame(() => el.style.setProperty('--disclosure-panel-height', '0px'));
      el._t = setTimeout(() => { el.hidden = true; }, 260);
    }
  }, [d.isExpanded]);
  return (
    <div ref={ref} id={d.panelId} role="group" className={call(className, { isExpanded: d.isExpanded })}
      data-expanded={d.isExpanded || undefined} aria-hidden={!d.isExpanded || undefined} inert={d.isExpanded ? undefined : ''}>
      {children}
    </div>
  );
}

// Keep an overlay mounted for its exit animation (data-exiting) after it closes.
function usePresence(open, ms = 260) {
  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    if (open) { setMounted(true); setExiting(false); return; }
    if (!mounted) return;
    setExiting(true);
    const t = setTimeout(() => { setMounted(false); setExiting(false); }, ms);
    return () => clearTimeout(t);
  }, [open]);
  return { mounted, exiting };
}

// ---------- Menu ----------
export function MenuTrigger({ children }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const toggle = () => setOpen((v) => !v);
  const close = useCallback(() => { setOpen(false); triggerRef.current?.focus({ preventScroll: true }); }, []);
  return <MenuCtx.Provider value={{ open, toggle, close, triggerRef }}>{children}</MenuCtx.Provider>;
}
export function Popover({ children, className, placement = 'bottom end', offset = 8 }) {
  const m = useContext(MenuCtx);
  const { mounted, exiting } = usePresence(m.open, 200);
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    if (!mounted || exiting || !ref.current || !m.triggerRef.current) return;
    const r = m.triggerRef.current.getBoundingClientRect(); const p = ref.current.getBoundingClientRect();
    const end = placement.includes('end');
    let left = end ? r.right - p.width : r.left;
    left = Math.max(8, Math.min(left, innerWidth - p.width - 8));
    let top = r.bottom + offset; let origin = 'top';
    if (top + p.height > innerHeight - 8) { top = r.top - p.height - offset; origin = 'bottom'; }
    setPos({ top: Math.max(8, top), left, origin: `${origin} ${end ? 'right' : 'left'}` });
  }, [mounted, exiting]);
  useEffect(() => {
    if (!m.open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target) && !m.triggerRef.current?.contains(e.target)) m.close(); };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); m.close(); } };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey, true); };
  }, [m.open]);
  if (!mounted) return null;
  return createPortal(
    <div ref={ref} className={call(className, {})} data-exiting={exiting || undefined} data-placement={placement}
      style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, zIndex: 40, '--trigger-anchor-point': pos?.origin ?? 'top right', maxWidth: 'calc(100vw - 16px)' }}>
      <MenuCtx.Provider value={{ ...m, inside: true }}>{children}</MenuCtx.Provider>
    </div>, document.body);
}
const MenuListCtx = createContext(null);
export function Menu({ children, className, onAction, selectedKeys = [], selectionMode, ...p }) {
  const m = useContext(MenuCtx);
  const ref = useRef(null);
  useEffect(() => {
    const items = ref.current?.querySelectorAll('[role^="menuitem"]');
    const sel = ref.current?.querySelector('[aria-checked="true"]');
    (sel || items?.[0])?.focus({ preventScroll: true });
  }, []);
  const onKeyDown = (e) => {
    const items = [...ref.current.querySelectorAll('[role^="menuitem"]')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
    if (e.key === 'Home') { e.preventDefault(); items[0]?.focus(); }
    if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus(); }
    if (e.key === 'Tab') m?.close();
  };
  const selected = new Set([...selectedKeys].map(String));
  return (
    <MenuListCtx.Provider value={{ selected, selectionMode, action: (id) => { onAction?.(id); m?.close(); } }}>
      <div {...p} ref={ref} role="menu" tabIndex={-1} className={call(className, {})} onKeyDown={onKeyDown}>{children}</div>
    </MenuListCtx.Provider>
  );
}
export function MenuItem({ id, children, className, textValue }) {
  const list = useContext(MenuListCtx);
  const { st, handlers, data } = useInteractions({ onPointerEnter: (e) => { if (e.pointerType === 'mouse') e.currentTarget.focus({ preventScroll: true }); } });
  const isSelected = list.selected.has(String(id));
  const state = { ...st, isSelected, isFocused: st.isFocused || st.isHovered };
  return (
    <div
      role={list.selectionMode === 'single' ? 'menuitemradio' : 'menuitem'}
      aria-checked={list.selectionMode ? isSelected : undefined}
      aria-label={textValue}
      tabIndex={-1}
      data-selected={isSelected || undefined}
      {...data}
      {...handlers}
      onClick={() => list.action(id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); list.action(id); } }}
      className={call(className, state)}
    >
      {call(children, state)}
    </div>
  );
}

// ---------- Modal ----------
const ModalCtx = createContext(null);
export function ModalOverlay({ isOpen, onOpenChange, isDismissable, className, children }) {
  const { mounted, exiting } = usePresence(isOpen, 320);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onOpenChange?.(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [isOpen]);
  if (!mounted) return null;
  return createPortal(
    <div className={call(className, {})} data-exiting={exiting || undefined}
      onPointerDown={(e) => { if (isDismissable && e.target === e.currentTarget) onOpenChange?.(false); }}>
      <ModalCtx.Provider value={{ exiting }}>{children}</ModalCtx.Provider>
    </div>, document.body);
}
export function Modal({ children, className, ...p }) {
  const m = useContext(ModalCtx);
  return <div {...p} className={call(className, {})} data-exiting={m?.exiting || undefined}>{children}</div>;
}
export function Dialog({ children, className, ...p }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  return <section {...p} ref={ref} role="dialog" aria-modal="true" tabIndex={-1} className={call(className, {})}>{call(children, { close: () => {} })}</section>;
}
