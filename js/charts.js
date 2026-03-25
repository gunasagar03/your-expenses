/**
 * charts.js — Chart Rendering Module
 * Handles pie chart (category distribution) and
 * bar chart (weekly trend) using Chart.js.
 * ─────────────────────────────────────────────────────
 */

const Charts = (() => {

  let pieInstance = null;
  let barInstance = null;

  // Shared chart defaults for dark theme
  Chart.defaults.color = '#9090b0';
  Chart.defaults.font.family = "'Sora', sans-serif";
  Chart.defaults.font.size = 11;

  // ─── PIE CHART ────────────────────────────────────

  function renderPie(expenses) {
    const canvas = document.getElementById('pieChart');
    const empty  = document.getElementById('pieEmpty');

    if (!expenses || expenses.length === 0) {
      canvas.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    canvas.style.display = 'block';
    empty.style.display = 'none';

    const grouped = DB.groupByCategory(expenses);
    const cats    = Insights.CATEGORIES.filter(c => grouped[c.name]);
    const labels  = cats.map(c => c.emoji + ' ' + c.name);
    const data    = cats.map(c => grouped[c.name]);
    const colors  = cats.map(c => c.color);

    if (pieInstance) pieInstance.destroy();

    pieInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.map(c => c + 'cc'), // with alpha
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              boxWidth: 12,
              boxHeight: 12,
              borderRadius: 6,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ₹${Math.round(ctx.parsed).toLocaleString('en-IN')}`
            },
            backgroundColor: 'rgba(20,20,40,0.9)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10
          }
        },
        animation: { animateScale: true, animateRotate: true, duration: 600 }
      }
    });
  }

  // ─── BAR CHART ────────────────────────────────────

  function renderBar() {
    const canvas  = document.getElementById('barChart');
    const empty   = document.getElementById('barEmpty');
    const weekData = DB.getWeeklyDailyTotals();

    const hasData = weekData.some(d => d.total > 0);
    empty.classList.toggle('hidden', hasData);

    const labels = weekData.map(d => d.label);
    const data   = weekData.map(d => d.total);
    const today  = new Date().toLocaleDateString('en', { weekday: 'short' });
    const colors = labels.map(l =>
      l === today ? 'rgba(124,106,247,0.9)' : 'rgba(124,106,247,0.3)'
    );

    if (barInstance) barInstance.destroy();

    barInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ₹${Math.round(ctx.parsed.y).toLocaleString('en-IN')}`
            },
            backgroundColor: 'rgba(20,20,40,0.9)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { display: false },
            ticks: {
              callback: v => v === 0 ? '' : '₹' + (v >= 1000 ? (v/1000).toFixed(1) + 'k' : v)
            }
          }
        },
        animation: { duration: 500, easing: 'easeOutQuart' }
      }
    });
  }

  // ─── REFRESH BOTH ─────────────────────────────────

  function refreshAll(expenses) {
    renderPie(expenses);
    renderBar();
  }

  return { renderPie, renderBar, refreshAll };

})();
