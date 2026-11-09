import React from 'react';
import { Link } from 'react-aria-components';
import { Icon, LogoSolve } from './Icon.jsx';
import { ButtonIcon } from './ButtonIcon.jsx';

const cx = (...a) => a.filter(Boolean).join(' ');

// Serenity NavigationTreeItem: one row of the Sidebar; isCurrent marks the open chat (aria-current).
function NavigationTreeItem({ label, icon, isCurrent, onPress }) {
  return (
    <li>
      <Link
        href="#"
        aria-current={isCurrent ? 'page' : undefined}
        onPress={onPress}
        className={({ isFocusVisible }) => cx('srn-nav-item', 'text-body-medium', 'motion-feedback-hover', isCurrent && 'is-current', isFocusVisible && 'effect-focus-inset-neutral')}
      >
        {icon && <Icon name={icon} className="srn-icon srn-icon--s" />}
        <span className="srn-nav-label">{label}</span>
      </Link>
    </li>
  );
}

// Serenity NavigationTreeSection: a labelled group of items.
function NavigationTreeSection({ label, children }) {
  const id = `nav-${label.toLowerCase()}`;
  return (
    <section className="srn-nav-section" aria-labelledby={id}>
      <h2 id={id} className="srn-nav-section-label text-caption-medium">{label}</h2>
      <ul className="srn-nav-list">{children}</ul>
    </section>
  );
}

// Serenity Sidebar, type=basic, isExpanded=on: logo, actions, NavigationTree, account.
export function Sidebar({ projects, chats, currentChat, onNewChat, onOpenChat, onCollapse, collapseLabel = 'Close sidebar', inSheet }) {
  return (
    <nav className={cx('srn-sidebar', inSheet && 'srn-sidebar--sheet')} aria-label="Chats and projects">
      <div className="srn-sidebar-top">
        <LogoSolve />
        <ButtonIcon icon={inSheet ? 'close' : 'sidebar'} label={collapseLabel} onPress={onCollapse} />
      </div>
      <ul className="srn-nav-list srn-sidebar-actions">
        <NavigationTreeItem label="New chat" icon="plus" onPress={onNewChat} />
        <NavigationTreeItem label="Search chats" icon="search" onPress={() => {}} />
      </ul>
      <div className="srn-sidebar-tree">
        <NavigationTreeSection label="Projects">
          {projects.map((p) => <NavigationTreeItem key={p} label={p} icon="folder" onPress={() => {}} />)}
        </NavigationTreeSection>
        <NavigationTreeSection label="Chats">
          {chats.map((c) => <NavigationTreeItem key={c.id} label={c.title} isCurrent={c.id === currentChat} onPress={() => onOpenChat(c.id)} />)}
        </NavigationTreeSection>
      </div>
      <div className="srn-sidebar-bottom">
        <span className="srn-avatar text-caption-strong-medium" role="img" aria-label="Amara Okafor">AO</span>
        <span className="text-body-medium srn-sidebar-name">Amara Okafor</span>
      </div>
    </nav>
  );
}
