const { ipcRenderer } = require('electron');
const NepaliDateRaw = require('nepali-date-converter');
const NepaliDate = (NepaliDateRaw && NepaliDateRaw.default) ? NepaliDateRaw.default : NepaliDateRaw;

// --- Constants ---
const NEPALI_MONTHS_EN = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

const NEPALI_MONTHS_NE = [
  "वैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
  "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"
];

const GREGORIAN_MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_NE = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
const DAYS_NE_SHORT = ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"];

// Holidays definitions
const NE_MONTHS_EVENTS = {
  0: { // Baisakh
    1: { title: "नयाँ वर्ष (New Year)", isHoliday: true },
    11: { title: "लोकतन्त्र दिवस (Loktantra Diwas)", isHoliday: true },
    30: { title: "मातातीर्थ औंसी (Mother's Day)", isHoliday: false }
  },
  1: { // Jestha
    15: { title: "गणतन्त्र दिवस (Republic Day)", isHoliday: true }
  },
  2: { // Ashadh
    15: { title: "धान दिवस / दही चिउरा खाने दिन", isHoliday: false },
    29: { title: "भानु जयन्ती (Bhanu Jayanti)", isHoliday: false }
  },
  3: { // Shrawan
    15: { title: "खीर खाने दिन", isHoliday: false },
    27: { title: "जनै पूर्णिमा / रक्षा बन्धन", isHoliday: true },
    28: { title: "गाईजात्रा (Gai Jatra)", isHoliday: true }
  },
  4: { // Bhadra
    3: { title: "कृष्ण जन्माष्टमी (Krishna Janmashtami)", isHoliday: true },
    4: { title: "गौरा पर्व", isHoliday: true },
    6: { title: "हरितालिका तीज व्रत (Teej)", isHoliday: true },
    8: { title: "ऋषि पञ्चमी", isHoliday: false },
    14: { title: "इन्द्रजात्रा (Indra Jatra)", isHoliday: true }
  },
  5: { // Ashwin
    3: { title: "संविधान दिवस (Constitution Day)", isHoliday: true },
    10: { title: "घटस्थापना (Dashain Begins)", isHoliday: true },
    17: { title: "फूलपाती", isHoliday: true },
    18: { title: "महा अष्टमी", isHoliday: true },
    19: { title: "महानवमी", isHoliday: true },
    20: { title: "विजया दशमी (Bijaya Dashami)", isHoliday: true },
    21: { title: "एकादशी", isHoliday: true },
    24: { title: "कोजाग्रत पूर्णिमा (Dashain Ends)", isHoliday: true }
  },
  6: { // Kartik
    12: { title: "काग तिहार", isHoliday: false },
    13: { title: "लक्ष्मी पूजा / कुकुर तिहार", isHoliday: true },
    14: { title: "गोवर्धन पूजा / म्ह पूजा", isHoliday: true },
    15: { title: "भाइटीका (Tihar Diwas)", isHoliday: true },
    20: { title: "छठ पर्व (Chhath Parva)", isHoliday: true }
  },
  7: { // Mangsir
    18: { title: "उधौली पर्व / धान्य पूर्णिमा", isHoliday: true }
  },
  8: { // Poush
    10: { title: "क्रिसमस डे (Christmas Day)", isHoliday: true },
    15: { title: "तमु ल्होसार", isHoliday: true },
    29: { title: "पृथ्वी जयन्ती / राष्ट्रिय एकता दिवस", isHoliday: false }
  },
  9: { // Magh
    1: { title: "माघे संक्रान्ति", isHoliday: true },
    16: { title: "सहिद दिवस", isHoliday: false },
    20: { title: "सोनाम ल्होसार", isHoliday: true }
  },
  10: { // Falgun
    7: { title: "प्रजातन्त्र दिवस (Democracy Day)", isHoliday: true },
    15: { title: "महाशिवरात्रि (Maha Shivaratri)", isHoliday: true },
    24: { title: "अन्तर्राष्ट्रिय नारी दिवस", isHoliday: true },
    27: { title: "होली (Holi - Hilly)", isHoliday: true },
    28: { title: "होली (Holi - Terai)", isHoliday: true }
  },
  11: { // Chaitra
    15: { title: "घोडेजात्रा (Valley Holiday)", isHoliday: true },
    24: { title: "चैते दशमी", isHoliday: false },
    25: { title: "रामनवमी", isHoliday: true }
  }
};

