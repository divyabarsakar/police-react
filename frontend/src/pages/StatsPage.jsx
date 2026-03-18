import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend, defaults,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import './StatsPage.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
);

defaults.font.family = "'DM Sans', system-ui, sans-serif";
defaults.font.size = 11;

const COLORS = ['#C0392B', '#E74C3C', '#F08080', '#922B21', '#FADBD8', '#B2BABB', '#7F8C8D', '#D5DBDB'];

const BAR_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { padding: 8 } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: '#F2EDE8' }, ticks: { font: { size: 11 } } },
  },
};

const DOUGHNUT_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: { font: { size: 10 }, boxWidth: 10, padding: 10 },
    },
  },
};

function mkBarData(labels, data) {
  return {
    labels,
    datasets: [{
      data,
      backgroundColor: COLORS,
      borderWidth: 0,
      borderRadius: 4,
    }],
  };
}

function mkDoughnutData(labels, data) {
  return {
    labels,
    datasets: [{
      data,
      backgroundColor: COLORS,
      borderWidth: 0,
    }],
  };
}

function ChartCard({ title, wide, children }) {
  return (
    <div className={`chart-card ${wide ? 'chart-card--wide' : ''}`}>
      <div className="chart-card__title">{title}</div>
      {children}
    </div>
  );
}

function HeatmapBars({ byState }) {
  if (!byState || !byState.length) return <p className="no-data">No data yet.</p>;
  const max = byState[0].count;
  return (
    <div className="heatmap-bars">
      {byState.slice(0, 10).map(s => (
        <div className="hbar" key={s._id}>
          <div className="hbar__label">{s._id}</div>
          <div className="hbar__track">
            <div
              className="hbar__fill"
              style={{ width: `${Math.round((s.count / max) * 100)}%` }}
            />
          </div>
          <div className="hbar__count">{s.count}</div>
        </div>
      ))}
    </div>
  );
}

const TIME_ORDER = ['Morning', 'Daytime', 'Evening', 'Night'];
const AGE_ORDER = ['Under 18', '18–25', '26–40', '41–60', '60+'];

export default function StatsPage({ stats, onNewReport }) {
  if (!stats) return null;

  const {
    total = 0,
    byState = [],
    byViolence = [],
    byMotive = [],
    byMotiveType = [],
    byReligious = [],
    byTime = [],
    byGender = [],
    byAge = [],
    byContext = [],
  } = stats;

  const religiousPct = total > 0
    ? Math.round(((byMotiveType.find(x => x._id === 'Religious')?.count || 0) / total) * 100)
    : 0;

  const topViolence = byViolence[0]?._id || '–';

  const timeData = TIME_ORDER.map(t => byTime.find(x => x._id === t)?.count || 0);
  const ageData  = AGE_ORDER.map(a => byAge.find(x => x._id === a)?.count || 0);

  return (
    <div className="stats-page">
      {/* ── Success hero ── */}
      <div className="stats-hero">
        <div className="success-icon">✓</div>
        <h2 className="stats-hero__title">Report submitted.</h2>
        <p className="stats-hero__sub">
          Your report has been added anonymously. Here is the current aggregate picture.
        </p>
        <button className="back-btn" onClick={onNewReport}>
          ← Submit another report
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-card__num">{total.toLocaleString()}</div>
          <div className="stat-card__label">Total reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__num">{religiousPct}%</div>
          <div className="stat-card__label">Religious motive</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__num stat-card__num--sm">{topViolence}</div>
          <div className="stat-card__label">Most reported type</div>
        </div>
      </div>

      {/* ── Charts grid ── */}
      <div className="charts-grid">

        {/* State ranking */}
        <ChartCard title="Top affected states" wide>
          <HeatmapBars byState={byState} />
        </ChartCard>

        {/* Violence types */}
        <ChartCard title="Type of violence" wide>
          <div className="chart-canvas-wrap chart-canvas-wrap--tall">
            <Bar
              data={mkBarData(byViolence.map(x => x._id), byViolence.map(x => x.count))}
              options={BAR_OPTS}
            />
          </div>
        </ChartCard>

        {/* Motive */}
        <ChartCard title="Motive present">
          <div className="chart-canvas-wrap">
            <Doughnut
              data={mkDoughnutData(byMotive.map(x => x._id), byMotive.map(x => x.count))}
              options={DOUGHNUT_OPTS}
            />
          </div>
        </ChartCard>

        {/* Time of day */}
        <ChartCard title="Time of day">
          <div className="chart-canvas-wrap">
            <Bar
              data={mkBarData(TIME_ORDER, timeData)}
              options={BAR_OPTS}
            />
          </div>
        </ChartCard>

        {/* Gender */}
        <ChartCard title="Gender">
          <div className="chart-canvas-wrap">
            <Doughnut
              data={mkDoughnutData(byGender.map(x => x._id), byGender.map(x => x.count))}
              options={DOUGHNUT_OPTS}
            />
          </div>
        </ChartCard>

        {/* Age groups */}
        <ChartCard title="Age groups">
          <div className="chart-canvas-wrap">
            <Bar
              data={mkBarData(AGE_ORDER, ageData)}
              options={BAR_OPTS}
            />
          </div>
        </ChartCard>

        {/* Religious motive details — only show if data exists */}
        {byReligious.length > 0 && (
          <ChartCard title="Religious motive details" wide>
            <div className="chart-canvas-wrap chart-canvas-wrap--tall">
              <Bar
                data={mkBarData(byReligious.map(x => x._id), byReligious.map(x => x.count))}
                options={BAR_OPTS}
              />
            </div>
          </ChartCard>
        )}

        {/* Context */}
        <ChartCard title="Situation context" wide>
          <div className="chart-canvas-wrap">
            <Bar
              data={mkBarData(byContext.map(x => x._id), byContext.map(x => x.count))}
              options={BAR_OPTS}
            />
          </div>
        </ChartCard>

      </div>

      <p className="stats-footer">
        All statistics are aggregated. No individual report data is ever displayed.
      </p>
    </div>
  );
}
