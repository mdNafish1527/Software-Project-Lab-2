// frontend/src/components/MediaViewer.jsx
//
// Reusable component that renders a complaint's attached media array.
// Used in both OrganizerDashboard and AdminDashboard complaint cards.
//
// Props:
//   media  — array of { type: 'image'|'audio'|'video'|'file', url, name, size }
//   limit  — max items to show before "show more" (default: all)

import { useState } from 'react';

const formatBytes = (bytes) => {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function ImageItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Thumbnail */}
      <div
        onClick={() => setOpen(true)}
        title="Click to enlarge"
        style={{
          width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden',
          border: '1px solid rgba(0,212,255,0.15)', cursor: 'zoom-in', flexShrink: 0,
          background: '#040810',
        }}
      >
        <img
          src={item.url}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.alt = '(image unavailable)'; }}
        />
      </div>

      {/* Lightbox */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <img
            src={item.url}
            alt={item.name}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '10px', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', top: '16px', right: '20px',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%', width: '36px', height: '36px',
              color: '#fff', cursor: 'pointer', fontSize: '18px',
            }}
          >✕</button>
          <div
            style={{
              position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)', borderRadius: '8px', padding: '6px 14px',
              fontSize: '12px', color: '#aaa',
            }}
          >
            {item.name} · {formatBytes(item.size)}
          </div>
        </div>
      )}
    </>
  );
}

function AudioItem({ item }) {
  return (
    <div style={{
      background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
      borderRadius: '10px', padding: '10px 14px', minWidth: '220px', maxWidth: '320px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>🎵</span>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontSize: '11px', color: '#00d4ff', fontWeight: '600',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px',
          }}>{item.name}</div>
          <div style={{ fontSize: '10px', color: '#666' }}>{formatBytes(item.size)}</div>
        </div>
      </div>
      <audio
        controls
        src={item.url}
        style={{ width: '100%', height: '32px', outline: 'none' }}
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

function VideoItem({ item }) {
  return (
    <div style={{
      background: 'rgba(176,64,255,0.05)', border: '1px solid rgba(176,64,255,0.15)',
      borderRadius: '10px', overflow: 'hidden', maxWidth: '320px',
    }}>
      <video
        controls
        src={item.url}
        style={{ width: '100%', maxHeight: '200px', display: 'block', background: '#000' }}
      >
        Your browser does not support the video element.
      </video>
      <div style={{
        padding: '6px 12px', fontSize: '10px', color: '#888',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
          📹 {item.name}
        </span>
        <span>{formatBytes(item.size)}</span>
      </div>
    </div>
  );
}

function GenericItem({ item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px', padding: '8px 12px', textDecoration: 'none', color: '#ccc',
        fontSize: '12px',
      }}
    >
      <span>📎</span>
      <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.name}
      </span>
      <span style={{ fontSize: '10px', color: '#666' }}>{formatBytes(item.size)}</span>
    </a>
  );
}

export default function MediaViewer({ media = [] }) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_LIMIT = 4;

  if (!media || media.length === 0) return null;

  const visible = expanded ? media : media.slice(0, INITIAL_LIMIT);
  const hidden  = media.length - INITIAL_LIMIT;

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{
        fontSize: '10px', color: '#888', letterSpacing: '0.1em',
        textTransform: 'uppercase', marginBottom: '8px',
      }}>
        📎 Attachments ({media.length})
      </div>

      {/* Images row */}
      {(() => {
        const imgs = visible.filter(m => m.type === 'image');
        if (!imgs.length) return null;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {imgs.map((item, i) => <ImageItem key={i} item={item} />)}
          </div>
        );
      })()}

      {/* Audio items */}
      {(() => {
        const audios = visible.filter(m => m.type === 'audio');
        if (!audios.length) return null;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {audios.map((item, i) => <AudioItem key={i} item={item} />)}
          </div>
        );
      })()}

      {/* Video items */}
      {(() => {
        const vids = visible.filter(m => m.type === 'video');
        if (!vids.length) return null;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {vids.map((item, i) => <VideoItem key={i} item={item} />)}
          </div>
        );
      })()}

      {/* Generic files */}
      {(() => {
        const others = visible.filter(m => m.type !== 'image' && m.type !== 'audio' && m.type !== 'video');
        if (!others.length) return null;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {others.map((item, i) => <GenericItem key={i} item={item} />)}
          </div>
        );
      })()}

      {/* Show more / less */}
      {media.length > INITIAL_LIMIT && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px',
            color: '#888', cursor: 'pointer', padding: '4px 12px',
            fontSize: '11px', marginTop: '4px',
          }}
        >
          {expanded ? '▴ Show less' : `▾ Show ${hidden} more`}
        </button>
      )}
    </div>
  );
}