// --- App State ---
let selectedYear = 2083;
let selectedMonth = 2; // Ashadh (0-indexed)
let selectedDay = 7;

let calYear = 2083;
let calMonth = 2;

let calViewType = 'BS'; // 'BS' or 'AD'

let notes = {}; // Schema: { "2083-2-7": { color: "red", text: "Meeting at 10 AM" } }
let currentSelectedColor = 'default';

// Initialize states
try {
  const savedNotes = localStorage.getItem('desktop_calendar_notes');
  if (savedNotes) {
    notes = JSON.parse(savedNotes);
  }
} catch (e) {
  console.error("Failed to load notes from localStorage", e);
}

// Set up today's date initially
const today = new NepaliDate();
calYear = today.getYear();
calMonth = today.getMonth();
selectedYear = calYear;
selectedMonth = calMonth;
selectedDay = today.getDate();

// --- DOM References ---
// Windows Controls
const minBtn = document.getElementById('min-btn');
const closeBtn = document.getElementById('close-btn');
const widgetToggleBtn = document.getElementById('widget-toggle-btn');
const alwaysOnTopBtn = document.getElementById('always-on-top-btn');

// Tab links and screens
const tabLinks = document.querySelectorAll('.sidebar .nav-links li');
const tabContents = document.querySelectorAll('.tab-content');

// Calendar View DOM
const currentMonthDisplay = document.getElementById('current-month-display');
const subMonthDisplay = document.getElementById('sub-month-display');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const calendarDaysContainer = document.getElementById('calendar-days-container');

// Selected Day details
const detailsDayNepali = document.getElementById('details-day-nepali');
const detailsFullNepali = document.getElementById('details-full-nepali');
const detailsFullGregorian = document.getElementById('details-full-gregorian');
const detailsTithi = document.getElementById('details-tithi');
const detailsEventContainer = document.getElementById('details-event-container');
const detailsEventBadge = document.getElementById('details-event-badge');
const detailsEventTitle = document.getElementById('details-event-title');
const dayNotesList = document.getElementById('day-notes-list');
const addNoteTrigger = document.getElementById('add-note-trigger');

// Converter Form
const modeBsAd = document.getElementById('mode-bs-ad');
const modeAdBs = document.getElementById('mode-ad-bs');
const convYearSelect = document.getElementById('conv-year');
const convMonthSelect = document.getElementById('conv-month');
const convDaySelect = document.getElementById('conv-day');
const convertBtn = document.getElementById('convert-btn');
const converterResult = document.getElementById('converter-result');
const resultMainText = document.getElementById('result-main-text');
const resultSubText = document.getElementById('result-sub-text');

// Notes Manager Tab
const notesManagerListContainer = document.getElementById('notes-manager-list-container');

// Settings Tab
const settingsAlwaysTop = document.getElementById('settings-always-top');
const settingsToggleWidget = document.getElementById('settings-toggle-widget');
const themeDarkBtn = document.getElementById('theme-dark-btn');
const themeLightBtn = document.getElementById('theme-light-btn');

// Notes Modal
const noteModal = document.getElementById('note-modal');
const noteTargetDateInput = document.getElementById('note-target-date');
const noteTextInput = document.getElementById('note-text');
const colorDotOpts = document.querySelectorAll('.color-dot-opt');
const saveNoteBtn = document.getElementById('save-note-btn');
const cancelNoteBtn = document.getElementById('cancel-note-btn');
const closeModalX = document.getElementById('close-modal-x');


// --- Helpers ---
function toNepaliStr(num) {
  const map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().split('').map(c => map[parseInt(c, 10)] || c).join('');
}

function getDaysInMonth(year, monthIndex) {
  try {
    const test = new NepaliDate(year, monthIndex, 1);
    let maxDays = 29;
    for (let d = 29; d <= 32; d++) {
      try {
        test.setDate(d);
        if (test.getMonth() === monthIndex) {
          maxDays = d;
        }
      } catch (_) { break; }
    }
    return maxDays;
  } catch (_) { return 30; }
}

