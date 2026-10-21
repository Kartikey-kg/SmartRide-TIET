import React, { useState } from 'react';

/**
 * Format timestamp nicely
 */
function formatTime(timestamp) {
  if (!timestamp) return 'Recently';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recently';
  }
}

const NotificationModal = ({
  isOpen,
  onClose,
  notifications = [],
  readIds = [],
  onMarkRead,
  onMarkAllRead,
}) => {
  const [expandedId, setExpandedId] = useState(null);

  if (!isOpen) return null;

  const handleToggle = (item) => {
    const isExpanding = expandedId !== item.id;
    setExpandedId(isExpanding ? item.id : null);
    if (isExpanding && onMarkRead) {
      onMarkRead(item.id);
    }
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 15, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #131722)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(184, 100, 80, 0.15)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(184, 100, 80, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              🔔
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>
                  Notifications
                </h3>
                {unreadCount > 0 ? (
                  <span
                    style={{
                      background: 'var(--primary-red, #dc2626)',
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                    }}
                  >
                    {unreadCount} new
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'rgba(34,197,94,0.15)',
                      color: '#22c55e',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                    }}
                  >
                    All caught up
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #8b949e)', marginTop: '0.15rem' }}>
                Campus & admin announcements
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {unreadCount > 0 && onMarkAllRead && (
              <button
                onClick={onMarkAllRead}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--text-secondary, #c0c0e0)',
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-red, #dc2626)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: 'var(--text-secondary, #aaa)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content list */}
        <div
          style={{
            padding: '1rem 1.25rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {notifications.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-secondary, #8b949e)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
              <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-primary, #fff)', fontWeight: 700 }}>
                No notifications yet
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                When university admins send announcements, they will appear here.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isRead = readIds.includes(item.id);
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleToggle(item)}
                  style={{
                    background: isExpanded
                      ? 'rgba(184, 100, 80, 0.08)'
                      : isRead
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: isExpanded
                      ? '1px solid rgba(184, 100, 80, 0.4)'
                      : isRead
                      ? '1px solid rgba(255, 255, 255, 0.05)'
                      : '1px solid rgba(184, 100, 80, 0.25)',
                    borderRadius: '14px',
                    padding: '1rem 1.15rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.background = isRead
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  {/* Top Bar of item: Dot + Subject + Chevron */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                      {/* Unread status dot */}
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isRead ? 'rgba(255,255,255,0.2)' : 'var(--primary-red, #dc2626)',
                          boxShadow: isRead ? 'none' : '0 0 8px var(--primary-red, #dc2626)',
                          marginTop: '0.35rem',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: isRead ? 600 : 800,
                            color: isRead ? 'var(--text-secondary, #d0d0e0)' : 'var(--text-primary, #ffffff)',
                            fontSize: '0.95rem',
                            lineHeight: 1.35,
                          }}
                        >
                          {item.title || 'Campus Notice'}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            marginTop: '0.35rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted, #8b949e)',
                            }}
                          >
                            📅 {formatTime(item.createdAt || item.sentAt)}
                          </span>
                          {item.target && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'var(--text-secondary, #bbb)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: 600,
                              }}
                            >
                              {item.target === 'all' ? '📢 All' : item.target === 'students' ? '🎓 Students' : '🧑‍✈️ Drivers'}
                            </span>
                          )}
                          {!isExpanded && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--primary-red, #f87171)',
                                marginLeft: 'auto',
                                fontWeight: 600,
                              }}
                            >
                              Click to read →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        color: 'var(--text-muted, #888)',
                        fontSize: '0.8rem',
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        marginTop: '0.2rem',
                      }}
                    >
                      ▼
                    </div>
                  </div>

                  {/* Expanded Full Message Content */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '0.85rem',
                        paddingTop: '0.85rem',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        animation: 'fadeIn 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.88rem',
                          lineHeight: 1.6,
                          color: 'var(--text-primary, #f0f0f5)',
                          whiteSpace: 'pre-wrap',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {item.message || 'No additional details provided.'}
                      </div>

                      {item.sentBy && (
                        <div
                          style={{
                            marginTop: '0.6rem',
                            fontSize: '0.72rem',
                            color: 'var(--text-muted, #8b949e)',
                            textAlign: 'right',
                          }}
                        >
                          Issued by: <strong>{item.sentBy}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))',
            background: 'rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted, #8b949e)',
          }}
        >
          <span>Total {notifications.length} message{notifications.length === 1 ? '' : 's'}</span>
          <button
            onClick={onClose}
            style={{
              background: 'var(--gradient-primary, #b86450)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.35rem 0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.78rem',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
