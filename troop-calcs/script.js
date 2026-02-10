let currentTotalSpeed = 0;

async function init() {
  try {
    const [troopRes, koiRes] = await Promise.all([
      fetch('../data/troop_data.json'),
      fetch('../data/koi_points.json')
    ]);

    if (!troopRes.ok || !koiRes.ok) throw new Error("Data files not found");

    const troopData = await troopRes.json();
    const koiData = await koiRes.json();

    const levels = [...new Set(troopData.map(t => t.level))];
    populateDropdowns(levels);
    
    // --- UTILITY: UPDATE TOTAL SPEED ---
    const updateFinalSpeed = (raw) => {
      const state = parseFloat(document.getElementById('stateBuff').value) || 0;
      const min = parseFloat(document.getElementById('ministerBuff').value) || 0;
      
      // We store the "Bonus" speed for calculations
      currentTotalSpeed = raw + state + min;
      
      // Display shows 0.00% or whatever the bonus is
      document.getElementById('totalSpeedResult').innerText = currentTotalSpeed.toFixed(2);
    };

    // --- SECTION 1: SPEED ---
    document.getElementById('btnCalculateRaw').addEventListener('click', () => {
      const type = document.getElementById('revTypeSelect').value;
      const level = parseInt(document.getElementById('revLevelSelect').value);
      const amount = parseInt(document.getElementById('revAmount').value) || 0;
      
      const d = parseInt(document.getElementById('days').value) || 0;
      const h = parseInt(document.getElementById('hours').value) || 0;
      const m = parseInt(document.getElementById('mins').value) || 0;
      const s = parseInt(document.getElementById('secs').value) || 0;
      
      const actualSecs = (d * 86400) + (h * 3600) + (m * 60) + s;
      const troop = troopData.find(t => t.type === type && t.level === level);
      
      if (actualSecs > 0 && troop && amount > 0) {
        const baseSecs = troop.time * amount;
        
        // Corrected Formula: (Base / Actual - 1) * 100 gives the BONUS percentage
        const rawSpeed = ((baseSecs / actualSecs) - 1) * 100;
        const displayRaw = Math.max(0, rawSpeed); // Prevent negative numbers
        
        document.getElementById('rawSpeedResult').innerText = displayRaw.toFixed(2);
        updateFinalSpeed(displayRaw);
      }
    });

    ['stateBuff', 'ministerBuff'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const raw = parseFloat(document.getElementById('rawSpeedResult').innerText) || 0;
            updateFinalSpeed(raw);
        });
    });

    // --- SECTION 2: TRAINING ---
    document.getElementById('btnCalcTrain').addEventListener('click', () => {
      const type = document.getElementById('typeSelect').value;
      const level = document.getElementById('levelSelect').value;
      const amount = parseInt(document.getElementById('trainAmount').value) || 0;
      const troop = troopData.find(t => t.type === type && t.level == level);

      if (!troop) return;

      // Formula: Adjusted Time = Base Time / (1 + (Bonus Speed / 100))
      const totalSecs = (troop.time / (1 + (currentTotalSpeed / 100))) * amount;

      document.getElementById('timeResult').innerText = formatTime(totalSecs);
      document.getElementById('meatRes').innerText = (troop.meat * amount).toLocaleString();
      document.getElementById('woodRes').innerText = (troop.wood * amount).toLocaleString();
      document.getElementById('coalRes').innerText = (troop.coal * amount).toLocaleString();
      document.getElementById('ironRes').innerText = (troop.iron * amount).toLocaleString();
      document.getElementById('koiResult').innerText = (koiData.stage_4.points[`lvl${level}_troop`] * amount).toLocaleString();
    });

    // --- SECTION 3: PROMOTION ---
    const from = document.getElementById('promoFrom');
    const to = document.getElementById('promoTo');

    from.addEventListener('change', () => {
      to.innerHTML = '';
      levels.filter(lvl => lvl > parseInt(from.value)).forEach(lvl => {
          const opt = document.createElement('option');
          opt.value = lvl; opt.textContent = `Level ${lvl}`;
          to.appendChild(opt);
      });
    });
    from.dispatchEvent(new Event('change'));

    document.getElementById('btnCalcPromo').addEventListener('click', () => {
      const type = document.getElementById('promoTypeSelect').value;
      const amount = parseInt(document.getElementById('promoAmount').value) || 0;
      const fromLvl = parseInt(from.value);
      const toLvl = parseInt(to.value);

      const troopFrom = troopData.find(t => t.type === type && t.level === fromLvl);
      const troopTo = troopData.find(t => t.type === type && t.level === toLvl);

      if (!troopTo || !troopFrom) return;

      // Promotion Time is the difference in base times
      const timeDiffPerTroop = troopTo.time - troopFrom.time;
      const totalSecs = (timeDiffPerTroop / (1 + (currentTotalSpeed / 100))) * amount;
      
      const pTo = koiData.stage_4.points[`lvl${toLvl}_troop`] || 0;
      const pFrom = koiData.stage_4.points[`lvl${fromLvl}_troop`] || 0;
      
      document.getElementById('promoTimeResult').innerText = formatTime(totalSecs);
      document.getElementById('promoPointsResult').innerText = ((pTo - pFrom) * amount).toLocaleString();
      document.getElementById('promoMeatRes').innerText = ((troopTo.meat - troopFrom.meat) * amount).toLocaleString();
      document.getElementById('promoWoodRes').innerText = ((troopTo.wood - troopFrom.wood) * amount).toLocaleString();
      document.getElementById('promoCoalRes').innerText = ((troopTo.coal - troopFrom.coal) * amount).toLocaleString();
      document.getElementById('promoIronRes').innerText = ((troopTo.iron - troopFrom.iron) * amount).toLocaleString();
    });

    // --- CLEAR ALL ---
    document.getElementById('btnClear').addEventListener('click', () => {
        location.reload();
    });

  } catch (e) { console.error("Load Error", e); }
}

function populateDropdowns(levels) {
  ['revLevelSelect', 'levelSelect', 'promoFrom'].forEach(id => {
    const el = document.getElementById(id);
    if (el) levels.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = `Level ${t}`;
      el.appendChild(opt);
    });
  });
}

function formatTime(s) {
  if (s <= 0) return "0s";
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  
  let res = "";
  if (d > 0) res += d + "d ";
  if (h > 0) res += h + "h ";
  if (m > 0) res += m + "m ";
  if (sec > 0 || res === "") res += sec + "s";
  return res.trim();
}

init();