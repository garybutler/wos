let currentTotalSpeed = 0;

async function init() {
  try {
    const [troopRes, koiRes] = await Promise.all([
      fetch('../data/troop_data.json'),
      fetch('../data/koi_points.json')
    ]);
    const troopData = await troopRes.json();
    const koiData = await koiRes.json();

    // Populate Tiers
    const tiers = [...new Set(troopData.map(t => t.tier))];
    populateDropdowns(tiers);
    
    // --- SECTION 1: SPEED ---
    document.getElementById('btnCalculateRaw').addEventListener('click', () => {
      const type = document.getElementById('revTypeSelect').value;
      const tier = parseInt(document.getElementById('revTierSelect').value);
      const amount = parseInt(document.getElementById('revAmount').value);
      
      const d = parseInt(document.getElementById('days').value) || 0;
      const h = parseInt(document.getElementById('hours').value) || 0;
      const m = parseInt(document.getElementById('mins').value) || 0;
      const s = parseInt(document.getElementById('secs').value) || 0;
      
      const actualSecs = (d * 86400) + (h * 3600) + (m * 60) + s;
      const troop = troopData.find(t => t.type === type && t.tier === tier);
      
      if (actualSecs > 0 && troop) {
        const baseSecs = troop.time * amount;
        const rawSpeed = (baseSecs / actualSecs) * 100;
        document.getElementById('rawSpeedResult').innerText = rawSpeed.toFixed(2);
        updateFinalSpeed(rawSpeed);
        }
    });

    const updateFinalSpeed = (raw) => {
      const state = parseFloat(document.getElementById('stateBuff').value) || 0;
      const min = parseFloat(document.getElementById('ministerBuff').value) || 0;
      currentTotalSpeed = raw + state + min;
      document.getElementById('totalSpeedResult').innerText = currentTotalSpeed.toFixed(2);
    };

    // --- SECTION 2: TRAINING ---
    document.getElementById('btnCalcTrain').addEventListener('click', () => {
      const type = document.getElementById('typeSelect').value;
      const tier = document.getElementById('tierSelect').value;
      const amount = parseInt(document.getElementById('trainAmount').value);
      const troop = troopData.find(t => t.type === type && t.tier == tier);

      if (!troop) return;

      const adjTimePer1 = troop.time / (1 + (currentTotalSpeed / 100));
      const totalSecs = adjTimePer1 * amount;

      document.getElementById('timeResult').innerText = formatTime(totalSecs);
      document.getElementById('meatRes').innerText = (troop.meat * amount).toLocaleString();
      document.getElementById('woodRes').innerText = (troop.wood * amount).toLocaleString();
      document.getElementById('coalRes').innerText = (troop.coal * amount).toLocaleString();
      document.getElementById('ironRes').innerText = (troop.iron * amount).toLocaleString();

      const pts = koiData.stage_4.points[`lvl${tier}_troop`] * amount;
      document.getElementById('koiResult').innerText = pts.toLocaleString();
    });

    // --- SECTION 3: PROMOTION ---
    const from = document.getElementById('promoFrom');
    const to = document.getElementById('promoTo');

    from.addEventListener('change', () => {
      to.innerHTML = '';
      const currentTier = parseInt(from.value);
      tiers.filter(t => t > currentTier).forEach(t => {
          const opt = document.createElement('option');
          opt.value = t; opt.textContent = `Tier ${t}`;
          to.appendChild(opt);
      });
    });
    
    from.dispatchEvent(new Event('change'));

    document.getElementById('btnCalcPromo').addEventListener('click', () => {
      const amount = parseInt(document.getElementById('promoAmount').value);
      const pPts = (koiData.stage_4.points[`lvl${to.value}_troop`] - koiData.stage_4.points[`lvl${from.value}_troop`]) * amount;
      document.getElementById('promoPromoResult').innerText = pPts.toLocaleString();
    });

  } catch (e) { console.error("Data Load Error", e); }
}

function populateDropdowns(tiers) {
  ['revTierSelect', 'tierSelect', 'promoFrom'].forEach(id => {
    const el = document.getElementById(id);
    tiers.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = `Tier ${t}`;
        el.appendChild(opt);
    });
  });
}

function formatTime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${sec}s`;
}

init();