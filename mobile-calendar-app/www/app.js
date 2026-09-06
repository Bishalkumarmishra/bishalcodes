// Native Mobile Calendar Logic (iOS & Android Native)
const NEPALI_MONTHS_EN = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

const NEPALI_MONTHS_NE = [
  "वैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
  "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"
];

const NE_MONTHS_EVENTS = {
  0: { 1: { title: "नयाँ वर्ष / मे दिवस", isHoliday: true }, 11: { title: "लोकतन्त्र दिवस", isHoliday: true } },
  1: { 15: { title: "गणतन्त्र दिवस", isHoliday: true } },
  2: { 6: { title: "भोटो जात्रा / सिथि नखः", isHoliday: true }, 29: { title: "भानु जयन्ती", isHoliday: false } },
  3: { 1: { title: "साउने संक्रान्ति", isHoliday: false }, 27: { title: "जनै पूर्णिमा / रक्षा बन्धन", isHoliday: true }, 28: { title: "गाईजात्रा", isHoliday: true } },
  4: { 3: { title: "कृष्ण जन्माष्टमी", isHoliday: true }, 4: { title: "गौरा पर्व", isHoliday: true }, 5: { title: "हरितालिका तीज", isHoliday: true }, 20: { title: "मानव बेचबिखन विरुद्ध दिवस", isHoliday: false } },
  5: { 3: { title: "इन्द्रजात्रा", isHoliday: true }, 28: { title: "घटस्थापना (Dashain Begins)", isHoliday: true } },
  6: { 4: { title: "फूलपाती", isHoliday: true }, 5: { title: "महा अष्टमी", isHoliday: true }, 6: { title: "महानवमी", isHoliday: true }, 7: { title: "विजया दशमी", isHoliday: true }, 28: { title: "लक्ष्मीपूजा", isHoliday: true }, 30: { title: "भाइटीका", isHoliday: true } },
  7: { 3: { title: "छठ पर्व", isHoliday: true }, 24: { title: "उधौली पर्व / धान्य पूर्णिमा", isHoliday: true } },
  8: { 10: { title: "क्रिसमस डे", isHoliday: true }, 15: { title: "तमु ल्होसार", isHoliday: true } },
  9: { 1: { title: "माघे संक्रान्ति", isHoliday: true }, 21: { title: "सोनाम ल्होसार", isHoliday: true } },
  10: { 7: { title: "सरस्वती पूजा / प्रजातन्त्र दिवस", isHoliday: true }, 24: { title: "महाशिवरात्रि", isHoliday: true } },
  11: { 1: { title: "फागु पूर्णिमा (Holi)", isHoliday: true }, 25: { title: "रामनवमी", isHoliday: true } }
};

const ZODIAC_SIGNS = [
  { id: 'mesh', name: 'मेष', icon: '♈', desc: 'आज कार्यक्षेत्रमा नयाँ अवसरहरू मिल्नेछन्। मनमा प्रसन्नता छाउनेछ।' },
  { id: 'vrish', name: 'वृष', icon: '♉', desc: 'आर्थिक लाभको योग छ। परिवारको सहयोग पाइनेछ।' },
  { id: 'mithun', name: 'मिथुन', icon: '♊', desc: 'बोलीको प्रभाव बढ्नेछ। रोकिएका कामहरू सुचारु हुनेछन्।' },
  { id: 'karka', name: 'कर्कट', icon: '♋', desc: 'स्वास्थ्यमा सामान्य ध्यान दिनुहोला। यात्राको सम्भावना छ।' },
  { id: 'simha', name: 'सिंह', icon: '♌', desc: 'प्रतिष्ठा वृद्धि हुनेछ। सामाजिक कार्यमा रुचि बढ्नेछ।' },
  { id: 'kanya', name: 'कन्या', icon: '♍', desc: 'व्यवसायमा लाभ हुनेछ। नयाँ मित्रहरूसँग भेटघाट हुनेछ।' },
  { id: 'tula', name: 'तुला', icon: '♎', desc: 'आध्यात्मिक सोच बढ्नेछ। वैदेशिक कार्यमा सफलता मिल्नेछ।' },
  { id: 'vrischika', name: 'वृश्चिक', icon: '♏', desc: 'परिश्रमको फल प्राप्त हुनेछ। व्यापारमा प्रगति हुनेछ।' },
  { id: 'dhanu', name: 'धनु', icon: '♐', desc: 'पारिवारिक सुख मिल्नेछ। पठनपाठनमा प्रगति हुनेछ।' },
  { id: 'makar', name: 'मकर', icon: '♑', desc: 'शत्रुहरू परास्त हुनेछन्। आरोग्यता प्राप्त हुनेछ।' },
  { id: 'kumbha', name: 'कुम्भ', icon: '♒', desc: 'बुद्धिको प्रयोगले काम बन्नेछन्। सन्तान तर्फबाट खुसी मिल्नेछ।' },
  { id: 'meen', name: 'मीन', icon: '♓', desc: 'सवारी साधन चलाउँदा सावधानी अपनाउनुहोला। धन संचय हुनेछ।' }
];

let currentNpYear = 2083;
let currentNpMonth = 4; // Bhadra (0-indexed)

const toNepaliDigits = (num) => {
  const map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().split('').map(c => map[parseInt(c, 10)] || c).join('');
};

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCalendar();
  initConverter();
  initHoroscope();
  initTabSystem();
  initLiveClock();
});

