import React, { useState, useCallback } from 'react';
import SectionCard from '../components/SectionCard';
import Field from '../components/Field';
import { Chip, ChipGroup } from '../components/Chip';
import ProgressBar from '../components/ProgressBar';
import { submitReport, fetchStats } from '../utils/api';
import './ReportForm.css';

const GERMAN_STATES = [
  'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hesse', 'Mecklenburg-Vorpommern', 'Lower Saxony',
  'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland',
  'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
];

const VIOLENCE_TYPES = [
  'Physical force', 'Disproportionate control', 'Discrimination',
  'Verbal abuse', 'Detention / arrest', 'Search / raid', 'Other',
];

const MOTIVE_TYPES = ['Religious', 'Racist', 'Political', 'Appearance / clothing', 'Other'];

const RELIGIOUS_DETAILS = [
  'Clothing / symbols', 'Police statements', 'Targeted behavior',
  'Near religious site', 'Other',
];

const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const AGE_GROUPS = ['Under 18', '18–25', '26–40', '41–60', '60+'];
const CONTEXTS = ['Stop / control', 'Demonstration', 'Traffic', 'Public space', 'Other'];
const OFFICER_COUNTS = ['1', '2–3', '4+', 'Unknown'];

const TOTAL_REQUIRED = 7;

function countProgress(form) {
  let n = 0;
  if (form.state) n++;
  if (form.incidentMonth) n++;
  if (form.timeOfDay) n++;
  if (form.violenceTypes.length > 0) n++;
  if (form.motivePresent) n++;
  if (form.gender) n++;
  if (form.context) n++;
  return n;
}