function getFirstDayOfWeek(year, monthIndex) {
  try {
    const testNp = new NepaliDate(year, monthIndex, 1);
    return testNp.toJsDate().getDay();
  } catch (_) { return 0; }
}

function getSecondaryDay(year, monthIndex, day) {
  try {
    const npDate = new NepaliDate(year, monthIndex, day);
    const jsDate = npDate.toJsDate();
    return {
      day: jsDate.getDate(),
      monthEN: GREGORIAN_MONTHS_EN[jsDate.getMonth()].substring(0, 3),
      year: jsDate.getFullYear(),
      dayOfWeek: jsDate.getDay()
    };
  } catch (_) { return null; }
}


// --- Main Logic & UI Updating ---

// Render Calendar Grid
function renderCalendar() {
  calendarDaysContainer.innerHTML = '';
  
  // Set month titles
  if (calViewType === 'BS') {
    currentMonthDisplay.innerText = `${NEPALI_MONTHS_NE[calMonth]} ${toNepaliStr(calYear)}`;
  } else {
    currentMonthDisplay.innerText = `${NEPALI_MONTHS_EN[calMonth]} ${calYear}`;
  }
  
  const weekdayGrid = document.querySelector('.weekday-grid');
  if (weekdayGrid) {
    if (calViewType === 'AD') {
      weekdayGrid.innerHTML = `<div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div class="saturday">Sat</div>`;
    } else {
      weekdayGrid.innerHTML = `<div>आइत</div><div>सोम</div><div>मङ्गल</div><div>बुध</div><div>बिही</div><div>शुक्र</div><div class="saturday">शनि</div>`;
    }
  }
  
  const firstDaySec = getSecondaryDay(calYear, calMonth, 1);
  const totalDays = getDaysInMonth(calYear, calMonth);
  const lastDaySec = getSecondaryDay(calYear, calMonth, totalDays);
  
  if (firstDaySec && lastDaySec) {
    subMonthDisplay.innerText = `${firstDaySec.monthEN} ${firstDaySec.year} - ${lastDaySec.monthEN} ${lastDaySec.year}`;
  }

  const startWeekday = getFirstDayOfWeek(calYear, calMonth);
  
  // Add empty filler cells for preceding weekdays
  for (let i = 0; i < startWeekday; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-cell calendar-cell-empty';
    calendarDaysContainer.appendChild(emptyCell);
  }

  // Fetch holidays for this month
  const monthHolidays = NE_MONTHS_EVENTS[calMonth] || {};

  // Render actual day cells
  for (let d = 1; d <= totalDays; d++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    
    // Check if Saturday
    const cellIdx = startWeekday + d - 1;
    const isSaturday = cellIdx % 7 === 6;
    if (isSaturday) {
      cell.classList.add('saturday');
    }

    // Check if today
    const npToday = new NepaliDate();
    const isToday = npToday.getYear() === calYear && npToday.getMonth() === calMonth && npToday.getDate() === d;
    if (isToday) {
      cell.classList.add('is-today');
    }

    // Check if selected cell
    const isSelected = selectedYear === calYear && selectedMonth === calMonth && selectedDay === d;
    if (isSelected) {
      cell.classList.add('is-selected');
    }

    // Check holiday status
    const event = monthHolidays[d] || null;
    const isHoliday = event?.isHoliday || isSaturday;
    if (isHoliday) {
      cell.classList.add('has-holiday');
    }

    // Secondary Gregorian Day info
    const sec = getSecondaryDay(calYear, calMonth, d);
    
    // Content structure
    if (calViewType === 'BS') {
      cell.innerHTML = `
        <span class="day-num-nepali">${toNepaliStr(d)}</span>
        <span class="day-num-gregorian">${sec ? sec.day : ''}</span>
      `;
    } else {
      cell.innerHTML = `
        <span class="day-num-nepali" style="font-size: 16px;">${sec ? sec.day : ''}</span>
        <span class="day-num-gregorian" style="font-size: 10px;">${toNepaliStr(d)}</span>
      `;
    }

    // Dot Indicators
    if (event) {
      const dot = document.createElement('span');
      dot.className = 'day-event-dot holiday-dot';
      cell.appendChild(dot);
    } else {
      // Check if user note exists for this day
      const noteKey = `${calYear}-${calMonth}-${d}`;
      if (notes[noteKey]) {
        const dot = document.createElement('span');
        dot.className = 'day-event-dot note-dot';
        dot.style.backgroundColor = getDotColorHex(notes[noteKey].color);
        cell.appendChild(dot);
      }
    }

    // Title tooltip for hover
    if (event) {
      cell.title = event.title;
    }

    // Cell Click selection
    cell.addEventListener('click', () => {
      selectedYear = calYear;
      selectedMonth = calMonth;
      selectedDay = d;
      updateSelectedDayDetails();
      renderCalendar(); // re-render to update selected border highlight
    });

    calendarDaysContainer.appendChild(cell);
  }
}

