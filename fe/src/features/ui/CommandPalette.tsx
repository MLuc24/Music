import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTracks } from '../tracks/hooks';
import { useAlbums } from '../albums/hooks';
import { useUIStore } from './uiStore';
import { usePlayerStore } from '../player/playerStore';
import type { Track } from '../../types/database';
import type { AlbumWithCount } from '../albums/types';

type CommandKind = 'navigation' | 'track' | 'album';

interface CommandItem {
  id: string;
  kind: CommandKind;
  title: string;
  subtitle?: string;
  icon?: string;
  thumbnail?: string | null;
  accent?: 'violet' | 'rose' | 'orange' | 'blue';
  onSelect: () => void | Promise<void>;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function CommandPalette() {
  const isOpen = useUIStore((state) => state.isCommandPaletteOpen);
  const setIsOpen = useUIStore((state) => state.setIsCommandPaletteOpen);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const setSelectedAlbumId = useUIStore((state) => state.setSelectedAlbumId);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { data: tracks } = useTracks({ q: query || undefined, limit: 8, sort: 'newest' });
  const { data: albums } = useAlbums();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSelectedIndex(0);
        setIsOpen(!useUIStore.getState().isCommandPaletteOpen);
      }

      if (event.key === 'Escape' && useUIStore.getState().isCommandPaletteOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setIsOpen]);

  const filteredAlbums = useMemo(
    () => (albums ?? []).filter((album) => album.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5),
    [albums, query],
  );

  const closePalette = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    setIsOpen(false);
  }, [setIsOpen]);

  const navigationCommands = useMemo<CommandItem[]>(
    () => [
      {
        id: 'nav-home',
        kind: 'navigation',
        title: 'Về tổng quan',
        icon: '⌂',
        accent: 'rose',
        onSelect: () => {
          setActiveView('home');
          closePalette();
        },
      },
      {
        id: 'nav-downloads',
        kind: 'navigation',
        title: 'Mở tải xuống',
        icon: '↓',
        accent: 'violet',
        onSelect: () => {
          setActiveView('downloads');
          closePalette();
        },
      },
      {
        id: 'nav-favorites',
        kind: 'navigation',
        title: 'Mở yêu thích',
        icon: '♡',
        accent: 'rose',
        onSelect: () => {
          setActiveView('favorites');
          closePalette();
        },
      },
    ],
    [closePalette, setActiveView],
  );

  const trackCommands = useMemo<CommandItem[]>(
    () =>
      (tracks ?? []).map((track: Track) => ({
        id: `track-${track.id}`,
        kind: 'track',
        title: track.title,
        subtitle: track.artist ?? 'Không rõ nghệ sĩ',
        thumbnail: track.thumbnail_url,
        onSelect: async () => {
          await playTrack(track);
          closePalette();
        },
        secondaryLabel: 'Phát tiếp',
        onSecondary: () => addToQueue([track], 'next'),
      })),
    [addToQueue, closePalette, playTrack, tracks],
  );

  const albumCommands = useMemo<CommandItem[]>(
    () =>
      filteredAlbums.map((album: AlbumWithCount) => ({
        id: `album-${album.id}`,
        kind: 'album',
        title: album.name,
        subtitle: `${album.track_count} bài hát`,
        thumbnail: album.cover_url,
        icon: '♫',
        accent: 'orange',
        onSelect: () => {
          setActiveView('albums');
          setSelectedAlbumId(album.id);
          closePalette();
        },
      })),
    [closePalette, filteredAlbums, setActiveView, setSelectedAlbumId],
  );

  const commandGroups = useMemo(
    () => [
      { title: 'Điều hướng', items: navigationCommands },
      { title: 'Bài hát', items: trackCommands },
      { title: 'Album', items: albumCommands },
    ],
    [albumCommands, navigationCommands, trackCommands],
  );

  const flatCommands = useMemo(() => commandGroups.flatMap((group) => group.items), [commandGroups]);

  const runSelectedCommand = () => {
    const command = flatCommands[selectedIndex];
    if (command) void command.onSelect();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((current) => (flatCommands.length ? (current + 1) % flatCommands.length : 0));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((current) => (flatCommands.length ? (current - 1 + flatCommands.length) % flatCommands.length : 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      runSelectedCommand();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closePalette();
    }
  };

  if (!isOpen) return null;

  let runningIndex = -1;

  return (
    <div className="command-palette__overlay" onClick={closePalette}>
      <div className="command-palette" onClick={(event) => event.stopPropagation()}>
        <div className="command-palette__search">
          <span className="command-palette__search-icon" aria-hidden="true">⌕</span>
          <input
            className="command-palette__input"
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Tìm bài hát, album hoặc thao tác..."
            aria-label="Tìm nhanh"
          />
          <kbd>Ctrl / Cmd + K</kbd>
          <button className="command-palette__esc" type="button" onClick={closePalette}>Esc</button>
          <button className="command-palette__close" type="button" onClick={closePalette} aria-label="Đóng tìm kiếm">×</button>
        </div>

        <div className="command-palette__results">
          {commandGroups.map((group) => (
            <Section title={group.title} key={group.title}>
              {group.items.length ? (
                group.items.map((command) => {
                  runningIndex += 1;
                  const itemIndex = runningIndex;
                  return (
                    <CommandButton
                      key={command.id}
                      command={command}
                      isSelected={itemIndex === selectedIndex}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                    />
                  );
                })
              ) : (
                <p className="command-palette__empty">
                  {group.title === 'Bài hát'
                    ? 'Không có bài hát phù hợp.'
                    : group.title === 'Album'
                      ? 'Không có album phù hợp.'
                      : 'Không có thao tác phù hợp.'}
                </p>
              )}
            </Section>
          ))}
        </div>

        <div className="command-palette__footer" aria-hidden="true">
          <span><kbd>↑↓</kbd> di chuyển</span>
          <span>•</span>
          <span><kbd>Enter</kbd> chọn</span>
          <span>•</span>
          <span><kbd>Esc</kbd> đóng</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="command-palette__section">
      <p className="command-palette__section-title">{title}</p>
      <div className="command-palette__section-body">{children}</div>
    </section>
  );
}

function CommandButton({
  command,
  isSelected,
  onMouseEnter,
}: {
  command: CommandItem;
  isSelected: boolean;
  onMouseEnter: () => void;
}) {
  return (
    <div className={`command-palette__item${isSelected ? ' command-palette__item--selected' : ''}`} onMouseEnter={onMouseEnter}>
      <button className="command-palette__item-main" onClick={() => void command.onSelect()}>
        <span className={`command-palette__item-icon command-palette__item-icon--${command.accent ?? 'violet'}`} aria-hidden="true">
          {command.thumbnail ? <img src={command.thumbnail} alt="" loading="lazy" /> : command.icon ?? '⌘'}
        </span>
        <span className="command-palette__item-copy">
          <strong>{command.title}</strong>
          {command.subtitle ? <small>{command.subtitle}</small> : null}
        </span>
        {command.kind !== 'track' ? <span className="command-palette__arrow" aria-hidden="true">›</span> : null}
      </button>
      {command.secondaryLabel && command.onSecondary ? (
        <button className="command-palette__item-secondary" onClick={command.onSecondary}>
          {command.secondaryLabel}
        </button>
      ) : null}
    </div>
  );
}
