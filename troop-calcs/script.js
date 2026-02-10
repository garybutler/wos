let currentTotalSpeed = 0;

async function init() {
  try {
    const [troopRes, koiRes] = await Promise.all([
      fetch('../data/troop_data.json'),
      fetch('../data/koi_points.json')
    ]);
    const troopData = await troopRes.json();
    const koiData = await koiRes.json();

    // Populate Levels
    const levels = [...new Set(troopData.map(t => t.level))];
    populateDropdowns(levels);
    
    // --- SECTION 1: SPEED ---
    const updateFinalSpeed = (raw) => {
      const state = parseFloat(document.getElementById('stateBuff').value) || 0;
      const min = parseFloat(document.getElementById('ministerBuff').value) || 0;
      currentTotalSpeed = raw + state; // Base calculation + buffs
      // If minister is selected, add it (usually multiplicative in game, but additive for raw speed stats)
      currentTotalSpeed += min; 
      
      document.getElementById('totalSpeedResult').innerText = currentTotalSpeed.toFixed(2);
    };

    document.getElementById('btnCalculateRaw').addEventListener('click', () => {
      const type = document.getElementById('revTypeSelect').value;
      const level = parseInt(document.getElementById('revLevelSelect').value);
      const amount = parseInt(document.getElementById('revAmount').value);
      
      const d = parseInt(document.getElementById('days').value) || 0;
      const h = parseInt(document.getElementById('hours').value) || 0;
      const m = parseInt(document.getElementById('mins').value) || 0;
      const s = parseInt(document.getElementById('secs').value) || 0;
      
      const actualSecs = (d * 86400) + (h * 3600) + (m * 60) + s;
      const troop = troopData.find(t => t.type === type && t.level === level);
      
      if (actualSecs > 0 && troop) {
        const baseSecs = troop.time * amount;
        const rawSpeed = (baseSecs / actualSecs) * 100;
        document.getElementById('rawSpeedResult').innerText = rawSpeed.toFixed(2);
        updateFinalSpeed(rawSpeed);
      }
    });

    // Real-time updates when buffs change
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
      const amount = parseInt(document.getElementById('trainAmount').value);
      const troop = troopData.find(t => t.type === type && t.level == level);

      if (!troop) return;

      // Formula: Total Time = (Base Time / (1 + Speed%)) * Amount
      const adjTimePer1 = troop.time / (1 + (currentTotalSpeed / 100));
      const totalSecs = adjTimePer1 * amount;

      document.getElementById('timeResult').innerText = formatTime(totalSecs);
      document.getElementById('meatRes').innerText = (troop.meat * amount).toLocaleString();
      document.getElementById('woodRes').innerText = (troop.wood * amount).toLocaleString();
      document.getElementById('coalRes').innerText = (troop.coal * amount).toLocaleString();
      document.getElementById('ironRes').innerText = (troop.iron * amount).toLocaleString();

      const pts = koiData.stage_4.points[`lvl${level}_troop`] * amount;
      document.getElementById('koiResult').innerText = pts.toLocaleString();
    });

    // --- SECTION 3: PROMOTION ---
    const from = document.getElementById('promoFrom');
    const to = document.getElementById('promoTo');

    from.addEventListener('change', () => {
      to.innerHTML = '';
      const currentLevel = parseInt(from.value);
      levels.filter(t => t > currentLevel).forEach(t => {
          const opt = document.createElement('option');
          opt.value = t; opt.textContent = `Level ${t}`;
          to.appendChild(opt);
      });
    });

    // Trigger initial state
    from.dispatchEvent(new Event('change'));

    document.getElementById('btnCalcPromo').addEventListener('click', () => {
      const amount = parseInt(document.getElementById('promoAmount').value);
      if(!to.value) return; // Prevent calculation if no higher level exists

      const pPts = (koiData.stage_4.points[`lvl${to.value}_troop`] - koiData.stage_4.points[`lvl${from.value}_troop`]) * amount;
      document.getElementById('promoPromoResult').innerText = pPts.toLocaleString();
    });

  } catch (e) { 
      console.error("Data Load Error: Please check your JSON syntax.", e); 
  }
}

function populateDropdowns(levels) {
  ['revLevelSelect', 'levelSelect', 'promoFrom'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    levels.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = `Level ${t}`;
        el.appendChild(opt);
    });
  });
}

function formatTime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  
  let parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (sec > 0 || parts.length === 0) parts.push(`${sec}s`);
  
  return parts.join(' ');
}

init();