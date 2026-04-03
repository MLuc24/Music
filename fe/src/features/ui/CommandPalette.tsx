import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTracks } from '../tracks/hooks';
import { useAlbums } from '../albums/hooks';
import { useUIStore } from './uiStore';
import { usePlayerStore } from '../player/playerStore';

export function CommandPalette() {
  const isOpen = useUIStore((state) => state.isCommandPaletteOpen);
  const setIsOpen = useUIStore((state) => state.setIsCommandPaletteOpen);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const setSelectedAlbumId = useUIStore((state) => state.setSelectedAlbumId);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const [query, setQuery] = useState('');
  const { data: tracks } = useTracks({ q: query || undefined, limit: 8, sort: 'newest' });
  const { data: albums } = useAlbums();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(!useUIStore.getState().isCommandPaletteOpen);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setIsOpen]);

  const filteredAlbums = useMemo(
    () => (albums ?? []).filter((album) => album.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5),
    [albums, query],
  );

  const closePalette = () => {
    setQuery('');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette__overlay" onClick={closePalette}>
      <div className="command-palette" onClick={(event) => event.stopPropagation()}>
        <input
          className="command-palette__input"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm bài hát, album hoặc thao tác..."
        />

        <div className="command-palette__results">
          <Section title="Điều hướng">
            <CommandButton label="Về Home" onClick={() => {
              setActiveView('home');
              closePalette();
            }} />
            <CommandButton label="Mở Downloads" onClick={() => {
              setActiveView('downloads');
              closePalette();
            }} />
            <CommandButton label="Mở Favorites" onClick={() => {
              setActiveView('favorites');
              closePalette();
            }} />
          </Section>

          <Section title="Bài hát">
            {(tracks ?? []).map((track) => (
              <CommandButton
                key={track.id}
                label={track.artist ? `${track.title} • ${track.artist}` : track.title}
                onClick={async () => {
                  await playTrack(track);
                  closePalette();
                }}
                secondaryActionLabel="Phát tiếp"
                onSecondaryAction={() => addToQueue([track], 'next')}
              />
            ))}
          </Section>

          <Section title="Albums">
            {filteredAlbums.map((album) => (
              <CommandButton
                key={album.id}
                label={album.name}
                onClick={() => {
                  setActiveView('albums');
                  setSelectedAlbumId(album.id);
                  closePalette();
                }}
              />
            ))}
          </Section>
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
  label,
  onClick,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  label: string;
  onClick: () => void | Promise<void>;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <div className="command-palette__item">
      <button className="command-palette__item-main" onClick={() => void onClick()}>
        {label}
      </button>
      {secondaryActionLabel && onSecondaryAction ? (
        <button className="command-palette__item-secondary" onClick={onSecondaryAction}>
          {secondaryActionLabel}
        </button>
      ) : null}
    </div>
  );
}
