/**
 * insights.js — AI-Powered Smart Insights Engine
 * Dynamically analyses spending patterns and generates
 * human-friendly insights, warnings, and tips.
 * ─────────────────────────────────────────────────────
 */

const Insights = (() => {

  const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');

  // ─── CATEGORY AUTO-DETECT ─────────────────────────

  // Keyword → Category mapping (case-insensitive)
  const KEYWORD_MAP = {
    Food: [
      'burger','pizza','food','lunch','dinner','breakfast','coffee','tea','restaurant',
      'cafe','zomato','swiggy','snack','meal','rice','dal','biryani','chicken','milk',
      'grocery','groceries','vegetables','fruit','bread','egg','drink','juice','water',
      'dominos','mcdonalds','kfc','subway','haldiram','biscuit','chips','ice cream','dessert'
    ],
    Travel: [
      'uber','ola','auto','cab','bus','train','flight','metro','taxi','petrol','diesel',
      'fuel','toll','parking','travel','trip','journey','rapido','rickshaw','bike',
      'indigo','air india','ticket','transport','booking.com','irctc','redbus'
    ],
    Shopping: [
      'amazon','flipkart','myntra','ajio','meesho','shop','store','clothes','shirt',
      'shoes','jeans','dress','bag','phone','laptop','gadget','electronics','purchase',
      'mall','market','decathlon','nykaa','beauty','cosmetics','watch','jewellery'
    ],
    Bills: [
      'bill','electricity','water','internet','wifi','broadband','jio','airtel','bsnl',
      'recharge','mobile','phone bill','gas','cylinder','rent','emi','insurance',
      'subscription','netflix','spotify','prime','hotstar','netflix','ott'
    ],
    Entertainment: [
      'movie','cinema','pvr','inox','game','gaming','concert','show','event','party',
      'pub','bar','club','night out','amusement','park','fun','picnic','outing','theatre'
    ]
  };

  /**
   * Auto-detects category from a note/description string.
   * Returns matched category name or null.
   */
  function detectCategory(note) {
    if (!note || note.length < 2) return null;
    const lower = note.toLowerCase();
    for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
      if (keywords.some(k => lower.includes(k))) return cat;
    }
    return null;
  }

  // ─── INSIGHT GENERATORS ───────────────────────────

  /**
   * Generates an array of insight objects:
   * { text: string, type: 'info'|'warn'|'good'|'tip' }
   */
  function generate() {
    const allExpenses  = DB.getAllExpenses();
    const daily        = DB.getByPeriod('daily');
    const weekly       = DB.getByPeriod('weekly');
    const monthly      = DB.getByPeriod('monthly');
    const settings     = DB.getSettings();
    const results      = [];

    if (allExpenses.length === 0) {
      return [{ text: "💡 Start adding your expenses to unlock personalized AI insights!", type: 'tip' }];
    }

    const dailyTotal   = DB.sumAmount(daily);
    const weeklyTotal  = DB.sumAmount(weekly);
    const monthlyTotal = DB.sumAmount(monthly);

    // 1. Weekly food spend insight
    const weekCats = DB.groupByCategory(weekly);
    if (weekCats.Food > 0) {
      const emoji = weekCats.Food > 1500 ? '😳' : '🍔';
      results.push({
        text: `You spent ${fmt(weekCats.Food)} on food this week ${emoji}`,
        type: weekCats.Food > 2000 ? 'warn' : 'info'
      });
    }

    // 2. Monthly projection
    const daysElapsed  = new Date().getDate();
    const daysInMonth  = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    if (daysElapsed > 0 && monthlyTotal > 0) {
      const projected = (monthlyTotal / daysElapsed) * daysInMonth;
      results.push({
        text: `📈 At this rate, you'll spend ${fmt(projected)} this month (projected)`,
        type: projected > 20000 ? 'warn' : 'info'
      });
    }

    // 3. Highest category savings tip
    const sortedCats = Object.entries(weekCats).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
      const [topCat, topAmt] = sortedCats[0];
      const savingAmt = Math.round(topAmt * 0.3);
      if (savingAmt > 0) {
        results.push({
          text: `💡 You could save ${fmt(savingAmt)} by reducing ${topCat} expenses by 30%`,
          type: 'tip'
        });
      }
    }

    // 4. Goal-based insight
    if (settings.monthlyGoal > 0) {
      const remaining = settings.monthlyGoal - monthlyTotal;
      if (remaining < 0) {
        results.push({
          text: `🚨 You've exceeded your monthly goal by ${fmt(Math.abs(remaining))}!`,
          type: 'warn'
        });
      } else {
        results.push({
          text: `✅ Great! You have ${fmt(remaining)} left in your monthly budget`,
          type: 'good'
        });
      }
    }

    // 5. Daily spend comparison
    if (weeklyTotal > 0 && weekly.length >= 2) {
      const avgDaily = weeklyTotal / 7;
      if (dailyTotal > avgDaily * 1.5) {
        results.push({
          text: `⚡ Today's spend (${fmt(dailyTotal)}) is 50% above your daily average of ${fmt(avgDaily)}`,
          type: 'warn'
        });
      } else if (dailyTotal > 0 && dailyTotal < avgDaily * 0.5) {
        results.push({
          text: `🎉 Great day! You spent only ${fmt(dailyTotal)} vs your average of ${fmt(avgDaily)}`,
          type: 'good'
        });
      }
    }

    // 6. Travel spend if significant
    if (weekCats.Travel > 500) {
      results.push({
        text: `🚗 You've spent ${fmt(weekCats.Travel)} on travel this week. Consider carpooling!`,
        type: 'tip'
      });
    }

    // 7. Bills reminder
    if (weekCats.Bills > 0) {
      results.push({
        text: `💡 Bills paid: ${fmt(weekCats.Bills)} this week. Set auto-pay to avoid late fees.`,
        type: 'info'
      });
    }

    // 8. Shopping alert
    if (weekCats.Shopping > 3000) {
      results.push({
        text: `🛍️ You spent ${fmt(weekCats.Shopping)} on shopping this week — higher than usual!`,
        type: 'warn'
      });
    }

    // 9. Weekend vs weekday pattern
    const weekendSpend = weekly.filter(e => {
      const day = new Date(e.date).getDay();
      return day === 0 || day === 6;
    });
    const wkndTotal = DB.sumAmount(weekendSpend);
    if (wkndTotal > weeklyTotal * 0.5 && weekly.length > 3) {
      results.push({
        text: `🎭 ${Math.round((wkndTotal/weeklyTotal)*100)}% of your weekly spend happens on weekends`,
        type: 'info'
      });
    }

    // 10. Positive streak
    const meta = DB.getMeta();
    if (meta.streak >= 3) {
      results.push({
        text: `🔥 ${meta.streak}-day tracking streak! Consistency is key to financial health.`,
        type: 'good'
      });
    }

    // Cap at 6 insights for mobile readability
    return results.slice(0, 6);
  }

  // ─── LEVEL SYSTEM ────────────────────────────────

  function getLevel(totalEntries, monthlyTotal, goal) {
    // Based on number of tracked entries
    if (totalEntries === 0)  return { name: 'Beginner',    icon: '🌱', color: '#9090b0' };
    if (totalEntries < 10)   return { name: 'Tracker',     icon: '📝', color: '#4dd0e1' };
    if (totalEntries < 30)   return { name: 'Saver',       icon: '💰', color: '#7c6af7' };
    if (totalEntries < 60)   return { name: 'Pro',         icon: '⭐', color: '#ffd54f' };
    if (totalEntries < 100)  return { name: 'Expert',      icon: '🏆', color: '#f06292' };
    return                         { name: 'Legend',       icon: '👑', color: '#ff6d00' };
  }

  // ─── CATEGORY METADATA ────────────────────────────

  const CATEGORIES = [
    { name: 'Food',          emoji: '🍔', color: '#ff9800' },
    { name: 'Travel',        emoji: '🚗', color: '#4dd0e1' },
    { name: 'Shopping',      emoji: '🛍️', color: '#f06292' },
    { name: 'Bills',         emoji: '💡', color: '#7c6af7' },
    { name: 'Entertainment', emoji: '🎬', color: '#4caf7d' },
    { name: 'Others',        emoji: '📦', color: '#9090b0' }
  ];

  function getCatMeta(name) {
    return CATEGORIES.find(c => c.name === name) || CATEGORIES[5];
  }

  return { detectCategory, generate, getLevel, CATEGORIES, getCatMeta };

})();
