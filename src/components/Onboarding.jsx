import { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import './Onboarding.css';

export default function Onboarding() {
  const { settings, updateBabyInfo, updateScheduleSettings, completeOnboarding } = useAppState();

  const [birthday, setBirthday] = useState(settings.baby.birthday || '');
  const [name, setName] = useState(settings.baby.name || '');
  const [typicalWakeTime, setTypicalWakeTime] = useState(settings.schedule.typicalWakeTime);
  const [bedtime, setBedtime] = useState(settings.schedule.bedtime || '19:00');

  const handleContinue = () => {
    updateBabyInfo({
      birthday: birthday || null,
      name: name || null,
    });
    updateScheduleSettings({
      typicalWakeTime,
      bedtime,
    });
    completeOnboarding();
  };

  const isValid = birthday !== '';

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <header className="onboarding-header">
          <h1 className="onboarding-title">Welcome to Snap</h1>
          <p className="onboarding-subtitle">
            Let's set up your baby's sleep schedule
          </p>
        </header>

        <div className="onboarding-form">
          <div className="form-group">
            <label className="form-label">Baby's birthday</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="form-input"
              required
            />
            <span className="form-hint">We'll use this to calculate age</span>
          </div>

          <div className="form-group">
            <label className="form-label">Baby's name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Typical wake time</label>
            <input
              type="time"
              value={typicalWakeTime}
              onChange={(e) => setTypicalWakeTime(e.target.value)}
              className="form-input"
            />
            <span className="form-hint">When does your baby usually wake up?</span>
          </div>

          <div className="form-group">
            <label className="form-label">Bedtime</label>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="form-input"
            />
            <span className="form-hint">When do you start the bedtime routine?</span>
          </div>
        </div>

        <button
          className="onboarding-button"
          onClick={handleContinue}
          disabled={!isValid}
        >
          Get Started
        </button>

        <p className="onboarding-note">
          You can adjust these settings anytime
        </p>
      </div>
    </div>
  );
}
