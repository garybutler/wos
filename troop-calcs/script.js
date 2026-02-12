let currentTotalSpeed = 0;
let troopData = [];
let koiData = {};
let svsData = {}

const $ = document.getElementById.bind(document);

async function init() {
  try {
    const [tRes, kRes, sRes] = await Promise.all([
      fetch('../data/troop_data.json'),
      fetch('../data/koi_points.json'),
      fetch('../data/svs_points.json'),
    ]);
    troopData = await tRes.json();
    koiData = await kRes.json();
    svsData = await sRes.json();

    const levels = [...new Set(troopData.map(t => t.level))];
    setupDropdowns(levels);
    
    $('btnCalculateSpeed').addEventListener('click', updateSpeed);
    $('btnCalculateAll').addEventListener('click', calculateGrandTotal);
    $('btnClear').addEventListener('click', () => location.reload());

  } catch (e) { console.error("Data Load Error", e); }
}

function setupDropdowns(levels) {
  populate('revLevelSelect', levels);

  for (let i = 1; i <= 3; i++) {
    const from = $(`pFrom${i}`);
    const to = $(`pTo${i}`);
    
    populate(`levelSelect${i}`, levels);
    populate(`pFrom${i}`, levels);

    from.addEventListener('change', () => {
      const prevTo = to.value;
      const curFrom = parseInt(from.value);
      to.innerHTML = '';
      levels.filter(l => l > curFrom).forEach(l => {
        const opt = document.createElement('option');
        opt.value = l; opt.textContent = `Level ${l}`;
        to.appendChild(opt);
      });
      if (parseInt(prevTo) > curFrom) to.value = prevTo;
    });
    from.dispatchEvent(new Event('change'));
  }
}

function formatTime(s) {
  if (s <= 0) return "0s";
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  let r = "";
  if (d > 0) r += d + "d ";
  if (h > 0) r += h + "h ";
  if (m > 0) r += m + "m ";
  if (sec > 0 || r === "") r += sec + "s";
  return r.trim();
}

function populate(el, lvls) {
  lvls.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l; opt.textContent = `Level ${l}`;
    $(el).appendChild(opt);
  });
}

function updateSpeed() {
  const type = $('revTypeSelect').value;
  const lvl = parseInt($('revLevelSelect').value);
  const amt = parseInt($('revAmount').value) || 0;
  const s = (parseInt($('days').value) || 0) * 86400 +
            (parseInt($('hours').value) || 0) * 3600 +
            (parseInt($('mins').value) || 0) * 60 +
            (parseInt($('secs').value) || 0);

  const troop = troopData.find(t => t.type === type && t.level === lvl);
  if (s > 0 && troop && amt > 0) {
    const raw = ((troop.time * amt / s) - 1) * 100;
    const bonus = parseFloat($('stateBuff').value || 0) + 
                  parseFloat($('ministerBuff').value || 0);
    console.log($('stateBuff').value, $('ministerBuff').value)
    currentTotalSpeed = Math.max(0, raw) + bonus;
    $('totalSpeedResult').innerText = currentTotalSpeed.toFixed(2);
  }
}

function calculateGrandTotal() {
  let gTime = 0, gKPts = 0, gSPts = 0, gMeat = 0, gWood = 0, gCoal = 0, gIron = 0;

  // Training Lots
  for (let i = 1; i <= 3; i++) {
    const type = $(`typeSelect${i}`).value;
    const lvl = $(`levelSelect${i}`).value;
    const amt = parseInt($(`trainAmount${i}`).value) || 0;
    const troop = troopData.find(t => t.type === type && t.level == lvl);

    if (troop && amt > 0) {
      const time = (troop.time / (1 + currentTotalSpeed / 100)) * amt;
      const kPts = (koiData.stage_4.points[`lvl${lvl}_troop`] || 0) * amt;
      const sPts = (svsData.stage_4.points[`lvl${lvl}_troop`] || 0) * amt;
      
      // Individual displays
      $(`time${i}`).innerText = formatTime(time);
      $(`kPts${i}`).innerText = kPts.toLocaleString();
      $(`sPts${i}`).innerText = sPts.toLocaleString();
      $(`m${i}`).innerText = (troop.meat * amt).toLocaleString();
      $(`l${i}`).innerText = (troop.wood * amt).toLocaleString();
      $(`c${i}`).innerText = (troop.coal * amt).toLocaleString();
      $(`i${i}`).innerText = (troop.iron * amt).toLocaleString();
      $(`tpsT${i}`).innerText = (amt / time).toFixed(4);
      $(`kppsT${i}`).innerText = (kPts / time).toFixed(4);
      $(`sppsT${i}`).innerText = (sPts / time).toFixed(4);

      gTime += time; gKPts += kPts; gSPts += sPts;
      gMeat += troop.meat * amt; gWood += troop.wood * amt;
      gCoal += troop.coal * amt; gIron += troop.iron * amt;
    }
  }

  // Promotion Lots
  for (let i = 1; i <= 3; i++) {
    const type = $(`pType${i}`).value;
    const fLvl = parseInt($(`pFrom${i}`).value);
    const tLvl = parseInt($(`pTo${i}`).value);
    const amt = parseInt($(`pAmt${i}`).value) || 0;

    const tF = troopData.find(t => t.type === type && t.level === fLvl);
    const tT = troopData.find(t => t.type === type && t.level === tLvl);

    if (tF && tT && amt > 0) {
      const time = ((tT.time - tF.time) / (1 + currentTotalSpeed / 100)) * amt;
      const kPts = ((koiData.stage_4.points[`lvl${tLvl}_troop`] || 0) - (koiData.stage_4.points[`lvl${fLvl}_troop`] || 0)) * amt;
      const sPts = ((svsData.stage_4.points[`lvl${tLvl}_troop`] || 0) - (svsData.stage_4.points[`lvl${fLvl}_troop`] || 0)) * amt;
      
      // Individual displays
      $(`pTime${i}`).innerText = formatTime(time); // Added this line
      $(`pKPts${i}`).innerText = kPts.toLocaleString();
      $(`pSPts${i}`).innerText = sPts.toLocaleString();
      $(`pm${i}`).innerText = ((tT.meat - tF.meat) * amt).toLocaleString();
      $(`pl${i}`).innerText = ((tT.wood - tF.wood) * amt).toLocaleString();
      $(`pc${i}`).innerText = ((tT.coal - tF.coal) * amt).toLocaleString();
      $(`pi${i}`).innerText = ((tT.iron - tF.iron) * amt).toLocaleString();
      $(`tpsP${i}`).innerText = (amt / time).toFixed(4);
      $(`kppsP${i}`).innerText = (kPts / time).toFixed(4);
      $(`sppsP${i}`).innerText = (sPts / time).toFixed(4);

      gTime += time; gKPts += kPts; gSPts += sPts;
      gMeat += (tT.meat - tF.meat) * amt; gWood += (tT.wood - tF.wood) * amt;
      gCoal += (tT.coal - tF.coal) * amt; gIron += (tT.iron - tF.iron) * amt;
    }
  }

  // Update Grand Totals
  $('grandTime').innerText = formatTime(gTime);
  $('grandKPts').innerText = gKPts.toLocaleString();
  $('grandSPts').innerText = gSPts.toLocaleString();
  $('grandMeat').innerText = gMeat.toLocaleString();
  $('grandWood').innerText = gWood.toLocaleString();
  $('grandCoal').innerText = gCoal.toLocaleString();
  $('grandIron').innerText = gIron.toLocaleString();
}

init();