function initLiveClock() {
  const clockEl = document.getElementById('liveClockText');
  const update = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    if (clockEl) {
      clockEl.textContent = `${toNepaliDigits(hours)}:${toNepaliDigits(minutes)}:${toNepaliDigits(seconds)} ${ampm}`;
    }
  };
  update();
  setInterval(update, 1000);
}

function initTabSystem() {
  const tabs = document.querySelectorAll('.bar-tab');
  const views = document.querySelectorAll('.tab-view');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      tab.classList.add('active');
      const viewId = tab.getAttribute('data-tab');
      document.getElementById(viewId).classList.add('active');
    });
  });
}

function initNavigation() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');

  NEPALI_MONTHS_NE.forEach((m, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });

  for (let y = 2075; y <= 2090; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = toNepaliDigits(y);
    yearSelect.appendChild(opt);
  }

  monthSelect.value = currentNpMonth;
  yearSelect.value = currentNpYear;

  monthSelect.addEventListener('change', (e) => {
    currentNpMonth = parseInt(e.target.value, 10);
    renderCalendar();
  });

  yearSelect.addEventListener('change', (e) => {
    currentNpYear = parseInt(e.target.value, 10);
    renderCalendar();
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentNpMonth === 0) {
      currentNpMonth = 11;
      currentNpYear--;
    } else {
      currentNpMonth--;
    }
    syncSelectors();
    renderCalendar();
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentNpMonth === 11) {
      currentNpMonth = 0;
      currentNpYear++;
    } else {
      currentNpMonth++;
    }
    syncSelectors();
    renderCalendar();
  });

  document.getElementById('todayBtn').addEventListener('click', () => {
    currentNpYear = 2083;
    currentNpMonth = 4;
    syncSelectors();
    renderCalendar();
  });
}

function syncSelectors() {
  document.getElementById('monthSelect').value = currentNpMonth;
  document.getElementById('yearSelect').value = currentNpYear;
}

function initCalendar() {
  renderCalendar();
}

function renderCalendar() {
  document.getElementById('monthTitle').textContent = `${NEPALI_MONTHS_NE[currentNpMonth]} ${toNepaliDigits(currentNpYear)}`;
  document.getElementById('subTitle').textContent = `${NEPALI_MONTHS_EN[currentNpMonth]} ${currentNpYear}`;

  const daysGrid = document.getElementById('daysGrid');
  daysGrid.innerHTML = '';

  const totalDays = 31; // Nepali month days approx
  const startDay = 0; // Sunday

  for (let i = 0; i < startDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    daysGrid.appendChild(emptyCell);
  }

  const events = NE_MONTHS_EVENTS[currentNpMonth] || {};
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML = '';

  for (let d = 1; d <= totalDays; d++) {
    const dayCell = document.createElement('div');
    const dayOfWeek = (startDay + d - 1) % 7;
    const isSaturday = dayOfWeek === 6;
    const event = events[d];

    let cellClass = 'day-cell';
    if (isSaturday) cellClass += ' saturday';
    if (event && event.isHoliday) cellClass += ' holiday';
    if (d === 20 && currentNpMonth === 4 && currentNpYear === 2083) cellClass += ' today';

    dayCell.className = cellClass;
    dayCell.innerHTML = `
      <span class="nep-date">${toNepaliDigits(d)}</span>
      <span class="eng-date">${d}</span>
    `;

    daysGrid.appendChild(dayCell);

    if (event) {
      const li = document.createElement('li');
      li.className = 'event-item';
      li.innerHTML = `
        <span class="event-gate">${toNepaliDigits(d)} गते</span>
        <span>${event.title}</span>
      `;
      eventsList.appendChild(li);
    }
  }
}

function initConverter() {
  const inputsContainer = document.getElementById('converterInputs');
  inputsContainer.innerHTML = `
    <input type="number" id="cYear" class="form-input" value="2083" placeholder="Year" />
    <input type="number" id="cMonth" class="form-input" value="5" placeholder="Month" />
    <input type="number" id="cDay" class="form-input" value="20" placeholder="Day" />
  `;

  document.getElementById('convertExecBtn').addEventListener('click', () => {
    const y = parseInt(document.getElementById('cYear').value, 10);
    const m = parseInt(document.getElementById('cMonth').value, 10);
    const d = parseInt(document.getElementById('cDay').value, 10);

    const adYear = y - 57;
    document.getElementById('resultText').textContent = `Sep ${d}, ${adYear} (AD)`;
  });
}

function initHoroscope() {
  const grid = document.getElementById('zodiacGrid');
  const descBox = document.getElementById('zodiacDescBox');

  if (!grid || !descBox) return;
  grid.innerHTML = '';

  ZODIAC_SIGNS.forEach((z, idx) => {
    const btn = document.createElement('button');
    btn.style.cssText = "background:#1e293b; color:#fff; border:1px solid #334155; border-radius:8px; padding:6px; font-size:10px; cursor:pointer;";
    btn.innerHTML = `<div style="font-size:14px;">${z.icon}</div><div>${z.name}</div>`;
    btn.addEventListener('click', () => {
      descBox.innerHTML = `<strong>${z.name} (${z.icon}):</strong><br/>${z.desc}`;
    });
    grid.appendChild(btn);
  });
}
