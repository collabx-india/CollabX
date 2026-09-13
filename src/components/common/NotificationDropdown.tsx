import React from 'react';
import { InAppNotification } from '../../types';
import { storageService } from '../../services/storageService';
import { Bell, CheckCheck, X, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface NotificationDropdownProps {
  notifications: InAppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { t } = useAccessibility();

  if (!isOpen) return null;

  const handleMarkAsRead = (id: string) => {
    storageService.markNotificationAsRead(id);
    onUpdate();
  };

  const handleMarkAllRead = () => {
    notifications.forEach(n => storageService.markNotificationAsRead(n.id));
    onUpdate();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-gov-lg border border-gov-border z-50 overflow-hidden">
      <div className="bg-gov-navy px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-gov-saffron-amber" />
          <span className="font-bold text-sm">{t('GovTech Alerts & Notifications', 'सरकारी सूचनाएं')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllRead}
            title={t('Mark all as read', 'सभी पढ़े के रूप में चिह्नित करें')}
            className="text-xs text-slate-200 hover:text-white flex items-center space-x-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('Read all', 'सभी पढ़ें')}</span>
          </button>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            {t('No notifications at this time.', 'कोई नई सूचना नहीं है।')}
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id)}
              className={`p-3 text-xs transition cursor-pointer hover:bg-slate-50 flex space-x-3 items-start ${
                !notif.read ? 'bg-blue-50/60 border-l-4 border-gov-blue' : 'bg-white'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {notif.type === 'gov' && <ShieldAlert className="w-4 h-4 text-gov-saffron" />}
                {notif.type === 'success' && <CheckCircle className="w-4 h-4 text-gov-green" />}
                {notif.type === 'info' && <Info className="w-4 h-4 text-gov-blue" />}
                {notif.type === 'warning' && <ShieldAlert className="w-4 h-4 text-amber-600" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-slate-800 ${!notif.read ? 'text-gov-navy font-bold' : ''}`}>
                    {notif.title}
                  </span>
                  <span className="text-xs text-slate-500">{notif.timestamp}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-50 p-2 text-center border-t border-slate-200">
        <span className="text-xs text-slate-600 font-medium">
          {t('In-App GovTech Decision Support System', 'इन-ऐप निर्णय सहायता प्रणाली')}
        </span>
      </div>
    </div>
  );
};
