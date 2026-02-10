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
    
    const updateFinalSpeed = (raw) => {
      const state = parseFloat(document.getElementById('stateBuff').value) || 0;
      const min = parseFloat(document.getElementById('ministerBuff').value) || 0;
      currentTotalSpeed = raw + state + min;
      document.getElementById('totalSpeedResult').innerText = currentTotalSpeed.toFixed(2);
    };

    // --- SECTION 1: SPEED ---
    document.getElementById('btnCalculateRaw').addEventListener('click', () => {
      const type = document.getElementById('revTypeSelect').value;
      const level = parseInt(document.getElementById('revLevelSelect').value);
      const amount = parseInt(document.getElementById('revAmount').value) || 0;
      const actualSecs = (parseInt(document.getElementById('days').value) || 0) * 86400 +
                         (parseInt(document.getElementById('hours').value) || 0) * 3600 +
                         (parseInt(document.getElementById('mins').value) || 0) * 60 +
                         (parseInt(document.getElementById('secs').value) || 0);
      
      const troop = troopData.find(t => t.type === type && t.level === level);
      if (actualSecs > 0 && troop) {
        const rawSpeed = ((troop.time * amount) / actualSecs) * 100;
        document.getElementById('rawSpeedResult').innerText = rawSpeed.toFixed(2);
        updateFinalSpeed(rawSpeed);
      }
    });

    ['stateBuff', 'ministerBuff'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            updateFinalSpeed(parseFloat(document.getElementById('rawSpeedResult').innerText) || 0);
        });
    });

    // --- SECTION 2: TRAINING ---
    document.getElementById('btnCalcTrain').addEventListener('click', () => {
      const type = document.getElementById('typeSelect').value;
      const level = document.getElementById('levelSelect').value;
      const amount = parseInt(document.getElementById('trainAmount').value) || 0;
      const troop = troopData.find(t => t.type === type && t.level == level);

      if (!troop) return;

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

      // Time Difference
      const timeDiffPerTroop = troopTo.time - troopFrom.time;
      const totalSecs = (timeDiffPerTroop / (1 + (currentTotalSpeed / 100))) * amount;
      
      // Points/Resources Difference
      const pTo = koiData.stage_4.points[`lvl${toLvl}_troop`] || 0;
      const pFrom = koiData.stage_4.points[`lvl${fromLvl}_troop`] || 0;
      
      document.getElementById('promoTimeResult').innerText = formatTime(totalSecs);
      document.getElementById('promoPointsResult').innerText = ((pTo - pFrom) * amount).toLocaleString();
      document.getElementById('promoMeatRes').innerText = ((troopTo.meat - troopFrom.meat) * amount).toLocaleString();
      document.getElementById('promoWoodRes').innerText = ((troopTo.wood - troopFrom.wood) * amount).toLocaleString();
      document.getElementById('promoCoalRes').innerText = ((troopTo.coal - troopFrom.coal) * amount).toLocaleString();
      document.getElementById('promoIronRes').innerText = ((troopTo.iron - troopFrom.iron) * amount).toLocaleString();
    });

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
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${sec}s`;
}

init();