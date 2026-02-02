import { useState } from 'react';
import { AppStateProvider, useAppState } from './hooks/useAppState';
import { getTodayISO, formatTime24, getCurrentTimeMinutes } from './utils/timeUtils';
import Timeline from './components/Timeline';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import BottomNav from './components/BottomNav';
import Onboarding from './components/Onboarding';
import TimePicker from './components/TimePicker';
import NapEditModal from './components/NapEditModal';
import './index.css';

function AppContent() {
  const { settings, setWakeTime, updateScheduleSettings, addNap, updateNap, deleteNap, skipNapSlot } = useAppState();
  const [activeTab, setActiveTab] = useState('today');
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);
  const [editingNap, setEditingNap] = useState(null);

  // Show onboarding if not complete
  if (!settings.onboardingComplete) {
    return <Onboarding />;
  }

  const handleEditWakeTime = () => {
    setShowWakeTimePicker(true);
  };

  const handleWakeTimeChange = (newTime) => {
    setWakeTime(newTime);
  };

  const handleEditBedtime = () => {
    setShowBedtimePicker(true);
  };

  const handleBedtimeChange = (newTime) => {
    updateScheduleSettings({ bedtime: newTime });
  };

  const handleEditNap = (event) => {
    setEditingNap(event);
  };

  const handleAddNap = (startTime, endTime, awakeEvent) => {
    // If adding from predicted nap window
    if (startTime && endTime) {
      addNap(startTime, endTime);
      return;
    }

    // If adding from awake window, use current time or middle of window
    if (awakeEvent) {
      const currentMinutes = getCurrentTimeMinutes();
      const start = Math.max(awakeEvent.start, Math.min(awakeEvent.end - 30, currentMinutes));
      addNap(formatTime24(start), null);
    }
  };

  const handleSaveNap = (updates) => {
    if (editingNap?.actualData?.id) {
      updateNap(editingNap.actualData.id, updates);
    } else if (editingNap?.id && !editingNap.id.startsWith('predicted')) {
      updateNap(editingNap.id, updates);
    }
  };

  const handleDeleteNap = () => {
    // Get the nap ID from actualData (for events from timeline) or directly from the nap object
    const napId = editingNap?.actualData?.id || editingNap?.id;
    if (napId && !napId.startsWith('predicted')) {
      deleteNap(napId);
      // Also skip this slot so predicted nap doesn't reappear
      if (editingNap?.slotIndex !== undefined) {
        skipNapSlot(editingNap.slotIndex);
      }
    }
  };

  const handleSelectHistoryDay = (date) => {
    setSelectedDate(date);
    setActiveTab('today');
  };

  return (
    <div className="app">
      <main className="app-main">
        {activeTab === 'today' && (
          <Timeline
            date={selectedDate}
            onEditWakeTime={handleEditWakeTime}
            onEditBedtime={handleEditBedtime}
            onEditNap={handleEditNap}
            onAddNap={handleAddNap}
          />
        )}
        {activeTab === 'history' && (
          <HistoryView onSelectDay={handleSelectHistoryDay} />
        )}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showWakeTimePicker && (
        <TimePicker
          value={settings.schedule.typicalWakeTime}
          onChange={handleWakeTimeChange}
          onClose={() => setShowWakeTimePicker(false)}
          title="Wake Time"
        />
      )}

      {showBedtimePicker && (
        <TimePicker
          value={settings.schedule.bedtime || settings.schedule.bedtimeWindow?.start || '19:00'}
          onChange={handleBedtimeChange}
          onClose={() => setShowBedtimePicker(false)}
          title="Bedtime"
        />
      )}

      {editingNap && (
        <NapEditModal
          nap={editingNap.actualData || editingNap}
          onSave={handleSaveNap}
          onDelete={handleDeleteNap}
          onClose={() => setEditingNap(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