function getDotColorHex(colorName) {
  const map = {
    default: '#64748b',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#eab308',
    purple: '#a855f7'
  };
  return map[colorName] || map.default;
}

// Update Selected Date details panel
function updateSelectedDayDetails() {
  detailsDayNepali.innerText = toNepaliStr(selectedDay);
  
  // Format dates
  const weekdaysNp = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
  const weekdaysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const sec = getSecondaryDay(selectedYear, selectedMonth, selectedDay);
  const npDate = new NepaliDate(selectedYear, selectedMonth, selectedDay);
  
  // Update texts
  detailsFullNepali.innerText = `${NEPALI_MONTHS_NE[selectedMonth]} ${toNepaliStr(selectedDay)} गते ${weekdaysNp[npDate.toJsDate().getDay()]}`;
  
  if (sec) {
    detailsFullGregorian.innerText = `${sec.year} ${GREGORIAN_MONTHS_EN[npDate.toJsDate().getMonth()]} ${sec.day}, ${weekdaysEn[sec.dayOfWeek]}`;
  } else {
    detailsFullGregorian.innerText = '';
  }

  // Tithi calculation (approximate/mock or based on date calculation)
  // Standard Nepali calendar uses official astrological details, here we can mock simple tithi values or get it based on day.
  const tithis = ["एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी", "औंसी", "प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पञ्चमी", "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी"];
  const tithiIndex = (selectedDay * 3) % tithis.length;
  detailsTithi.innerText = `${NEPALI_MONTHS_NE[selectedMonth]} कृष्ण ${tithis[tithiIndex]}`;

  // Public Holiday / Events details
  const monthHolidays = NE_MONTHS_EVENTS[selectedMonth] || {};
  const event = monthHolidays[selectedDay] || null;
  const isSaturday = sec ? sec.dayOfWeek === 6 : false;

  if (event) {
    detailsEventContainer.style.display = 'flex';
    detailsEventBadge.innerText = event.isHoliday ? 'बिदा' : 'पर्व';
    detailsEventBadge.className = event.isHoliday ? 'event-badge holiday-badge' : 'event-badge';
    detailsEventTitle.innerText = event.title;
  } else if (isSaturday) {
    detailsEventContainer.style.display = 'flex';
    detailsEventBadge.innerText = 'बिदा';
    detailsEventBadge.className = 'event-badge holiday-badge';
    detailsEventTitle.innerText = 'साप्ताहिक बिदा (शनिबार)';
  } else {
    detailsEventContainer.style.display = 'none';
  }

  // Notes List
  renderDayNotesList();
}

// Render Notes for the selected day
function renderDayNotesList() {
  dayNotesList.innerHTML = '';
  const noteKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;
  const note = notes[noteKey];

  if (note) {
    const item = document.createElement('div');
    item.className = 'mini-note-item';
    item.innerHTML = `
      <span class="mini-note-dot" style="background-color: ${getDotColorHex(note.color)}"></span>
      <span class="mini-note-text" title="${note.text}">${note.text}</span>
    `;
    dayNotesList.appendChild(item);
  } else {
    const empty = document.createElement('p');
    empty.className = 'empty-notes-text';
    empty.innerText = 'कुनै टिप्पणी थपिएको छैन।';
    dayNotesList.appendChild(empty);
  }
}

