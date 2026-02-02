import { useAppState } from '../hooks/useAppState';
import { useAuth } from '../hooks/useAuth';
import { formatAge } from '../utils/ageCalculator';
import './SettingsView.css';

export default function SettingsView() {
  const { settings, updateScheduleSettings, updateBabyInfo } = useAppState();
  const { user, signOut } = useAuth();

  const handleWakeWindowChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0 && value <= 6) {
      updateScheduleSettings({ defaultWakeWindow: value });
    }
  };

  const handleNapDurationChange = (e) => {
    const minutes = parseInt(e.target.value, 10);
    if (!isNaN(minutes) && minutes >= 15 && minutes <= 180) {
      updateScheduleSettings({ defaultNapDuration: minutes / 60 });
    }
  };

  const handleTypicalWakeTimeChange = (e) => {
    updateScheduleSettings({ typicalWakeTime: e.target.value });
  };

  const handleBedtimeChange = (e) => {
    updateScheduleSettings({ bedtime: e.target.value });
  };

  const handleNameChange = (e) => {
    updateBabyInfo({ name: e.target.value || null });
  };

  const handleBirthdayChange = (e) => {
    updateBabyInfo({ birthday: e.target.value || null });
  };

  const napDurationMinutes = Math.round(settings.schedule.defaultNapDuration * 60);
  const ageDisplay = settings.baby.birthday ? formatAge(settings.baby.birthday) : null;

  return (
    <div className="settings-view">
      <header className="settings-header">
        <h1 className="settings-title">Settings</h1>
      </header>

      <div className="settings-content">
        <section className="settings-section">
          <h2 className="section-title">Sleep Schedule</h2>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Wake window</span>
              <span className="setting-description">Time between sleep periods</span>
            </div>
            <div className="setting-control">
              <input
                type="number"
                min="0.5"
                max="6"
                step="0.25"
                value={settings.schedule.defaultWakeWindow}
                onChange={handleWakeWindowChange}
                className="setting-input"
              />
              <span className="setting-unit">hrs</span>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Default nap duration</span>
              <span className="setting-description">Expected nap length</span>
            </div>
            <div className="setting-control">
              <input
                type="number"
                min="15"
                max="180"
                step="5"
                value={napDurationMinutes}
                onChange={handleNapDurationChange}
                className="setting-input"
              />
              <span className="setting-unit">min</span>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Typical wake time</span>
              <span className="setting-description">Default for new days</span>
            </div>
            <div className="setting-control">
              <input
                type="time"
                value={settings.schedule.typicalWakeTime}
                onChange={handleTypicalWakeTimeChange}
                className="setting-input setting-input-time"
              />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Bedtime</span>
              <span className="setting-description">Start of night sleep</span>
            </div>
            <div className="setting-control">
              <input
                type="time"
                value={settings.schedule.bedtime || settings.schedule.bedtimeWindow?.start || '19:00'}
                onChange={handleBedtimeChange}
                className="setting-input setting-input-time"
              />
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">Baby Info</h2>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Name</span>
            </div>
            <div className="setting-control">
              <input
                type="text"
                value={settings.baby.name || ''}
                onChange={handleNameChange}
                placeholder="—"
                className="setting-input setting-input-text"
              />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Birthday</span>
              {ageDisplay && (
                <span className="setting-description">Current age: {ageDisplay}</span>
              )}
            </div>
            <div className="setting-control">
              <input
                type="date"
                value={settings.baby.birthday || ''}
                onChange={handleBirthdayChange}
                className="setting-input setting-input-date"
              />
            </div>
          </div>
        </section>

        <section className="settings-info-box">
          <h3 className="info-box-title">About wake windows</h3>
          <p className="info-box-text">
            Wake windows are the periods of time your baby stays awake between naps.
            They typically increase as your baby grows older. Newborns may only stay
            awake for 45-60 minutes, while older babies can handle 2-4 hours or more.
          </p>
          <p className="info-box-text">
            Finding the right wake window helps prevent overtiredness while ensuring
            your baby is ready to sleep when nap time comes.
          </p>
        </section>

        <section className="settings-section settings-account">
          <h2 className="section-title">Account</h2>
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Signed in as</span>
              <span className="setting-description">{user?.email}</span>
            </div>
          </div>
          <button className="sign-out-button" onClick={signOut}>
            Sign out
          </button>
        </section>
      </div>
    </div>
  );
}
