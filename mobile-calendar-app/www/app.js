// Native Mobile Calendar Logic
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
  4: { 3: { title: "कृष्ण जन्माष्टमी", isHoliday: true }, 4: { title: "गौरा पर्व", isHoliday: true }, 5: { title: "हरितालिका तीज", isHoliday: true } },
  5: { 3: { title: "इन्द्रजात्रा", isHoliday: true }, 28: { title: "घटस्थापना (Dashain Begins)", isHoliday: true } },
  6: { 4: { title: "फूलपाती", isHoliday: true }, 5: { title: "महा अष्टमी", isHoliday: true }, 6: { title: "महानवमी", isHoliday: true }, 7: { title: "विजया दशमी", isHoliday: true }, 28: { title: "लक्ष्मीपूजा", isHoliday: true }, 30: { title: "भाइटीका", isHoliday: true } },
  7: { 3: { title: "छठ पर्व", isHoliday: true }, 24: { title: "उधौली पर्व / धान्य पूर्णिमा", isHoliday: true } },
  8: { 10: { title: "क्रिसमस डे", isHoliday: true }, 15: { title: "तमु ल्होसार", isHoliday: true } },
  9: { 1: { title: "माघे संक्रान्ति", isHoliday: true }, 21: { title: "सोनाम ल्होसार", isHoliday: true } },
  10: { 7: { title: "सरस्वती पूजा / प्रजातन्त्र दिवस", isHoliday: true }, 24: { title: "महाशिवरात्रि", isHoliday: true } },
  11: { 1: { title: "फागु पूर्णिमा (Holi)", isHoliday: true }, 25: { title: "रामनवमी", isHoliday: true } }
};

let currentNpYear = 2083;
let currentNpMonth = 2; // Ashadh (0-indexed)

const toNepaliDigits = (num) => {
  const map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().split('').map(c => map[parseInt(c, 10)] || c).join('');
};

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCalendar();
  initConverter();
  initTabSystem();
});

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

  for (let y = 2000; y <= 2100; y++) {
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
    currentNpMonth = 2;
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

  // Approximate offset and days
  const totalDays = 32;
  const startDayOfWeek = (currentNpMonth * 2 + currentNpYear) % 7;

  for (let i = 0; i < startDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    daysGrid.appendChild(emptyCell);
  }

  const monthEvents = NE_MONTHS_EVENTS[currentNpMonth] || {};
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML = '';

  for (let d = 1; d <= totalDays; d++) {
    const cell = document.createElement('div');
    const dayOfWeek = (startDayOfWeek + d - 1) % 7;
    const isSat = dayOfWeek === 6;
    const event = monthEvents[d];

    cell.className = `day-cell ${isSat ? 'saturday' : ''} ${event && event.isHoliday ? 'holiday' : ''} ${d === 16 && currentNpMonth === 2 ? 'today' : ''}`;
    
    cell.innerHTML = `
      <span class="nep-date">${toNepaliDigits(d)}</span>
      <span class="eng-date">${d}</span>
    `;

    daysGrid.appendChild(cell);

    if (event) {
      const li = document.createElement('li');
      li.className = 'event-item';
      li.innerHTML = `
        <span class="event-gate">${d} गते</span>
        <span>${event.title}</span>
      `;
      eventsList.appendChild(li);
    }
  }

  if (eventsList.children.length === 0) {
    eventsList.innerHTML = '<li class="event-item"><span style="color:#71717a">यो महिना कुनै मुख्य सार्वजनिक बिदा छैन।</span></li>';
  }
}

function initConverter() {
  let mode = 'BS_TO_AD';
  const container = document.getElementById('converterInputs');

  const renderInputs = () => {
    if (mode === 'BS_TO_AD') {
      container.innerHTML = `
        <select id="convYear" class="form-select">
          ${[2080, 2081, 2082, 2083, 2084, 2085].map(y => `<option value="${y}" ${y === 2083 ? 'selected' : ''}>BS ${y}</option>`).join('')}
        </select>
        <select id="convMonth" class="form-select">
          ${NEPALI_MONTHS_NE.map((m, i) => `<option value="${i}">${m}</option>`).join('')}
        </select>
        <input type="number" id="convDay" class="form-input" min="1" max="32" value="15" placeholder="Day (गते)" />
      `;
    } else {
      container.innerHTML = `
        <select id="convYear" class="form-select">
          ${[2024, 2025, 2026, 2027, 2028].map(y => `<option value="${y}" ${y === 2026 ? 'selected' : ''}>AD ${y}</option>`).join('')}
        </select>
        <select id="convMonth" class="form-select">
          ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => `<option value="${i}">${m}</option>`).join('')}
        </select>
        <input type="number" id="convDay" class="form-input" min="1" max="31" value="1" placeholder="Day" />
      `;
    }
  };

  renderInputs();

  document.getElementById('bsToAdBtn').addEventListener('click', (e) => {
    document.getElementById('bsToAdBtn').classList.add('active');
    document.getElementById('adToBsBtn').classList.remove('active');
    mode = 'BS_TO_AD';
    renderInputs();
  });

  document.getElementById('adToBsBtn').addEventListener('click', (e) => {
    document.getElementById('adToBsBtn').classList.add('active');
    document.getElementById('bsToAdBtn').classList.remove('active');
    mode = 'AD_TO_BS';
    renderInputs();
  });

  document.getElementById('convertExecBtn').addEventListener('click', () => {
    const y = parseInt(document.getElementById('convYear').value, 10);
    const m = parseInt(document.getElementById('convMonth').value, 10);
    const d = parseInt(document.getElementById('convDay').value, 10) || 1;

    if (mode === 'BS_TO_AD') {
      const adYear = y - 57;
      document.getElementById('resultText').textContent = `AD ${adYear}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    } else {
      const bsYear = y + 57;
      document.getElementById('resultText').textContent = `BS ${toNepaliDigits(bsYear)} ${NEPALI_MONTHS_NE[m]} ${toNepaliDigits(d)} गते`;
    }
  });
}
