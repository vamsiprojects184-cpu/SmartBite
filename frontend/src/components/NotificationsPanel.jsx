import React from "react";
import { apiService } from "../services/api";

export default function NotificationsPanel({
  notifications = [],
  onClose,
  onRefresh,
  onOpenTracking
}) {
  function handleMarkRead(id) {
    apiService.markNotificationRead(id);
    if (onRefresh) onRefresh();
  }

  function handleClearAll() {
    apiService.clearAllNotifications();
    if (onRefresh) onRefresh();
  }

  return (
    <div className="notifications-dropdown-overlay" onClick={onClose}>
      <div className="notifications-dropdown-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notif-header">
          <div>
            <h3>🔔 Notifications</h3>
            <small>Updates on orders, table bookings & healthy tips</small>
          </div>
          <button className="notif-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="notif-actions-bar">
            <button
              className="notif-action-text"
              onClick={() => {
                notifications.forEach((n) => apiService.markNotificationRead(n.id));
                if (onRefresh) onRefresh();
              }}
            >
              Mark all as read
            </button>
            <button className="notif-action-text clear" onClick={handleClearAll}>
              Clear all
            </button>
          </div>
        )}

        <div className="notif-items-list">
          {notifications.length === 0 ? (
            <div className="empty-notifs">
              <span className="empty-bell">🔕</span>
              <p>No new notifications right now.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-card ${notif.is_read ? "read" : "unread"}`}
                onClick={() => handleMarkRead(notif.id)}
              >
                <div className="notif-title-row">
                  <strong>{notif.title}</strong>
                  <span className="notif-time">{notif.time}</span>
                </div>
                <p className="notif-message">{notif.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