// Add/Edit user Note modal
function showAddNoteModal() {
  const noteKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;
  const existingNote = notes[noteKey];
  
  noteTargetDateInput.value = noteKey;
  noteTextInput.value = existingNote ? existingNote.text : '';
  
  // Set color options highlight
  currentSelectedColor = existingNote ? existingNote.color : 'default';
  colorDotOpts.forEach(dot => {
    if (dot.getAttribute('data-color') === currentSelectedColor) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  noteModal.classList.add('active-modal');
}

function saveNote() {
  const noteKey = noteTargetDateInput.value;
  const text = noteTextInput.value.trim();

  if (text) {
    notes[noteKey] = {
      color: currentSelectedColor,
      text: text
    };
  } else {
    // If text is empty, delete the note
    delete notes[noteKey];
  }

  localStorage.setItem('desktop_calendar_notes', JSON.stringify(notes));
  noteModal.classList.remove('active-modal');
  
  updateSelectedDayDetails();
  renderCalendar();
  renderAllNotesInManager(); // Update global notes manager tab
}


// --- Tab Navigation ---
tabLinks.forEach(link => {
  link.addEventListener('click', () => {
    tabLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const targetTab = link.getAttribute('data-tab');
    tabContents.forEach(content => {
      if (content.id === targetTab) {
        content.classList.add('active-content');
      } else {
        content.classList.remove('active-content');
      }
    });

    if (targetTab === 'notes-tab') {
      renderAllNotesInManager();
    }
  });
});


// --- Tab 2: Date Converter Logic ---
let activeConvMode = 'BS_TO_AD';

function setupConverterInputs() {
  convYearSelect.innerHTML = '';
  convMonthSelect.innerHTML = '';
  convDaySelect.innerHTML = '';

  if (activeConvMode === 'BS_TO_AD') {
    // Populate BS dropdowns (Range 2000 - 2095)
    for (let y = 2000; y <= 2095; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.innerText = y;
      if (y === 2083) opt.selected = true;
      convYearSelect.appendChild(opt);
    }
    NEPALI_MONTHS_EN.forEach((name, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.innerText = `${name} (${NEPALI_MONTHS_NE[index]})`;
      if (index === 2) opt.selected = true; // Ashadh
      convMonthSelect.appendChild(opt);
    });
    updateConverterDaysDropdown();
  } else {
    // Populate AD dropdowns (Range 1944 - 2038)
    const currentYear = new Date().getFullYear();
    for (let y = 1944; y <= 2040; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.innerText = y;
      if (y === currentYear) opt.selected = true;
      convYearSelect.appendChild(opt);
    }
    GREGORIAN_MONTHS_EN.forEach((name, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.innerText = name;
      if (index === new Date().getMonth()) opt.selected = true;
      convMonthSelect.appendChild(opt);
    });
    updateConverterDaysDropdown();
  }
}

function updateConverterDaysDropdown() {
  convDaySelect.innerHTML = '';
  const year = parseInt(convYearSelect.value);
  const month = parseInt(convMonthSelect.value);
  let daysCount = 30;

  if (activeConvMode === 'BS_TO_AD') {
    daysCount = getDaysInMonth(year, month);
  } else {
    daysCount = new Date(year, month + 1, 0).getDate();
  }

  for (let d = 1; d <= daysCount; d++) {
    const opt = document.createElement('option');
    opt.value = d;
    opt.innerText = d;
    if (d === 7 && activeConvMode === 'BS_TO_AD') opt.selected = true;
    if (d === new Date().getDate() && activeConvMode === 'AD_TO_BS') opt.selected = true;
    convDaySelect.appendChild(opt);
  }
}

function runDateConversion() {
  const y = parseInt(convYearSelect.value);
  const m = parseInt(convMonthSelect.value);
  const d = parseInt(convDaySelect.value);

  try {
    if (activeConvMode === 'BS_TO_AD') {
      const npDate = new NepaliDate(y, m, d);
      const adDate = npDate.toJsDate();
      
      const weekdaysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const adFormatted = `${weekdaysEn[adDate.getDay()]}, ${GREGORIAN_MONTHS_EN[adDate.getMonth()]} ${adDate.getDate()}, ${adDate.getFullYear()}`;
      
      resultMainText.innerText = adFormatted;
      resultSubText.innerText = `ISO Standard: ${adDate.getFullYear()}-${String(adDate.getMonth() + 1).padStart(2, '0')}-${String(adDate.getDate()).padStart(2, '0')}`;
    } else {
      const adDate = new Date(y, m, d);
      const npDate = new NepaliDate(adDate);
      
      const nepDay = toNepaliStr(npDate.getDate());
      const nepYear = toNepaliStr(npDate.getYear());
      const nepMonthName = NEPALI_MONTHS_NE[npDate.getMonth()];
      const nepWeekdayName = DAYS_NE[adDate.getDay()];
      
      resultMainText.innerText = `${nepWeekdayName}, ${nepDay} ${nepMonthName} ${nepYear}`;
      resultSubText.innerText = `English: ${NEPALI_MONTHS_EN[npDate.getMonth()]} ${npDate.getDate()}, ${npDate.getYear()} BS`;
    }
    converterResult.style.display = 'block';
  } catch (err) {
    resultMainText.innerText = 'अमान्य मिति (Invalid Date Configuration)';
    resultSubText.innerText = err.message || 'Please check your date selections.';
    converterResult.style.display = 'block';
  }
}

// Convert tab controls
modeBsAd.addEventListener('click', () => {
  modeBsAd.classList.add('active');
  modeAdBs.classList.remove('active');
  activeConvMode = 'BS_TO_AD';
  setupConverterInputs();
  converterResult.style.display = 'none';
});

modeAdBs.addEventListener('click', () => {
  modeAdBs.classList.add('active');
  modeBsAd.classList.remove('active');
  activeConvMode = 'AD_TO_BS';
  setupConverterInputs();
  converterResult.style.display = 'none';
});

convYearSelect.addEventListener('change', updateConverterDaysDropdown);
convMonthSelect.addEventListener('change', updateConverterDaysDropdown);
convertBtn.addEventListener('click', runDateConversion);


// --- Tab 3: Notes Manager List ---
function renderAllNotesInManager() {
  notesManagerListContainer.innerHTML = '';
  
  const entries = Object.entries(notes);
  if (entries.length === 0) {
    notesManagerListContainer.innerHTML = '<p class="empty-state">अहिलेसम्म कुनै टिप्पणीहरू रेकर्ड गरिएका छैनन्।</p>';
    return;
  }

  // Sort notes chronologically
  entries.sort((a, b) => {
    const partsA = a[0].split('-').map(Number);
    const partsB = b[0].split('-').map(Number);
    // YYYY * 400 + MM * 32 + DD
    const valA = partsA[0] * 500 + partsA[1] * 40 + partsA[2];
    const valB = partsB[0] * 500 + partsB[1] * 40 + partsB[2];
    return valB - valA; // Descending
  });

  entries.forEach(([key, note]) => {
    const parts = key.split('-');
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const d = parseInt(parts[2]);

    const item = document.createElement('div');
    item.className = 'note-manager-item';
    item.innerHTML = `
      <div class="note-manager-left">
        <span class="note-manager-color-dot" style="background-color: ${getDotColorHex(note.color)}"></span>
        <div class="note-manager-text-group">
          <span class="note-manager-date">${NEPALI_MONTHS_NE[m]} ${toNepaliStr(d)}, ${toNepaliStr(y)}</span>
          <span class="note-manager-body" title="${note.text}">${note.text}</span>
        </div>
      </div>
      <button class="btn-delete-note" data-key="${key}">मेटाउनुहोस्</button>
    `;

    item.querySelector('.btn-delete-note').addEventListener('click', (e) => {
      const deleteKey = e.target.getAttribute('data-key');
      delete notes[deleteKey];
      localStorage.setItem('desktop_calendar_notes', JSON.stringify(notes));
      renderAllNotesInManager();
      renderCalendar();
      updateSelectedDayDetails();
    });

    notesManagerListContainer.appendChild(item);
  });
}


// --- Tab 4: Settings ---
let alwaysOnTop = false;

settingsAlwaysTop.addEventListener('change', (e) => {
  alwaysOnTop = e.target.checked;
  ipcRenderer.send('set-always-on-top', alwaysOnTop);
});

// Sync always on top control
alwaysOnTopBtn.addEventListener('click', () => {
  alwaysOnTop = !alwaysOnTop;
  settingsAlwaysTop.checked = alwaysOnTop;
  ipcRenderer.send('set-always-on-top', alwaysOnTop);
  
  // Visual indicator on pin button
  if (alwaysOnTop) {
    alwaysOnTopBtn.style.background = 'var(--accent-color)';
    alwaysOnTopBtn.style.color = 'white';
  } else {
    alwaysOnTopBtn.style.background = 'transparent';
    alwaysOnTopBtn.style.color = 'var(--text-secondary)';
  }
});

// Toggle Widget Mode from settings or titlebar
let isWidgetMode = false;
function triggerWidgetModeToggle(targetMode) {
  isWidgetMode = targetMode;
  ipcRenderer.send('toggle-widget-mode', isWidgetMode);
}

widgetToggleBtn.addEventListener('click', () => {
  triggerWidgetModeToggle(!isWidgetMode);
});

settingsToggleWidget.addEventListener('click', () => {
  triggerWidgetModeToggle(!isWidgetMode);
});

// Theme switches
themeDarkBtn.addEventListener('click', () => {
  document.body.className = 'dark';
  themeDarkBtn.classList.add('active');
  themeLightBtn.classList.remove('active');
});

themeLightBtn.addEventListener('click', () => {
  document.body.className = 'light';
  themeLightBtn.classList.add('active');
  themeDarkBtn.classList.remove('active');
});


// --- Electron Event IPC Listeners ---
ipcRenderer.on('window-mode-changed', (event, modeState) => {
  isWidgetMode = modeState;
  
  if (isWidgetMode) {
    document.body.classList.add('widget-mode');
    widgetToggleBtn.style.background = 'var(--accent-color)';
    widgetToggleBtn.style.color = 'white';
  } else {
    document.body.classList.remove('widget-mode');
    widgetToggleBtn.style.background = 'transparent';
    widgetToggleBtn.style.color = 'var(--text-secondary)';
  }
  
  renderCalendar();
});


// --- Modal event handlers ---
addNoteTrigger.addEventListener('click', showAddNoteModal);
closeModalX.addEventListener('click', () => noteModal.classList.remove('active-modal'));
cancelNoteBtn.addEventListener('click', () => noteModal.classList.remove('active-modal'));
saveNoteBtn.addEventListener('click', saveNote);

// Close modal when clicking outside content area
window.addEventListener('click', (e) => {
  if (e.target === noteModal) {
    noteModal.classList.remove('active-modal');
  }
});

// Color dots selectors
colorDotOpts.forEach(dot => {
  dot.addEventListener('click', () => {
    colorDotOpts.forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    currentSelectedColor = dot.getAttribute('data-color');
  });
});


// --- Window Titlebar Controls ---
minBtn.addEventListener('click', () => ipcRenderer.send('minimize-window'));
closeBtn.addEventListener('click', () => ipcRenderer.send('close-window'));


// --- Month Shifts Navigation ---
prevMonthBtn.addEventListener('click', () => {
  if (calMonth === 0) {
    calMonth = 11;
    calYear -= 1;
  } else {
    calMonth -= 1;
  }
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  if (calMonth === 11) {
    calMonth = 0;
    calYear += 1;
  } else {
    calMonth += 1;
  }
  renderCalendar();
});


// --- App Start Initializing ---
setupConverterInputs();
updateSelectedDayDetails();
renderCalendar();
renderAllNotesInManager();

// Setup calendar language toggle
const calLangToggleBtn = document.getElementById('cal-lang-toggle');
if (calLangToggleBtn) {
  calLangToggleBtn.addEventListener('click', () => {
    calViewType = calViewType === 'BS' ? 'AD' : 'BS';
    calLangToggleBtn.innerText = calViewType === 'BS' ? 'Show English' : 'Show Nepali';
    renderCalendar();
  });
}