export default function ReportForm({ onSuccess }) {
  const [form, setForm] = useState({
    state: '',
    cityRegion: '',
    incidentMonth: '',
    timeOfDay: '',
    violenceTypes: [],
    motivePresent: '',
    motiveTypes: [],
    religiousDetails: [],
    gender: '',
    ageGroup: '',
    context: '',
    officerCount: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const toggleMulti = useCallback((key, val) => {
    setForm(prev => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val],
      };
    });
  }, []);

  const handleMotiveChange = (val) => {
    set('motivePresent', val);
    if (val !== 'Yes') {
      set('motiveTypes', []);
      set('religiousDetails', []);
    }
  };

  const handleMotiveTypeToggle = (val) => {
    setForm(prev => {
      const arr = prev.motiveTypes;
      const next = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
      const religiousDetails = next.includes('Religious') ? prev.religiousDetails : [];
      return { ...prev, motiveTypes: next, religiousDetails };
    });
  };

  const charLen = form.description.length;
  const progress = countProgress(form);

  const validate = () => {
    if (!form.state) return 'Please select a federal state.';
    if (!form.incidentMonth) return 'Please select the month and year of the incident.';
    if (!form.timeOfDay) return 'Please select the time of day.';
    if (!form.violenceTypes.length) return 'Please select at least one type of violence.';
    if (!form.motivePresent) return 'Please indicate whether a motive was present.';
    if (!form.gender) return 'Please select a gender.';
    if (!form.context) return 'Please select the situation context.';
    if (!form.officerCount) return 'Please select the number of officers involved.';
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      await submitReport(form);
      const stats = await fetchStats();
      onSuccess(stats);
    } catch (e) {
      setError(
        e?.response?.data?.error ||
        'Could not submit. Please ensure the backend server is running on port 4000.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-form">
      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero__badge">
          <span className="hero__dot" />
          Anonymous Reporting · Germany
        </div>
        <h1 className="hero__title">
          Report police violence<br />
          <em>safely &amp; anonymously.</em>
        </h1>
        <p className="hero__sub">
          Help make incidents visible. No names, no email, no tracking —
          only your experience matters.
        </p>
        <div className="privacy-row">
          {[
            { dot: 'no', text: 'No IP logging' },
            { dot: 'no', text: 'No cookies' },
            { dot: 'no', text: 'No tracking' },
            { dot: 'yes', text: 'Only aggregated data stored' },
          ].map(item => (
            <div className="privacy-item" key={item.text}>
              <span className={`privacy-dot privacy-dot--${item.dot}`} />
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── FORM BODY ── */}
      <div className="form-body">
        <ProgressBar filled={progress} total={TOTAL_REQUIRED} />

        {/* ① Location & Time */}
        <SectionCard num={1} title="Location & time">
          <Field label="Federal state" required>
            <select
              value={form.state}
              onChange={e => set('state', e.target.value)}
            >
              <option value="">Select state...</option>
              {GERMAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <Field label="City / region" optional>
            <input
              type="text"
              value={form.cityRegion}
              onChange={e => set('cityRegion', e.target.value)}
              placeholder="e.g. Munich north, Rhine area..."
              maxLength={60}
            />
          </Field>

          <Field label="Month & year of incident" required>
            <input
              type="month"
              value={form.incidentMonth}
              onChange={e => set('incidentMonth', e.target.value)}
            />
          </Field>

          <Field label="Time of day" required>
            <ChipGroup>
              {['Morning', 'Daytime', 'Evening', 'Night'].map(t => (
                <Chip
                  key={t}
                  label={t}
                  selected={form.timeOfDay === t}
                  onClick={() => set('timeOfDay', form.timeOfDay === t ? '' : t)}
                />
              ))}
            </ChipGroup>
          </Field>
        </SectionCard>

        {/* ② Type of Violence */}
        <SectionCard num={2} title="Type of police violence *">
          <ChipGroup>
            {VIOLENCE_TYPES.map(v => (
              <Chip
                key={v}
                label={v}
                selected={form.violenceTypes.includes(v)}
                onClick={() => toggleMulti('violenceTypes', v)}
                multi
              />
            ))}
          </ChipGroup>
        </SectionCard>

        {/* ③ Motive */}
        <SectionCard num={3} title="Possible motive">
          <Field label="Do you believe a motive was present?" required>
            <ChipGroup>
              {['No', 'Unsure', 'Yes'].map(opt => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={form.motivePresent === opt}
                  onClick={() => handleMotiveChange(opt)}
                />
              ))}
            </ChipGroup>

            {form.motivePresent === 'Yes' && (
              <div className="conditional-block">
                <label className="conditional-block__label">
                  Type of motive <span className="field__opt">(multiple possible)</span>
                </label>
                <ChipGroup>
                  {MOTIVE_TYPES.map(m => (
                    <Chip
                      key={m}
                      label={m}
                      selected={form.motiveTypes.includes(m)}
                      onClick={() => handleMotiveTypeToggle(m)}
                      multi
                    />
                  ))}
                </ChipGroup>

                {form.motiveTypes.includes('Religious') && (
                  <div className="conditional-block conditional-block--nested">
                    <label className="conditional-block__label">
                      How did you notice the religious motive?{' '}
                      <span className="field__opt">(multiple possible)</span>
                    </label>
                    <ChipGroup>
                      {RELIGIOUS_DETAILS.map(d => (
                        <Chip
                          key={d}
                          label={d}
                          selected={form.religiousDetails.includes(d)}
                          onClick={() => toggleMulti('religiousDetails', d)}
                          multi
                        />
                      ))}
                    </ChipGroup>
                  </div>
                )}
              </div>
            )}
          </Field>
        </SectionCard>

        {/* ④ Victim Details */}
        <SectionCard num={4} title="About the person affected">
          <Field label="Gender" required>
            <ChipGroup>
              {GENDERS.map(g => (
                <Chip
                  key={g}
                  label={g}
                  selected={form.gender === g}
                  onClick={() => set('gender', form.gender === g ? '' : g)}
                />
              ))}
            </ChipGroup>
          </Field>

          <Field label="Age group" required>
            <ChipGroup>
              {AGE_GROUPS.map(a => (
                <Chip
                  key={a}
                  label={a}
                  selected={form.ageGroup === a}
                  onClick={() => set('ageGroup', form.ageGroup === a ? '' : a)}
                />
              ))}
            </ChipGroup>
          </Field>
        </SectionCard>

        {/* ⑤ Situation */}
        <SectionCard num={5} title="Situation & context">
          <Field label="Occasion / context" required>
            <ChipGroup>
              {CONTEXTS.map(c => (
                <Chip
                  key={c}
                  label={c}
                  selected={form.context === c}
                  onClick={() => set('context', form.context === c ? '' : c)}
                />
              ))}
            </ChipGroup>
          </Field>

          <Field label="Officers involved" required>
            <ChipGroup>
              {OFFICER_COUNTS.map(o => (
                <Chip
                  key={o}
                  label={o}
                  selected={form.officerCount === o}
                  onClick={() => set('officerCount', form.officerCount === o ? '' : o)}
                />
              ))}
            </ChipGroup>
          </Field>
        </SectionCard>

        {/* ⑥ Free Text */}
        <SectionCard num={6} title="Describe what happened">
          <div className="warn-box">
            <strong>Important:</strong> Do NOT include names, badge numbers, or any
            identifying details. Your description will be automatically filtered.
          </div>
          <Field>
            <textarea
              className="desc-textarea"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              maxLength={800}
              placeholder="Describe the incident briefly in your own words. Stay factual. No personal identifiers."
              rows={5}
            />
            <div className={`char-count ${charLen > 700 ? 'char-count--warn' : ''}`}>
              {charLen} / 800 characters
            </div>
          </Field>
        </SectionCard>

        {/* Submit */}
        <div className="submit-wrap">
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Anonymously'}
          </button>
          <p className="submit-note">
            Not a substitute for emergency services. Call 112 in emergencies.
          </p>
          {error && <p className="submit-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
