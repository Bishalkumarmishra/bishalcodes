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
let scheduledEvents = [];
let customHolidays = {};

// Initialize states
try {
  const savedNotes = localStorage.getItem('desktop_calendar_notes');
  if (savedNotes) notes = JSON.parse(savedNotes);
  
  const savedEvents = localStorage.getItem('desktop_calendar_scheduled_events');
  if (savedEvents) scheduledEvents = JSON.parse(savedEvents);
  
  const savedHolidays = localStorage.getItem('desktop_calendar_custom_holidays');
  if (savedHolidays) {
    customHolidays = JSON.parse(savedHolidays);
    mergeHolidays();
  }
} catch (e) {
  console.error("Failed to load local state", e);
}

function mergeHolidays() {
  for (const [monthKey, days] of Object.entries(customHolidays)) {
    const m = parseInt(monthKey);
    if (!NE_MONTHS_EVENTS[m]) NE_MONTHS_EVENTS[m] = {};
    for (const [dayKey, eventObj] of Object.entries(days)) {
      const d = parseInt(dayKey);
      NE_MONTHS_EVENTS[m][d] = eventObj;
    }
  }
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
      // Check if user note or scheduled event exists for this day
      const noteKey = `${calYear}-${calMonth}-${d}`;
      const hasNote = notes[noteKey];
      const matchedEvent = scheduledEvents.find(e => {
        if (e.type === 'once') return e.year === calYear && e.month === calMonth && e.day === d;
        if (e.type === 'bs-yearly') return e.month === calMonth && e.day === d;
        if (e.type === 'ad-yearly') {
          try {
            const nd = new NepaliDate(calYear, calMonth, d);
            const gd = nd.toEnglishDate();
            return e.month === gd.getMonth() && e.day === gd.getDate();
          } catch(ex) { return false; }
        }
        return false;
      });

      if (hasNote || matchedEvent) {
        const dot = document.createElement('span');
        dot.className = 'day-event-dot note-dot';
        const color = matchedEvent ? matchedEvent.color : notes[noteKey].color;
        dot.style.backgroundColor = getDotColorHex(color);
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
  
  if (typeof renderMonthlyEvents === 'function') {
    renderMonthlyEvents();
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
  
  if (typeof updateDynamicTrayIcon === 'function') {
    updateDynamicTrayIcon(selectedDay);
  }
}

// Render Notes for the selected day (including custom scheduled events)
function renderDayNotesList() {
  dayNotesList.innerHTML = '';
  const noteKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;
  const note = notes[noteKey];

  const matchedEvents = scheduledEvents.filter(e => {
    if (e.type === 'once') return e.year === selectedYear && e.month === selectedMonth && e.day === selectedDay;
    if (e.type === 'bs-yearly') return e.month === selectedMonth && e.day === selectedDay;
    if (e.type === 'ad-yearly') {
      try {
        const nd = new NepaliDate(selectedYear, selectedMonth, selectedDay);
        const gd = nd.toEnglishDate();
        return e.month === gd.getMonth() && e.day === gd.getDate();
      } catch(ex) { return false; }
    }
    return false;
  });

  if (note || matchedEvents.length > 0) {
    if (note) {
      const item = document.createElement('div');
      item.className = 'note-item';
      item.innerHTML = `
        <div class="note-color-badge" style="background-color: ${getDotColorHex(note.color)}"></div>
        <div class="note-content-text">${note.text}</div>
      `;
      dayNotesList.appendChild(item);
    }
    
    matchedEvents.forEach(evt => {
      if (note && note.text === evt.title) return; // avoid duplicates
      const item = document.createElement('div');
      item.className = 'note-item';
      item.innerHTML = `
        <div class="note-color-badge" style="background-color: ${getDotColorHex(evt.color)}"></div>
        <div class="note-content-text">
          <span style="font-size: 10px; font-weight: bold; color: var(--accent-color); padding: 1px 4px; border: 1px solid var(--accent-color); border-radius: 4px; margin-right: 4px;">${evt.type.toUpperCase()}</span>
          ${evt.title}
        </div>
      `;
      dayNotesList.appendChild(item);
    });
  } else {
    const empty = document.createElement('p');
    empty.className = 'empty-notes-text';
    empty.innerText = 'कुनै टिप्पणी थपिएको छैन।';
    dayNotesList.appendChild(empty);
  }
}

const noteRecurrenceSelect = document.getElementById('note-recurrence');
const noteSyncGoogleCheckbox = document.getElementById('note-sync-google');
const noteSyncOutlookCheckbox = document.getElementById('note-sync-outlook');

function showAddNoteModal() {
  const noteKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;
  const existingNote = notes[noteKey];
  
  const matchedEvent = scheduledEvents.find(e => {
    if (e.type === 'once') return e.year === selectedYear && e.month === selectedMonth && e.day === selectedDay;
    if (e.type === 'bs-yearly') return e.month === selectedMonth && e.day === selectedDay;
    if (e.type === 'ad-yearly') {
      try {
        const nd = new NepaliDate(selectedYear, selectedMonth, selectedDay);
        const gd = nd.toEnglishDate();
        return e.month === gd.getMonth() && e.day === gd.getDate();
      } catch(ex) { return false; }
    }
    return false;
  });
  
  noteTargetDateInput.value = noteKey;
  noteTextInput.value = matchedEvent ? matchedEvent.title : (existingNote ? existingNote.text : '');
  
  if (noteRecurrenceSelect) {
    noteRecurrenceSelect.value = matchedEvent ? matchedEvent.type : 'once';
  }
  if (noteSyncGoogleCheckbox) {
    noteSyncGoogleCheckbox.checked = matchedEvent ? !!matchedEvent.googleEventId : false;
  }
  if (noteSyncOutlookCheckbox) {
    noteSyncOutlookCheckbox.checked = matchedEvent ? !!matchedEvent.outlookEventId : false;
  }
  
  currentSelectedColor = matchedEvent ? matchedEvent.color : (existingNote ? existingNote.color : 'default');
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
  const recurrence = noteRecurrenceSelect ? noteRecurrenceSelect.value : 'once';
  const syncGoogle = noteSyncGoogleCheckbox ? noteSyncGoogleCheckbox.checked : false;
  const syncOutlook = noteSyncOutlookCheckbox ? noteSyncOutlookCheckbox.checked : false;

  const [yearVal, monthVal, dayVal] = noteKey.split('-').map(Number);

  // Remove existing matches to overwrite
  scheduledEvents = scheduledEvents.filter(e => {
    if (e.type === 'once') return !(e.year === yearVal && e.month === monthVal && e.day === dayVal);
    if (e.type === 'bs-yearly') return !(e.month === monthVal && e.day === dayVal);
    if (e.type === 'ad-yearly') {
      try {
        const nd = new NepaliDate(yearVal, monthVal, dayVal);
        const gd = nd.toEnglishDate();
        return !(e.month === gd.getMonth() && e.day === gd.getDate());
      } catch(ex) { return true; }
    }
    return true;
  });

  if (text) {
    notes[noteKey] = {
      color: currentSelectedColor,
      text: text
    };

    const newEvent = {
      id: 'evt_' + Date.now(),
      title: text,
      color: currentSelectedColor,
      type: recurrence,
      year: yearVal,
      month: monthVal,
      day: dayVal,
      googleEventId: null,
      outlookEventId: null
    };

    if (recurrence === 'ad-yearly') {
      try {
        const nd = new NepaliDate(yearVal, monthVal, dayVal);
        const gd = nd.toEnglishDate();
        newEvent.month = gd.getMonth();
        newEvent.day = gd.getDate();
      } catch(e) {}
    }

    scheduledEvents.push(newEvent);
    
    if (syncGoogle && localStorage.getItem('google_refresh_token')) {
      setTimeout(() => { syncEventsToGoogle(); }, 500);
    }
    if (syncOutlook && localStorage.getItem('outlook_refresh_token')) {
      setTimeout(() => { syncEventsToOutlook(); }, 500);
    }
  } else {
    delete notes[noteKey];
  }

  updateLocalNotes(notes);
  updateLocalEvents(scheduledEvents);
  noteModal.classList.remove('active-modal');
  
  updateSelectedDayDetails();
  renderCalendar();
  renderAllNotesInManager();
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
    } else if (targetTab === 'notifications-tab') {
      renderAnnouncementsList();
    } else if (targetTab === 'tools-tab') {
      closeToolIframe(); // Reset tool view on open
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
      updateLocalNotes(notes);
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

ipcRenderer.on('always-on-top-changed', (event, alwaysTopState) => {
  alwaysOnTop = alwaysTopState;
  if (typeof settingsAlwaysTop !== 'undefined' && settingsAlwaysTop) {
    settingsAlwaysTop.checked = alwaysOnTop;
  }
  
  // Visual indicator on pin button
  if (typeof alwaysOnTopBtn !== 'undefined' && alwaysOnTopBtn) {
    if (alwaysOnTop) {
      alwaysOnTopBtn.style.background = 'var(--accent-color)';
      alwaysOnTopBtn.style.color = 'white';
    } else {
      alwaysOnTopBtn.style.background = 'transparent';
      alwaysOnTopBtn.style.color = 'var(--text-secondary)';
    }
  }
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
const maxBtn = document.getElementById('max-btn');
if (maxBtn) {
  maxBtn.addEventListener('click', () => ipcRenderer.send('maximize-window'));
}


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


// --- Advanced Events Sync & Daily Notification Engine ---

// Canvas-based dynamic tray icon generator
function updateDynamicTrayIcon(dayNum) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Draw rounded background (brown, matching theme)
    ctx.fillStyle = '#2a170e';
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(32 - radius, 0);
    ctx.quadraticCurveTo(32, 0, 32, radius);
    ctx.lineTo(32, 32 - radius);
    ctx.quadraticCurveTo(32, 32, 32 - radius, 32);
    ctx.lineTo(radius, 32);
    ctx.quadraticCurveTo(0, 32, 0, 32 - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
    
    // Day text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Nirmala UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
    const nepaliDayStr = String(dayNum).split('').map(digit => nepaliDigits[parseInt(digit)] || digit).join('');
    
    ctx.fillText(nepaliDayStr, 16, 16);
    const dataUrl = canvas.toDataURL('image/png');
    ipcRenderer.send('update-tray-icon', dataUrl);
  } catch (e) {
    console.error("Failed to generate dynamic tray icon", e);
  }
}

// Daily Notification & Reminders Engine
function checkDailyReminders() {
  const npToday = new NepaliDate();
  const year = npToday.getYear();
  const month = npToday.getMonth();
  const day = npToday.getDate();
  const lastBriefingDate = localStorage.getItem('last_briefing_date');
  const currentDateKey = `${year}-${month}-${day}`;

  if (lastBriefingDate !== currentDateKey) {
    const weekdaysNp = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
    const npDate = new NepaliDate(year, month, day);
    const dateStr = `${NEPALI_MONTHS_NE[month]} ${toNepaliStr(day)} गते ${weekdaysNp[npDate.toJsDate().getDay()]}`;
    
    const monthHolidays = NE_MONTHS_EVENTS[month] || {};
    const event = monthHolidays[day] || null;
    let eventDetail = '';
    if (event) {
      eventDetail = ` - ${event.title}${event.isHoliday ? ' (सार्वजनिक बिदा)' : ''}`;
    }
    
    ipcRenderer.send('show-notification', {
      title: 'नेपाली क्यालेन्डर - आजको मिति',
      body: `${dateStr}${eventDetail}`
    });
    
    localStorage.setItem('last_briefing_date', currentDateKey);
  }
  
  scheduledEvents.forEach(evt => {
    let matchesToday = false;
    if (evt.type === 'once') matchesToday = evt.year === year && evt.month === month && evt.day === day;
    else if (evt.type === 'bs-yearly') matchesToday = evt.month === month && evt.day === day;
    else if (evt.type === 'ad-yearly') {
      try {
        const gd = npToday.toEnglishDate();
        matchesToday = evt.month === gd.getMonth() && evt.day === gd.getDate();
      } catch(e) {}
    }
    
    if (matchesToday) {
      const lastRemindedKey = `reminded_${evt.id}_${currentDateKey}`;
      if (!localStorage.getItem(lastRemindedKey)) {
        ipcRenderer.send('show-notification', {
          title: 'रिमाइन्डर (Reminder)',
          body: evt.title
        });
        localStorage.setItem(lastRemindedKey, 'true');
      }
    }
  });
}

// Google Account Token Refresh helper
async function refreshGoogleAccessToken() {
  const cid = localStorage.getItem('google_client_id');
  const secret = localStorage.getItem('google_client_secret');
  const refreshToken = localStorage.getItem('google_refresh_token');
  if (!refreshToken) return null;
  
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cid,
        client_secret: secret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('google_access_token', data.access_token);
      return data.access_token;
    }
  } catch (err) {
    console.error("Failed to refresh Google token", err);
  }
  return null;
}

// Sync events to Google Calendar
async function syncEventsToGoogle() {
  let token = localStorage.getItem('google_access_token');
  if (!token) return;
  
  const refreshed = await refreshGoogleAccessToken();
  if (refreshed) token = refreshed;
  
  console.log("Starting Google Calendar sync...");
  let syncCount = 0;
  
  for (let event of scheduledEvents) {
    let startDateStr = '';
    let endDateStr = '';
    
    if (event.type === 'once') {
      try {
        const nd = new NepaliDate(event.year, event.month, event.day);
        const gd = nd.toEnglishDate();
        startDateStr = gd.toISOString().split('T')[0];
        const nextDay = new Date(gd);
        nextDay.setDate(nextDay.getDate() + 1);
        endDateStr = nextDay.toISOString().split('T')[0];
      } catch(e) { continue; }
    } else if (event.type === 'bs-yearly') {
      try {
        const nd = new NepaliDate(calYear, event.month, event.day);
        const gd = nd.toEnglishDate();
        startDateStr = gd.toISOString().split('T')[0];
        const nextDay = new Date(gd);
        nextDay.setDate(nextDay.getDate() + 1);
        endDateStr = nextDay.toISOString().split('T')[0];
      } catch(e) { continue; }
    } else if (event.type === 'ad-yearly') {
      const year = new Date().getFullYear();
      const monthStr = String(event.month + 1).padStart(2, '0');
      const dayStr = String(event.day).padStart(2, '0');
      startDateStr = `${year}-${monthStr}-${dayStr}`;
      const nextDay = new Date(startDateStr);
      nextDay.setDate(nextDay.getDate() + 1);
      endDateStr = nextDay.toISOString().split('T')[0];
    }
    
    if (!startDateStr || !endDateStr) continue;
    
    const body = {
      summary: event.title,
      description: `Synced from Nepali Calendar Desktop app (Recurrence: ${event.type})`,
      start: { date: startDateStr },
      end: { date: endDateStr }
    };
    
    try {
      let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
      let method = 'POST';
      
      if (event.googleEventId) {
        url += `/${event.googleEventId}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (response.status === 404 && event.googleEventId) {
        event.googleEventId = null;
        await syncEventsToGoogle();
        return;
      }
      
      const result = await response.json();
      if (result.id) {
        event.googleEventId = result.id;
        syncCount++;
      }
    } catch (err) {
      console.error("Failed to sync event to Google:", event.title, err);
    }
  }
  
  updateLocalEvents(scheduledEvents);
  alert(`Google Calendar sync completed! Synced ${syncCount} events.`);
}

// Microsoft Outlook Token Refresh helper
async function refreshOutlookAccessToken() {
  const cid = localStorage.getItem('outlook_client_id');
  const secret = localStorage.getItem('outlook_client_secret');
  const refreshToken = localStorage.getItem('outlook_refresh_token');
  if (!refreshToken) return null;
  
  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cid,
        client_secret: secret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('outlook_access_token', data.access_token);
      return data.access_token;
    }
  } catch (err) {
    console.error("Failed to refresh Microsoft token", err);
  }
  return null;
}

// Sync events to Microsoft Outlook Calendar
async function syncEventsToOutlook() {
  let token = localStorage.getItem('outlook_access_token');
  if (!token) return;
  
  const refreshed = await refreshOutlookAccessToken();
  if (refreshed) token = refreshed;
  
  console.log("Starting Microsoft Outlook sync...");
  let syncCount = 0;
  
  for (let event of scheduledEvents) {
    let startDateStr = '';
    let endDateStr = '';
    
    if (event.type === 'once') {
      try {
        const nd = new NepaliDate(event.year, event.month, event.day);
        const gd = nd.toEnglishDate();
        startDateStr = gd.toISOString().split('T')[0] + 'T00:00:00';
        const nextDay = new Date(gd);
        nextDay.setDate(nextDay.getDate() + 1);
        endDateStr = nextDay.toISOString().split('T')[0] + 'T00:00:00';
      } catch(e) { continue; }
    } else if (event.type === 'bs-yearly') {
      try {
        const nd = new NepaliDate(calYear, event.month, event.day);
        const gd = nd.toEnglishDate();
        startDateStr = gd.toISOString().split('T')[0] + 'T00:00:00';
        const nextDay = new Date(gd);
        nextDay.setDate(nextDay.getDate() + 1);
        endDateStr = nextDay.toISOString().split('T')[0] + 'T00:00:00';
      } catch(e) { continue; }
    } else if (event.type === 'ad-yearly') {
      const year = new Date().getFullYear();
      const monthStr = String(event.month + 1).padStart(2, '0');
      const dayStr = String(event.day).padStart(2, '0');
      startDateStr = `${year}-${monthStr}-${dayStr}T00:00:00`;
      const nextDay = new Date(startDateStr);
      nextDay.setDate(nextDay.getDate() + 1);
      endDateStr = nextDay.toISOString().split('T')[0] + 'T00:00:00';
    }
    
    if (!startDateStr || !endDateStr) continue;
    
    const body = {
      subject: event.title,
      body: {
        contentType: 'HTML',
        content: `Synced from Nepali Calendar Desktop app (Recurrence: ${event.type})`
      },
      start: { dateTime: startDateStr, timeZone: 'Nepal Standard Time' },
      end: { dateTime: endDateStr, timeZone: 'Nepal Standard Time' }
    };
    
    try {
      let url = 'https://graph.microsoft.com/v1.0/me/events';
      let method = 'POST';
      
      if (event.outlookEventId) {
        url += `/${event.outlookEventId}`;
        method = 'PATCH';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (response.status === 404 && event.outlookEventId) {
        event.outlookEventId = null;
        await syncEventsToOutlook();
        return;
      }
      
      const result = await response.json();
      if (result.id) {
        event.outlookEventId = result.id;
        syncCount++;
      }
    } catch (err) {
      console.error("Failed to sync event to Outlook:", event.title, err);
    }
  }
  
  updateLocalEvents(scheduledEvents);
  alert(`Outlook Calendar sync completed! Synced ${syncCount} events.`);
}

// Firestore Holiday Sync Client
async function syncHolidaysFromFirestore() {
  const syncBtn = document.getElementById('sync-firestore-btn');
  if (syncBtn) syncBtn.innerText = 'Syncing...';
  
  try {
    const response = await fetch('https://firestore.googleapis.com/v1/projects/bishal-mishra-3c559/databases/(default)/documents/holidays?pageSize=100');
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    if (data.documents) {
      const newCustomHolidays = {};
      data.documents.forEach(doc => {
        const fields = doc.fields;
        if (fields && fields.month && fields.day && fields.title) {
          const m = parseInt(fields.month.integerValue || fields.month.doubleValue || 0);
          const d = parseInt(fields.day.integerValue || fields.day.doubleValue || 1);
          const title = fields.title.stringValue || '';
          const isHoliday = fields.isHoliday ? !!fields.isHoliday.booleanValue : false;
          
          if (!newCustomHolidays[m]) newCustomHolidays[m] = {};
          newCustomHolidays[m][d] = { title, isHoliday };
        }
      });
      customHolidays = newCustomHolidays;
      localStorage.setItem('desktop_calendar_custom_holidays', JSON.stringify(customHolidays));
      mergeHolidays();
      renderCalendar();
      alert("Holidays successfully updated from database!");
    } else {
      alert("No holidays published in the database yet.");
    }
  } catch (e) {
    console.error("Failed to sync holidays from Firestore:", e);
    alert("Connection failed: " + e.message);
  } finally {
    if (syncBtn) syncBtn.innerText = '🔄 Update Holidays';
  }
}

// Firestore Custom Notifications Poller Client
async function checkFirestoreNotifications() {
  try {
    const response = await fetch('https://firestore.googleapis.com/v1/projects/bishal-mishra-3c559/databases/(default)/documents/notifications?orderBy=timestamp%20desc&pageSize=10');
    if (!response.ok) return;
    const data = await response.json();
    if (data.documents) {
      let shownNotifs = [];
      let savedLogs = [];
      try {
        const saved = localStorage.getItem('desktop_calendar_shown_notifications');
        if (saved) shownNotifs = JSON.parse(saved);
      } catch(e) {}
      
      try {
        const savedL = localStorage.getItem('desktop_calendar_notifications_log');
        if (savedL) savedLogs = JSON.parse(savedL);
      } catch(e) {}
      
      let updatedShown = [...shownNotifs];
      let updatedLogs = [...savedLogs];
      let newNotifFound = false;

      data.documents.forEach(doc => {
        const docId = doc.name.split('/').pop();
        if (!shownNotifs.includes(docId)) {
          const fields = doc.fields;
          const title = fields?.title?.stringValue || '';
          const body = fields?.body?.stringValue || fields?.message?.stringValue || '';
          if (title && body) {
            const timestamp = fields?.timestamp && fields?.timestamp?.integerValue ? parseInt(fields.timestamp.integerValue) : Date.now();
            
            // Show push notification!
            ipcRenderer.send('show-notification', { title, body });
            
            updatedShown.push(docId);
            
            if (!updatedLogs.some(n => n.id === docId)) {
              updatedLogs.unshift({ id: docId, title, body, timestamp });
            }
            newNotifFound = true;
          }
        }
      });

      if (newNotifFound) {
        localStorage.setItem('desktop_calendar_shown_notifications', JSON.stringify(updatedShown));
        localStorage.setItem('desktop_calendar_notifications_log', JSON.stringify(updatedLogs));
        renderAnnouncementsList();
      }
    }
  } catch (e) {
    console.error("Failed to check Firestore notifications:", e);
  }
}

// Credentials input fields DOM bindings
const googleClientIdInput = document.getElementById('google-client-id');
const googleClientSecretInput = document.getElementById('google-client-secret');
const connectGoogleBtn = document.getElementById('connect-google-btn');
const syncGoogleNowBtn = document.getElementById('sync-google-now-btn');
const googleStatusText = document.getElementById('google-status-text');

const outlookClientIdInput = document.getElementById('outlook-client-id');
const outlookClientSecretInput = document.getElementById('outlook-client-secret');
const connectOutlookBtn = document.getElementById('connect-outlook-btn');
const syncOutlookNowBtn = document.getElementById('sync-outlook-now-btn');
const outlookStatusText = document.getElementById('outlook-status-text');

// Load saved client credentials from persistent config (survives reinstalls)
async function loadSavedCredentials() {
  const cfg = await ipcRenderer.invoke('get-config') || {};
  if (googleClientIdInput)      googleClientIdInput.value      = cfg.google_client_id      || '';
  if (googleClientSecretInput)  googleClientSecretInput.value  = cfg.google_client_secret  || '';
  if (outlookClientIdInput)     outlookClientIdInput.value     = cfg.outlook_client_id     || '';
  if (outlookClientSecretInput) outlookClientSecretInput.value = cfg.outlook_client_secret || '';
  updateConnectionUI();
}
loadSavedCredentials();

async function updateConnectionUI() {
  const cfg = await ipcRenderer.invoke('get-config') || {};
  const googleToken = cfg.google_refresh_token || null;
  if (googleStatusText && syncGoogleNowBtn) {
    if (googleToken) {
      googleStatusText.innerText = 'Connected';
      googleStatusText.style.color = '#10b981';
      syncGoogleNowBtn.disabled = false;
    } else {
      googleStatusText.innerText = 'Disconnected';
      googleStatusText.style.color = 'var(--text-secondary)';
      syncGoogleNowBtn.disabled = true;
    }
  }

  const outlookToken = cfg.outlook_refresh_token || null;
  if (outlookStatusText && syncOutlookNowBtn) {
    if (outlookToken) {
      outlookStatusText.innerText = 'Connected';
      outlookStatusText.style.color = '#10b981';
      syncOutlookNowBtn.disabled = false;
    } else {
      outlookStatusText.innerText = 'Disconnected';
      outlookStatusText.style.color = 'var(--text-secondary)';
      syncOutlookNowBtn.disabled = true;
    }
  }
}

// Button Events setup
if (connectGoogleBtn) {
  connectGoogleBtn.addEventListener('click', async () => {
    const cid = googleClientIdInput.value.trim();
    const secret = googleClientSecretInput.value.trim();
    if (!cid || !secret) {
      alert("Please enter both Google Client ID and Client Secret!");
      return;
    }
    // Save to persistent config instead of localStorage
    await ipcRenderer.invoke('set-config', 'google_client_id', cid);
    await ipcRenderer.invoke('set-config', 'google_client_secret', secret);
    ipcRenderer.send('start-google-auth');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${cid}&redirect_uri=http://localhost:48281/google-callback&response_type=code&scope=https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent`;
    require('electron').shell.openExternal(authUrl);
  });
}

if (syncGoogleNowBtn) {
  syncGoogleNowBtn.addEventListener('click', syncEventsToGoogle);
}

ipcRenderer.on('google-auth-success', async (event, code) => {
  const cid = await ipcRenderer.invoke('get-config', 'google_client_id');
  const secret = await ipcRenderer.invoke('get-config', 'google_client_secret');
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cid,
        client_secret: secret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:48281/google-callback'
      })
    });
    const data = await response.json();
    if (data.access_token) {
      // Save tokens to persistent config
      await ipcRenderer.invoke('set-config', 'google_access_token', data.access_token);
      if (data.refresh_token) await ipcRenderer.invoke('set-config', 'google_refresh_token', data.refresh_token);
      alert("Successfully connected to Google Calendar!");
      updateConnectionUI();
    } else {
      alert("Failed to get token: " + JSON.stringify(data));
    }
  } catch (err) {
    console.error("Token exchange failed", err);
    alert("Token exchange failed: " + err.message);
  }
});

if (connectOutlookBtn) {
  connectOutlookBtn.addEventListener('click', async () => {
    const cid = outlookClientIdInput.value.trim();
    const secret = outlookClientSecretInput.value.trim();
    if (!cid || !secret) {
      alert("Please enter both Microsoft Outlook Client ID and Client Secret!");
      return;
    }
    // Save to persistent config instead of localStorage
    await ipcRenderer.invoke('set-config', 'outlook_client_id', cid);
    await ipcRenderer.invoke('set-config', 'outlook_client_secret', secret);
    ipcRenderer.send('start-outlook-auth');
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${cid}&response_type=code&redirect_uri=http://localhost:48281/outlook-callback&response_mode=query&scope=offline_access%20Calendars.ReadWrite`;
    require('electron').shell.openExternal(authUrl);
  });
}

if (syncOutlookNowBtn) {
  syncOutlookNowBtn.addEventListener('click', syncEventsToOutlook);
}

ipcRenderer.on('outlook-auth-success', async (event, code) => {
  const cid = await ipcRenderer.invoke('get-config', 'outlook_client_id');
  const secret = await ipcRenderer.invoke('get-config', 'outlook_client_secret');
  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cid,
        client_secret: secret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:48281/outlook-callback'
      })
    });
    const data = await response.json();
    if (data.access_token) {
      // Save tokens to persistent config
      await ipcRenderer.invoke('set-config', 'outlook_access_token', data.access_token);
      if (data.refresh_token) await ipcRenderer.invoke('set-config', 'outlook_refresh_token', data.refresh_token);
      alert("Successfully connected to Microsoft Outlook!");
      updateConnectionUI();
    } else {
      alert("Failed to get Microsoft token: " + JSON.stringify(data));
    }
  } catch (err) {
    console.error("Microsoft token exchange failed", err);
    alert("Microsoft token exchange failed: " + err.message);
  }
});

const syncFirestoreBtn = document.getElementById('sync-firestore-btn');
if (syncFirestoreBtn) {
  syncFirestoreBtn.addEventListener('click', syncHolidaysFromFirestore);
}



// Announcements Log List Renderer
function renderAnnouncementsList() {
  const listContainer = document.getElementById('desktop-notifications-list');
  if (!listContainer) return;
  
  let logs = [];
  try {
    const saved = localStorage.getItem('desktop_calendar_notifications_log');
    if (saved) logs = JSON.parse(saved);
  } catch(e) {}
  
  if (logs.length === 0) {
    listContainer.innerHTML = '<p class="empty-state">कुनै सूचनाहरू उपलब्ध छैनन्। (No announcements available)</p>';
    return;
  }
  
  listContainer.innerHTML = logs.map(notif => {
    const dateStr = new Date(notif.timestamp).toLocaleString();
    return `
      <div class="card" style="padding: 14px; border-left: 4px solid var(--accent-color); background: var(--bg-secondary); border-radius: 8px; margin-bottom: 2px; border-top: 1px solid var(--border-color); border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px;">
          <strong style="color: var(--text-primary); font-size: 13px;">${notif.title}</strong>
          <span style="font-size: 9px; color: var(--text-secondary); white-space: nowrap;">${dateStr}</span>
        </div>
        <p style="color: var(--text-secondary); font-size: 11px; margin-top: 6px; line-height: 1.4; font-weight: normal;">${notif.body}</p>
      </div>
    `;
  }).join('');
}

// Clear all announcements handler
const clearNotificationsBtn = document.getElementById('clear-notifications-btn');
if (clearNotificationsBtn) {
  clearNotificationsBtn.addEventListener('click', () => {
    localStorage.setItem('desktop_calendar_notifications_log', JSON.stringify([]));
    renderAnnouncementsList();
  });
}

// More Tools embedding iframe logic
function loadToolIframe(tool) {
  const selectionGrid = document.getElementById('tools-selection-grid');
  const iframeContainer = document.getElementById('tools-iframe-container');
  const iframe = document.getElementById('tools-iframe');
  const preloader = document.getElementById('tools-preloader');
  
  if (selectionGrid && iframeContainer && iframe) {
    selectionGrid.style.display = 'none';
    iframeContainer.style.display = 'block';
    if (preloader) preloader.style.display = 'flex';
    
    iframe.src = `https://www.bishalcodes.com/tools/${tool}?embed=true`;
    
    iframe.onload = () => {
      if (preloader) preloader.style.display = 'none';
    };
  }
}

function closeToolIframe() {
  const selectionGrid = document.getElementById('tools-selection-grid');
  const iframeContainer = document.getElementById('tools-iframe-container');
  const iframe = document.getElementById('tools-iframe');
  
  if (selectionGrid && iframeContainer && iframe) {
    selectionGrid.style.display = 'grid';
    iframeContainer.style.display = 'none';
    iframe.src = 'about:blank';
  }
}

// Auto Update Checker client side logic
async function checkAppUpdates() {
  try {
    const response = await fetch('https://www.bishalcodes.com/downloads/version.json');
    if (!response.ok) return;
    const data = await response.json();
    
    const currentVersion = '1.6.0'; // Local desktop version (new compiled setup)
    const latestVersion = data.version;
    
    if (isNewerVersion(latestVersion, currentVersion)) {
      const banner = document.getElementById('update-banner');
      const label = document.getElementById('update-version-label');
      if (banner && label) {
        label.innerText = `v${latestVersion}`;
        banner.style.display = 'flex';
        
        const startUpdateBtn = document.getElementById('start-update-btn');
        if (startUpdateBtn) {
          // Replace button clone to clean listeners
          const newBtn = startUpdateBtn.cloneNode(true);
          startUpdateBtn.parentNode.replaceChild(newBtn, startUpdateBtn);
          newBtn.addEventListener('click', () => {
            newBtn.innerText = 'Downloading update...';
            newBtn.disabled = true;
            ipcRenderer.send('download-and-install-update', data.url);
          });
        }
        
        document.getElementById('dismiss-update-btn')?.addEventListener('click', () => {
          banner.style.display = 'none';
        });
      }
    }
  } catch (e) {
    console.error("Failed to check app updates:", e);
  }
}

function isNewerVersion(latest, current) {
  const l = latest.split('.').map(Number);
  const c = current.split('.').map(Number);
  for(let i=0; i<3; i++) {
    if (l[i] > c[i]) return true;
    if (l[i] < c[i]) return false;
  }
  return false;
}

document.getElementById('tool-btn-compressor')?.addEventListener('click', () => loadToolIframe('image-compressor'));
document.getElementById('tool-btn-merge')?.addEventListener('click', () => loadToolIframe('merge-pdf'));
document.getElementById('tool-btn-jpg2pdf')?.addEventListener('click', () => loadToolIframe('jpg-to-pdf'));
document.getElementById('tool-btn-qr')?.addEventListener('click', () => loadToolIframe('qr-studio'));
document.getElementById('tool-btn-converter')?.addEventListener('click', () => loadToolIframe('date-converter'));
document.getElementById('tool-btn-translator')?.addEventListener('click', () => loadToolIframe('translator'));
document.getElementById('close-tools-iframe-btn')?.addEventListener('click', closeToolIframe);


// --- Firebase Authentication & Cloud Sync Integration ---
const firebaseConfig = {
  apiKey: "AIzaSyBVmSAxOR4nZxvzMZZS1uH4II_sdoJSQ1g",
  authDomain: "bishal-mishra-3c559.firebaseapp.com",
  projectId: "bishal-mishra-3c559",
  storageBucket: "bishal-mishra-3c559.firebasestorage.app",
  messagingSenderId: "459193835216",
  appId: "1:459193835216:web:32de44a9f2d52ed80b88d5",
  measurementId: "G-V89CSR1TXR"
};

let db = null;
let auth = null;
let currentUser = null;
let authMode = 'signin';

if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
}

// 1. Auth state change listener
if (auth) {
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    updateAuthUI();
    if (user) {
      // Sync notes from Cloud upon sign in
      await syncNotesFromCloud(user.uid);
    }
  });
}

// 2. Update Auth UI panels
function updateAuthUI() {
  const loggedOutView = document.getElementById('auth-logged-out-view');
  const loggedInView = document.getElementById('auth-logged-in-view');
  const userEmailLabel = document.getElementById('logged-in-user-email');
  
  if (currentUser) {
    if (loggedOutView) loggedOutView.style.display = 'none';
    if (loggedInView) loggedInView.style.display = 'block';
    if (userEmailLabel) {
      const email = currentUser.email || '';
      if (email.endsWith('@bishalcodes.app')) {
        userEmailLabel.innerText = email.split('@')[0];
      } else {
        userEmailLabel.innerText = email;
      }
    }
  } else {
    if (loggedOutView) loggedOutView.style.display = 'block';
    if (loggedInView) loggedInView.style.display = 'none';
  }
}

// 3. Tab toggles
const tabSignInBtn = document.getElementById('auth-tab-signin-btn');
const tabSignUpBtn = document.getElementById('auth-tab-signup-btn');
const authSubmitBtn = document.getElementById('auth-submit-btn');

if (tabSignInBtn && tabSignUpBtn) {
  tabSignInBtn.style.cursor = 'pointer';
  tabSignUpBtn.style.cursor = 'pointer';

  tabSignInBtn.addEventListener('click', () => {
    authMode = 'signin';
    tabSignInBtn.style.color = 'var(--accent-color)';
    tabSignInBtn.style.borderBottom = '2px solid var(--accent-color)';
    tabSignUpBtn.style.color = 'var(--text-secondary)';
    tabSignUpBtn.style.borderBottom = 'none';
    if (authSubmitBtn) authSubmitBtn.innerText = 'Sign In';
  });
  
  tabSignUpBtn.addEventListener('click', () => {
    authMode = 'signup';
    tabSignUpBtn.style.color = 'var(--accent-color)';
    tabSignUpBtn.style.borderBottom = '2px solid var(--accent-color)';
    tabSignInBtn.style.color = 'var(--text-secondary)';
    tabSignInBtn.style.borderBottom = 'none';
    if (authSubmitBtn) authSubmitBtn.innerText = 'Sign Up';
  });
}

// 4. Show/Hide Password Toggle
const togglePasswordBtn = document.getElementById('toggle-auth-password-btn');
const passwordInput = document.getElementById('auth-password');
const eyeShow = document.getElementById('eye-icon-show');
const eyeHide = document.getElementById('eye-icon-hide');

if (togglePasswordBtn && passwordInput && eyeShow && eyeHide) {
  togglePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeShow.style.display = 'block';
      eyeHide.style.display = 'none';
    } else {
      passwordInput.type = 'password';
      eyeShow.style.display = 'none';
      eyeHide.style.display = 'block';
    }
  });
}

// 5. Sign In / Sign Up submission
if (authSubmitBtn) {
  authSubmitBtn.addEventListener('click', async () => {
    const emailUserVal = document.getElementById('auth-email-username').value.trim();
    const passVal = document.getElementById('auth-password').value;
    
    if (!emailUserVal || !passVal) {
      alert("Please fill in all credentials.");
      return;
    }
    
    let email = emailUserVal;
    if (!email.includes('@')) {
      email = emailUserVal.toLowerCase() + '@bishalcodes.app';
    }
    
    authSubmitBtn.innerText = authMode === 'signin' ? 'Signing In...' : 'Registering...';
    authSubmitBtn.disabled = true;
    
    try {
      if (authMode === 'signin') {
        await auth.signInWithEmailAndPassword(email, passVal);
        alert("Successfully signed in!");
      } else {
        const cred = await auth.createUserWithEmailAndPassword(email, passVal);
        alert("Successfully registered your account!");
        
        // Trigger welcome email post
        try {
          await fetch('https://www.bishalcodes.com/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'welcome-app',
              data: { email: email.endsWith('@bishalcodes.app') ? emailUserVal : email }
            })
          });
        } catch (emailErr) {
          console.error("Welcome email delivery failed:", emailErr);
        }
        
        // Initial upload of existing local notes to cloud
        await uploadLocalNotesToCloud(cred.user.uid);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      authSubmitBtn.innerText = authMode === 'signin' ? 'Sign In' : 'Sign Up';
      authSubmitBtn.disabled = false;
    }
  });
}

// 6. Forgot Password Reset
const forgotPasswordBtn = document.getElementById('auth-forgot-password-btn');
if (forgotPasswordBtn) {
  forgotPasswordBtn.addEventListener('click', async () => {
    const emailUserVal = document.getElementById('auth-email-username').value.trim();
    if (!emailUserVal) {
      alert("Please enter your email address in the field first.");
      return;
    }
    let email = emailUserVal;
    if (!email.includes('@')) {
      email = emailUserVal.toLowerCase() + '@bishalcodes.app';
    }
    
    try {
      await auth.sendPasswordResetEmail(email);
      alert("Password reset instructions sent to your email!");
    } catch (err) {
      alert(err.message);
    }
  });
}

// 7. Sign Out
const signOutBtn = document.getElementById('auth-signout-btn');
if (signOutBtn) {
  signOutBtn.addEventListener('click', async () => {
    if (confirm("Are you sure you want to sign out? Your notes will remain stored locally.")) {
      await auth.signOut();
      currentUser = null;
      updateAuthUI();
    }
  });
}

// 8. Bidirectional Cloud Sync functions
async function uploadLocalNotesToCloud(uid) {
  if (!db) return;
  const localNotes = localStorage.getItem('desktop_calendar_notes') || '[]';
  const localEvents = localStorage.getItem('desktop_calendar_scheduled_events') || '[]';
  
  try {
    await db.collection('users').doc(uid).collection('data').doc('calendar_data').set({
      notes: JSON.parse(localNotes),
      events: JSON.parse(localEvents),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error("Cloud upload failed:", err);
  }
}

async function syncNotesFromCloud(uid) {
  if (!db) return;
  try {
    const doc = await db.collection('users').doc(uid).collection('data').doc('calendar_data').get();
    if (doc.exists) {
      const data = doc.data();
      if (data.notes) {
        localStorage.setItem('desktop_calendar_notes', JSON.stringify(data.notes));
      }
      if (data.events) {
        localStorage.setItem('desktop_calendar_scheduled_events', JSON.stringify(data.events));
      }
      // Re-render views with cloud notes
      renderAllNotesInManager();
      renderCalendar();
      updateSelectedDayDetails();
    } else {
      // First sign in: upload local notes to seed cloud storage
      await uploadLocalNotesToCloud(uid);
    }
  } catch (err) {
    console.error("Cloud sync failed:", err);
  }
}

// Helper wrapper functions to save changes and sync
function updateLocalNotes(notes) {
  localStorage.setItem('desktop_calendar_notes', JSON.stringify(notes));
  if (currentUser) {
    uploadLocalNotesToCloud(currentUser.uid);
  }
}

function updateLocalEvents(events) {
  localStorage.setItem('desktop_calendar_scheduled_events', JSON.stringify(events));
  if (currentUser) {
    uploadLocalNotesToCloud(currentUser.uid);
  }
}

// ─── NEW FRONT PAGE WIDGETS FUNCTIONALITY ────────────────────────────────────

const NEPALI_PROVERBS = [
  { np: "लोभले लाभ, लाभले विलाप", en: "Greed leads to gain, gain leads to pain." },
  { np: "हुने बिरुवाको चिलो पात", en: "A promising plant has smooth leaves (Morning shows the day)." },
  { np: "नाच्न जान्दैन आँगन टेडो", en: "A bad workman blames his tools." },
  { np: "नमच्चिने पिङको सय झट्का", en: "Empty vessels make the most noise." },
  { np: "काम गर्ने कालु, मकै खाने भालु", en: "One does the work, another gets the reward." },
  { np: "मुखमा रामराम, बगलीमा छुरा", en: "A wolf in sheep's clothing." },
  { np: "बाँदरको हातमा नरिबल", en: "Giving a precious thing to someone who doesn't appreciate it." },
  { np: "रात रहे अग्राख पलाउँछ", en: "Delays breed complications." },
  { np: "एक थुकी सुकी, सय थुकी नदी", en: "Unity is strength." },
  { np: "आफ्नो आङको भैंसी नदेख्ने, अर्काको आङको जुम्रा देख्ने", en: "To see a mote in another's eye but not a beam in one's own." },
  { np: "हतारको काम लतारपतार", en: "Haste makes waste." },
  { np: "घरको बाघ, वनको स्याल", en: "A tiger at home, a jackal in the forest (Fake bravery)." },
  { np: "बाँदरको पुच्छर लौरो न हतियार", en: "A monkey's tail is neither a stick nor a weapon (Useless asset)." },
  { np: "जुन गोरुको सिङ छैन उसैको नाम तिखे", en: "The cow without horns is named Sharp-horns (Hypocrisy)." },
  { np: "खोक्रे वैद्यको सुखदुःख", en: "An unqualified doctor brings pain (Quack doctor's advice)." }
];

let currentProverbIndex = 0;

function shuffleProverb() {
  let nextIdx = currentProverbIndex;
  while (nextIdx === currentProverbIndex) {
    nextIdx = Math.floor(Math.random() * NEPALI_PROVERBS.length);
  }
  currentProverbIndex = nextIdx;
  const p = NEPALI_PROVERBS[currentProverbIndex];
  const npEl = document.getElementById('proverb-np');
  const enEl = document.getElementById('proverb-en');
  if (npEl) npEl.innerText = p.np;
  if (enEl) enEl.innerText = p.en;
}

function copyProverb() {
  const p = NEPALI_PROVERBS[currentProverbIndex];
  const textToCopy = `नेपाली उखान: ${p.np}\nEnglish: ${p.en}`;
  navigator.clipboard.writeText(textToCopy);
  
  const copyBtn = document.getElementById('proverb-copy-btn');
  if (copyBtn) {
    const originalText = copyBtn.innerText;
    copyBtn.innerText = "✓ Copied!";
    setTimeout(() => { copyBtn.innerText = originalText; }, 1500);
  }
}

function transliterateRomanToNepali(text) {
  const CONSONANTS = {
    'k': 'क्', 'kh': 'ख्', 'g': 'ग्', 'gh': 'घ्',
    'ch': 'च्', 'chh': 'छ्', 'j': 'ज्', 'jh': 'झ्',
    'T': 'ट्', 'Th': 'ठ्', 'D': 'ड्', 'Dh': 'ढ्', 'N': 'ण्',
    't': 'त्', 'th': 'थ्', 'd': 'द्', 'dh': 'ध्', 'n': 'न्',
    'p': 'प्', 'ph': 'फ्', 'b': 'ब्', 'bh': 'भ्', 'm': 'म्',
    'y': 'य्', 'r': 'र्', 'l': 'ल्', 'v': 'व्', 'w': 'व्',
    'sh': 'श्', 'shh': 'ष्', 's': 'स्', 'h': 'ह्',
    'gy': 'ज्ञ्', 'ksh': 'क्ष्'
  };

  const VOWELS = {
    'a': '', 'aa': 'ा', 'i': 'ि', 'ee': 'ी', 'u': 'ु', 'oo': 'ू',
    'e': 'े', 'ai': 'ै', 'o': 'ो', 'au': 'ौ', 'ri': 'ृ'
  };

  const STANDALONE_VOWELS = {
    'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई', 'u': 'उ', 'oo': 'ऊ',
    'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ', 'ri': 'ऋ'
  };

  let result = "";
  let i = 0;
  let activeConsonant = "";

  while (i < text.length) {
    let char = text[i];
    
    if (char === ' ' || char === '\n' || /[.,!?-]/.test(char)) {
      if (activeConsonant) {
        result += activeConsonant.replace('्', '');
        activeConsonant = "";
      }
      result += char;
      i++;
      continue;
    }

    let matchedConsonant = "";
    let matchLen = 0;
    
    if (i + 2 < text.length) {
      let threeChars = text.substr(i, 3);
      if (CONSONANTS[threeChars]) {
        matchedConsonant = CONSONANTS[threeChars];
        matchLen = 3;
      }
    }
    if (!matchedConsonant && i + 1 < text.length) {
      let twoChars = text.substr(i, 2);
      if (CONSONANTS[twoChars]) {
        matchedConsonant = CONSONANTS[twoChars];
        matchLen = 2;
      }
    }
    if (!matchedConsonant && CONSONANTS[char]) {
      matchedConsonant = CONSONANTS[char];
      matchLen = 1;
    }

    if (matchedConsonant) {
      if (activeConsonant) {
        result += activeConsonant;
      }
      activeConsonant = matchedConsonant;
      i += matchLen;
      continue;
    }

    let matchedVowel = "";
    let vowelLen = 0;
    
    if (i + 1 < text.length) {
      let twoChars = text.substr(i, 2);
      if (VOWELS[twoChars]) {
        matchedVowel = twoChars;
        vowelLen = 2;
      }
    }
    if (!matchedVowel && VOWELS[char]) {
      matchedVowel = char;
      vowelLen = 1;
    }

    if (matchedVowel) {
      if (activeConsonant) {
        result += activeConsonant.replace('्', '') + VOWELS[matchedVowel];
        activeConsonant = "";
      } else {
        result += STANDALONE_VOWELS[matchedVowel] || matchedVowel;
      }
      i += vowelLen;
      continue;
    }

    if (activeConsonant) {
      result += activeConsonant.replace('्', '');
      activeConsonant = "";
    }
    result += char;
    i++;
  }

  if (activeConsonant) {
    result += activeConsonant.replace('्', '');
  }

  return result;
}

function renderMonthlyEvents() {
  const listEl = document.getElementById('monthly-events-list');
  if (!listEl) return;
  
  listEl.innerHTML = '';
  
  const monthHolidays = NE_MONTHS_EVENTS[calMonth] || {};
  const holidayEntries = Object.entries(monthHolidays);
  
  const monthScheduled = scheduledEvents.filter(e => {
    if (e.type === 'once') return e.year === calYear && e.month === calMonth;
    if (e.type === 'bs-yearly') return e.month === calMonth;
    return false;
  });
  
  const daysWithEvents = {};
  
  holidayEntries.forEach(([dStr, event]) => {
    const d = parseInt(dStr);
    daysWithEvents[d] = {
      day: d,
      title: event.title,
      isHoliday: event.isHoliday
    };
  });
  
  monthScheduled.forEach(e => {
    const d = e.day;
    if (!daysWithEvents[d]) {
      daysWithEvents[d] = {
        day: d,
        title: e.title,
        isHoliday: false,
        isCustomNote: true,
        color: e.color
      };
    }
  });
  
  const sortedDays = Object.values(daysWithEvents).sort((a, b) => a.day - b.day);
  
  if (sortedDays.length === 0) {
    listEl.innerHTML = `
      <p class="empty-notes-text" style="font-size: 11px; font-style: italic; color: var(--text-secondary); text-align: center; padding: 12px 0;">
        यस महिनामा कुनै मुख्य दिनहरू छैनन्।
      </p>
    `;
    return;
  }
  
  sortedDays.forEach(evt => {
    const item = document.createElement('div');
    item.className = 'monthly-event-item';
    
    const sec = getSecondaryDay(calYear, calMonth, evt.day);
    const dateSubText = sec ? `${toNepaliStr(evt.day)} गते (${sec.monthEN} ${sec.day})` : `${toNepaliStr(evt.day)} गते`;
    
    let badgeMarkup = '';
    if (evt.isHoliday) {
      badgeMarkup = `<span class="event-badge holiday-badge" style="font-size: 8px; padding: 1px 4px;">बिदा</span>`;
    } else if (evt.isCustomNote) {
      badgeMarkup = `<span class="event-badge" style="font-size: 8px; padding: 1px 4px; background: ${getDotColorHex(evt.color)}; color: white;">नोट</span>`;
    } else {
      badgeMarkup = `<span class="event-badge" style="font-size: 8px; padding: 1px 4px; background: var(--bg-active); color: var(--text-primary);">दिवस</span>`;
    }
    
    item.innerHTML = `
      <div class="monthly-event-left">
        <span class="monthly-event-title-text">${evt.title}</span>
        <span class="monthly-event-date-text">${dateSubText}</span>
      </div>
      ${badgeMarkup}
    `;
    
    item.addEventListener('click', () => {
      selectedYear = calYear;
      selectedMonth = calMonth;
      selectedDay = evt.day;
      updateSelectedDayDetails();
      renderCalendar();
    });
    
    listEl.appendChild(item);
  });
}

function updateKathmanduClock() {
  const clockEl = document.getElementById('nepal-clock');
  const labelEl = document.getElementById('sidebar-clock-label');
  if (!clockEl) return;
  
  // Auto-detect timezone location
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (labelEl && tz) {
      const parts = tz.split('/');
      const loc = parts[parts.length - 1].replace('_', ' ').toUpperCase();
      labelEl.innerText = `${loc} TIME`;
    }
  } catch (_) {}

  const d = new Date();
  let hours = d.getHours();
  let minutes = d.getMinutes();
  let seconds = d.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  const hrsStr = String(hours).padStart(2, '0');
  const minsStr = String(minutes).padStart(2, '0');
  const secsStr = String(seconds).padStart(2, '0');
  
  clockEl.innerText = `${hrsStr}:${minsStr}:${secsStr} ${ampm}`;
}

function updateBSYearProgress() {
  const percentEl = document.getElementById('year-progress-percent');
  const barEl = document.getElementById('year-progress-bar');
  const yearValEl = document.getElementById('year-progress-val');
  if (!percentEl || !barEl) return;
  
  try {
    const todayNp = new NepaliDate();
    const currentYr = todayNp.getYear();
    
    if (yearValEl) {
      yearValEl.innerText = toNepaliStr(currentYr);
    }
    
    let totalDays = 0;
    for (let m = 0; m < 12; m++) {
      totalDays += getDaysInMonth(currentYr, m);
    }
    
    let currentDayIndex = 0;
    const curMonth = todayNp.getMonth();
    const curDay = todayNp.getDate();
    for (let m = 0; m < curMonth; m++) {
      currentDayIndex += getDaysInMonth(currentYr, m);
    }
    currentDayIndex += curDay;
    
    const percent = ((currentDayIndex / totalDays) * 100).toFixed(1);
    percentEl.innerText = `${toNepaliStr(percent)}%`;
    barEl.style.width = `${percent}%`;
  } catch (e) {
    console.error("Year progress calc error:", e);
  }
}

function updateSidebarThemeIcon() {
  const iconEl = document.getElementById('sidebar-theme-icon');
  if (!iconEl) return;
  
  const isDark = document.body.classList.contains('dark') || document.body.className === 'dark';
  if (isDark) {
    iconEl.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
  } else {
    iconEl.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
  }
}

// Import romonisednepali for the fully offline high-quality Romanized-to-Nepali transliterator
const romonisedCore = require('romonisednepali/core.js');

function convertRomanToNepali(raw, smartConvert = true) {
  try {
    const charactersUnicode = romonisedCore.translate(raw, smartConvert).split("#");
    let convertedCharacters = "";
    charactersUnicode.forEach(element => {
      if (element) {
        const charCode = parseInt(element.replace("¬", ""), 10);
        if (!isNaN(charCode)) {
          convertedCharacters += String.fromCharCode(charCode);
        }
      }
    });
    return convertedCharacters;
  } catch (e) {
    console.error("Transliteration error:", e);
    return raw;
  }
}

// Global News Media Houses Configurations
const newsSources = [
  { name: 'Onlinekhabar', domain: 'onlinekhabar.com', rss: 'https://www.onlinekhabar.com/feed', icon: 'https://www.onlinekhabar.com/favicon.ico' },
  { name: 'Ekantipur', domain: 'ekantipur.com', rss: 'https://ekantipur.com/rss', icon: 'https://ekantipur.com/favicon.ico' },
  { name: 'Ratopati', domain: 'ratopati.com', rss: 'https://ratopati.com/feed', icon: 'https://ratopati.com/favicon.ico' },
  { name: 'Setopati', domain: 'setopati.com', rss: 'https://setopati.com/feed', icon: 'https://setopati.com/favicon.ico' },
  { name: 'Ujyaalo Online', domain: 'ujyaaloonline.com', rss: 'https://ujyaaloonline.com/feed', icon: 'https://ujyaaloonline.com/favicon.ico' },
  { name: 'BBC Nepali', domain: 'bbc.com/nepali', rss: 'https://feeds.bbci.co.uk/nepali/rss.xml', icon: 'https://www.bbc.com/favicon.ico' },
  { name: 'Himal Khabar', domain: 'himalkhabar.com', rss: 'https://www.himalkhabar.com/feed', icon: 'https://www.himalkhabar.com/favicon.ico' },
  { name: 'Gorkhapatra', domain: 'gorkhapatraonline.com', rss: 'https://gorkhapatraonline.com/feed', icon: 'https://gorkhapatraonline.com/favicon.ico' },
  { name: 'Khabarhub', domain: 'khabarhub.com', rss: 'https://khabarhub.com/feed', icon: 'https://khabarhub.com/favicon.ico' },
  { name: 'NepalNews', domain: 'nepalnews.com', rss: 'https://nepalnews.com/feed', icon: 'https://nepalnews.com/favicon.ico' }
];

let selectedNewsSource = newsSources[0];

// Node-based CORS-bypassing RSS request
function fetchRssFeed(url) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
}

// Render the 10 popular news media buttons inside news-tab
function initNewsTabSection() {
  const mediaListContainer = document.getElementById('news-media-list');
  if (!mediaListContainer) return;
  
  mediaListContainer.innerHTML = '';
  
  newsSources.forEach((src, idx) => {
    const btn = document.createElement('button');
    btn.className = 'news-source-btn';
    btn.style.cssText = 'display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); cursor: pointer; text-align: left; font-size: 11.5px; font-weight: bold; margin-bottom: 2px;';
    btn.innerHTML = `
      <img src="${src.icon}" style="width: 16px; height: 16px; border-radius: 3px;" onerror="this.src='tray-icon.png'">
      <span style="font-size: 11.5px; color: var(--text-primary); font-weight: bold;">${src.name}</span>
    `;
    
    if (src.name === selectedNewsSource.name) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {
      document.querySelectorAll('.news-source-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedNewsSource = src;
      closeNewsArticle();
      loadNewsSource(src);
    });
    
    mediaListContainer.appendChild(btn);
  });
  
  // Close article back buttons
  const closeBtn = document.getElementById('close-news-article-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeNewsArticle);
  }
  
  // Initial load
  loadNewsSource(selectedNewsSource);
}

async function loadNewsSource(source) {
  const titleEl = document.getElementById('news-source-title');
  if (titleEl) titleEl.innerText = source.name;

  const feedsList = document.getElementById('news-feeds-list');
  if (!feedsList) return;

  feedsList.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 120px; font-size: 11px; color: var(--text-secondary);">Loading feeds, please wait...</div>';

  try {
    const xmlText = await fetchRssFeed(source.rss);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const items = xmlDoc.getElementsByTagName("item");
    
    feedsList.innerHTML = '';
    
    if (!items || items.length === 0) {
      feedsList.innerHTML = '<div class="empty-state" style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 11px;">No news feeds found.</div>';
      return;
    }
    
    Array.from(items).slice(0, 15).forEach(item => {
      const title = item.getElementsByTagName("title")[0]?.textContent || '';
      const link = item.getElementsByTagName("link")[0]?.textContent || '';
      const pubDate = item.getElementsByTagName("pubDate")[0]?.textContent || '';
      let description = item.getElementsByTagName("description")[0]?.textContent || '';
      
      description = description.replace(/<[^>]*>/g, '').substring(0, 120) + '...';

      const feedItem = document.createElement('div');
      feedItem.style.cssText = 'padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); cursor: pointer; transition: all 0.2s;';
      feedItem.innerHTML = `
        <h4 style="font-size: 12.5px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0;">${title}</h4>
        <p style="font-size: 10.5px; color: var(--text-secondary); margin: 0 0 6px 0; line-height: 1.4;">${description}</p>
        <span style="font-size: 8.5px; color: var(--text-secondary); opacity: 0.7;">${pubDate}</span>
      `;

      feedItem.addEventListener('click', () => {
        openNewsArticle(title, link);
      });

      feedItem.addEventListener('mouseenter', () => {
        feedItem.style.borderColor = 'var(--accent-color)';
        feedItem.style.background = 'var(--bg-active)';
      });
      feedItem.addEventListener('mouseleave', () => {
        feedItem.style.borderColor = 'var(--border-color)';
        feedItem.style.background = 'var(--bg-primary)';
      });

      feedsList.appendChild(feedItem);
    });
  } catch (err) {
    console.error("RSS fetch error:", err);
    feedsList.innerHTML = `<div class="empty-state" style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 11px;">Error loading news feeds: ${err.message}</div>`;
  }
}

function openNewsArticle(title, link) {
  const feedsContainer = document.getElementById('news-feeds-container');
  const articleContainer = document.getElementById('news-article-container');
  const articleTitle = document.getElementById('news-article-title');
  const webview = document.getElementById('news-webview');
  
  if (feedsContainer && articleContainer && articleTitle && webview) {
    feedsContainer.style.display = 'none';
    articleContainer.style.display = 'flex';
    articleTitle.innerText = title;
    webview.src = link;
    
    // Inject CSS once loaded to hide headers/footers
    webview.addEventListener('did-finish-load', injectNewsSiteCSS);
  }
}

function closeNewsArticle() {
  const feedsContainer = document.getElementById('news-feeds-container');
  const articleContainer = document.getElementById('news-article-container');
  const webview = document.getElementById('news-webview');
  
  if (feedsContainer && articleContainer && webview) {
    feedsContainer.style.display = 'flex';
    articleContainer.style.display = 'none';
    webview.src = 'about:blank';
    webview.removeEventListener('did-finish-load', injectNewsSiteCSS);
  }
}

function injectNewsSiteCSS() {
  const webview = document.getElementById('news-webview');
  if (!webview) return;
  
  const css = `
    header, footer, .header, .footer, #header, #footer, .navbar, .navigation, .site-header, .site-footer, .site-navigation, #site-header, #site-footer, .top-bar, .main-header, .footer-bottom, .bottom-footer, .nav-bar, .menu-bar, nav, [role="navigation"] {
      display: none !important;
    }
  `;
  try {
    webview.insertCSS(css);
  } catch (e) {
    console.error("Failed to inject CSS in webview:", e);
  }
}

function initNewFrontPageWidgets() {
  // Theme Sync listeners
  try {
    updateSidebarThemeIcon();
    if (themeDarkBtn) themeDarkBtn.addEventListener('click', updateSidebarThemeIcon);
    if (themeLightBtn) themeLightBtn.addEventListener('click', updateSidebarThemeIcon);
    
    const sidebarThemeBtn = document.getElementById('sidebar-theme-toggle');
    if (sidebarThemeBtn) {
      sidebarThemeBtn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark') || document.body.className === 'dark';
        if (isDark) {
          if (themeLightBtn) themeLightBtn.click();
        } else {
          if (themeDarkBtn) themeDarkBtn.click();
        }
        updateSidebarThemeIcon();
      });
    }
  } catch (e) { console.error("Theme sync init failed:", e); }

  // Kathmandu/Local Clock timer
  try {
    setInterval(updateKathmanduClock, 1000);
    updateKathmanduClock();
  } catch (e) { console.error("Local clock init failed:", e); }

  // BS Year Progress
  try {
    updateBSYearProgress();
  } catch (e) { console.error("Year progress init failed:", e); }
  
  // Extra Tools Tab switcher
  try {
    const tabProverbsBtn = document.getElementById('tool-tab-proverbs');
    const tabUnicodeBtn = document.getElementById('tool-tab-unicode');
    const contentProverbs = document.getElementById('tool-content-proverbs');
    const contentUnicode = document.getElementById('tool-content-unicode');

    if (tabProverbsBtn && tabUnicodeBtn && contentProverbs && contentUnicode) {
      tabProverbsBtn.addEventListener('click', () => {
        tabProverbsBtn.classList.add('active');
        tabUnicodeBtn.classList.remove('active');
        tabProverbsBtn.style.color = 'var(--accent-color)';
        tabProverbsBtn.style.borderBottom = '2px solid var(--accent-color)';
        tabUnicodeBtn.style.color = 'var(--text-secondary)';
        tabUnicodeBtn.style.borderBottom = 'none';
        contentProverbs.style.display = 'block';
        contentUnicode.style.display = 'none';
      });
      
      tabUnicodeBtn.addEventListener('click', () => {
        tabUnicodeBtn.classList.add('active');
        tabProverbsBtn.classList.remove('active');
        tabUnicodeBtn.style.color = 'var(--accent-color)';
        tabUnicodeBtn.style.borderBottom = '2px solid var(--accent-color)';
        tabProverbsBtn.style.color = 'var(--text-secondary)';
        tabProverbsBtn.style.borderBottom = 'none';
        contentUnicode.style.display = 'block';
        contentProverbs.style.display = 'none';
      });
    }
  } catch (e) { console.error("Tab switcher init failed:", e); }
  
  // Proverbs listeners
  try {
    const proverbShuffleBtn = document.getElementById('proverb-shuffle-btn');
    const proverbCopyBtn = document.getElementById('proverb-copy-btn');
    if (proverbShuffleBtn) proverbShuffleBtn.addEventListener('click', shuffleProverb);
    if (proverbCopyBtn) proverbCopyBtn.addEventListener('click', copyProverb);
    shuffleProverb(); // load initial proverb
  } catch (e) { console.error("Proverbs init failed:", e); }

  // Unicode Converter listener
  try {
    const unicodeInput = document.getElementById('unicode-input');
    if (unicodeInput) {
      unicodeInput.addEventListener('keydown', (e) => {
        const triggers = [' ', 'Enter', '.', ',', '?', '!', ';', ':'];
        if (triggers.includes(e.key)) {
          const val = e.target.value;
          const pos = e.target.selectionStart;
          const textBefore = val.substring(0, pos);
          const textAfter = val.substring(pos);
          
          const match = textBefore.match(/[a-zA-Z]+$/);
          if (match) {
            const romanWord = match[0];
            const nepaliWord = convertRomanToNepali(romanWord);
            
            const newTextBefore = textBefore.substring(0, textBefore.length - romanWord.length) + nepaliWord;
            e.preventDefault();
            
            const appendChar = e.key === 'Enter' ? '\n' : e.key;
            e.target.value = newTextBefore + appendChar + textAfter;
            
            const newPos = newTextBefore.length + appendChar.length;
            e.target.setSelectionRange(newPos, newPos);
          }
        }
      });
    }
    
    const unicodeCopyBtn = document.getElementById('unicode-copy-btn');
    if (unicodeCopyBtn && unicodeInput) {
      unicodeCopyBtn.addEventListener('click', () => {
        const text = unicodeInput.value;
        if (!text) return;
        navigator.clipboard.writeText(text);
        const originalText = unicodeCopyBtn.innerText;
        unicodeCopyBtn.innerText = "✓ Copied!";
        setTimeout(() => { unicodeCopyBtn.innerText = originalText; }, 1500);
      });
    }
  } catch (e) { console.error("Unicode converter init failed:", e); }

  // Dashboard Header redirects
  try {
    const headerBell = document.getElementById('header-bell-btn');
    if (headerBell) {
      headerBell.addEventListener('click', () => {
        const annLink = document.querySelector('[data-tab="notifications-tab"]');
        if (annLink) annLink.click();
      });
    }
    const headerAccount = document.getElementById('header-account-btn');
    if (headerAccount) {
      headerAccount.addEventListener('click', () => {
        const accLink = document.querySelector('[data-tab="account-tab"]');
        if (accLink) accLink.click();
      });
    }
  } catch (e) { console.error("Header click redirects failed:", e); }

  // Dynamic greeting
  try {
    updateHeaderGreeting();
    setInterval(updateHeaderGreeting, 60000);
  } catch (e) { console.error("Header greeting init failed:", e); }

  // Date Diff calculator
  try {
    setupDateCalcInputs();
    const calcDiffBtn = document.getElementById('calculate-diff-btn');
    if (calcDiffBtn) {
      calcDiffBtn.addEventListener('click', runDateDifferenceCalc);
    }
  } catch (e) { console.error("Date difference calculator init failed:", e); }

  // Onboarding slideshow
  try {
    initOnboardingFlow();
  } catch (e) { console.error("Onboarding flow init failed:", e); }

  // More Tools iframe dynamic binders
  try {
    const toolBinds = [
      { id: 'date-converter', btn: 'tool-btn-converter' },
      { id: 'translator', btn: 'tool-btn-translator' },
      { id: 'currency-converter', btn: 'tool-btn-currency' },
      { id: 'jpg-to-pdf', btn: 'tool-btn-jpg2pdf' },
      { id: 'merge-pdf', btn: 'tool-btn-merge' },
      { id: 'add-page-numbers', btn: 'tool-btn-pagenum' },
      { id: 'pdf-to-image', btn: 'tool-btn-pdf2img' },
      { id: 'ai-summarizer', btn: 'tool-btn-summarizer' },
      { id: 'image-compressor', btn: 'tool-btn-compressor' },
      { id: 'emi-calculator', btn: 'tool-btn-emi' },
      { id: 'qr-studio', btn: 'tool-btn-qr' },
      { id: 'json-formatter', btn: 'tool-btn-json' },
      { id: 'diff-checker', btn: 'tool-btn-diff' },
      { id: 'code-runner', btn: 'tool-btn-coderun' },
      { id: 'file-transfer', btn: 'tool-btn-filetrans' },
      { id: 'screenshot-studio', btn: 'tool-btn-screenshot' },
      { id: 'secure-vault', btn: 'tool-btn-vault' },
      { id: 'dev-card-studio', btn: 'tool-btn-devcard' },
      { id: 'font-downloader', btn: 'tool-btn-font' },
      { id: 'ocr-converter', btn: 'tool-btn-ocr' },
      { id: 'bg-remover', btn: 'tool-btn-bgremove' },
      { id: 'scan-pdf', btn: 'tool-btn-scan' }
    ];
    toolBinds.forEach(t => {
      document.getElementById(t.btn)?.addEventListener('click', () => loadToolIframe(t.id));
    });
  } catch (e) { console.error("More tools button binders failed:", e); }

  // Nepali News Reader Tab Section
  try {
    initNewsTabSection();
  } catch (e) { console.error("Nepali news tab init failed:", e); }
  
  // Render monthly events immediately
  try {
    renderMonthlyEvents();
  } catch (e) { console.error("Monthly events render failed:", e); }
}

// ─── PHASE 2 WIDGETS FUNCTIONALITY ───────────────────────────────────────────

function updateHeaderGreeting() {
  const greetingEl = document.getElementById('header-greeting');
  if (!greetingEl) return;
  const hr = new Date().getHours();
  let greet = "Good Day";
  if (hr < 12) greet = "Good Morning";
  else if (hr < 17) greet = "Good Afternoon";
  else greet = "Good Evening";
  greetingEl.innerText = `${greet}, Welcome!`;
}

// Onboarding slideshow controls
let currentOnboardingSlide = 0;
const totalOnboardingSlides = 4;

function updateOnboardingSlidesUI() {
  const slides = document.querySelectorAll('.onboarding-slide');
  const dots = document.querySelectorAll('.onboarding-dot');
  const prevBtn = document.getElementById('onboarding-prev-btn');
  const nextBtn = document.getElementById('onboarding-next-btn');
  
  slides.forEach((slide, idx) => {
    slide.style.display = idx === currentOnboardingSlide ? 'block' : 'none';
  });
  
  dots.forEach((dot, idx) => {
    if (idx === currentOnboardingSlide) {
      dot.classList.add('active-dot');
    } else {
      dot.classList.remove('active-dot');
    }
  });
  
  if (prevBtn) {
    prevBtn.style.visibility = currentOnboardingSlide === 0 ? 'hidden' : 'visible';
  }
  
  if (nextBtn) {
    if (currentOnboardingSlide === totalOnboardingSlides - 1) {
      nextBtn.innerText = 'Finish';
    } else {
      nextBtn.innerText = 'Next';
    }
  }
}

function closeOnboarding() {
  localStorage.setItem('nepali_calendar_onboarded', 'true');
  const modal = document.getElementById('onboarding-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active-modal');
  }
}

function initOnboardingFlow() {
  const modal = document.getElementById('onboarding-modal');
  if (!modal) return;
  
  const hasSeen = localStorage.getItem('nepali_calendar_onboarded');
  if (hasSeen !== 'true') {
    modal.style.display = 'flex';
    modal.classList.add('active-modal');
  }
  
  const skipBtn = document.getElementById('onboarding-skip-top');
  const prevBtn = document.getElementById('onboarding-prev-btn');
  const nextBtn = document.getElementById('onboarding-next-btn');
  
  if (skipBtn) skipBtn.addEventListener('click', closeOnboarding);
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentOnboardingSlide > 0) {
        currentOnboardingSlide--;
        updateOnboardingSlidesUI();
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentOnboardingSlide < totalOnboardingSlides - 1) {
        currentOnboardingSlide++;
        updateOnboardingSlidesUI();
      } else {
        closeOnboarding();
      }
    });
  }
  
  updateOnboardingSlidesUI();
}

// Date difference calculator dropdown populate & computation logic
function setupDateCalcInputs() {
  const startY = document.getElementById('calc-start-year');
  const startM = document.getElementById('calc-start-month');
  const startD = document.getElementById('calc-start-day');
  const endY = document.getElementById('calc-end-year');
  const endM = document.getElementById('calc-end-month');
  const endD = document.getElementById('calc-end-day');
  
  if (!startY || !startM || !startD || !endY || !endM || !endD) return;
  
  startY.innerHTML = '';
  startM.innerHTML = '';
  startD.innerHTML = '';
  endY.innerHTML = '';
  endM.innerHTML = '';
  endD.innerHTML = '';
  
  // Populate BS Year select dropdowns (2000 - 2095)
  for (let y = 2000; y <= 2095; y++) {
    const opt1 = document.createElement('option');
    opt1.value = y;
    opt1.innerText = y;
    if (y === 2083) opt1.selected = true;
    startY.appendChild(opt1);
    
    const opt2 = document.createElement('option');
    opt2.value = y;
    opt2.innerText = y;
    if (y === 2083) opt2.selected = true;
    endY.appendChild(opt2);
  }
  
  // Populate BS Month dropdowns
  NEPALI_MONTHS_EN.forEach((name, index) => {
    const opt1 = document.createElement('option');
    opt1.value = index;
    opt1.innerText = `${name} (${NEPALI_MONTHS_NE[index]})`;
    if (index === 2) opt1.selected = true; // Ashadh
    startM.appendChild(opt1);
    
    const opt2 = document.createElement('option');
    opt2.value = index;
    opt2.innerText = `${name} (${NEPALI_MONTHS_NE[index]})`;
    if (index === 2) opt2.selected = true; // Ashadh
    endM.appendChild(opt2);
  });
  
  updateDateCalcDaysDropdown('start');
  updateDateCalcDaysDropdown('end');
  
  startY.addEventListener('change', () => updateDateCalcDaysDropdown('start'));
  startM.addEventListener('change', () => updateDateCalcDaysDropdown('start'));
  endY.addEventListener('change', () => updateDateCalcDaysDropdown('end'));
  endM.addEventListener('change', () => updateDateCalcDaysDropdown('end'));
}

function updateDateCalcDaysDropdown(type) {
  const yearSel = document.getElementById(`calc-${type}-year`);
  const monthSel = document.getElementById(`calc-${type}-month`);
  const daySel = document.getElementById(`calc-${type}-day`);
  if (!yearSel || !monthSel || !daySel) return;
  
  daySel.innerHTML = '';
  const year = parseInt(yearSel.value);
  const month = parseInt(monthSel.value);
  
  const daysCount = getDaysInMonth(year, month);
  for (let d = 1; d <= daysCount; d++) {
    const opt = document.createElement('option');
    opt.value = d;
    opt.innerText = d;
    if (d === 7) opt.selected = true;
    daySel.appendChild(opt);
  }
}

function runDateDifferenceCalc() {
  const sy = parseInt(document.getElementById('calc-start-year').value);
  const sm = parseInt(document.getElementById('calc-start-month').value);
  const sd = parseInt(document.getElementById('calc-start-day').value);
  
  const ey = parseInt(document.getElementById('calc-end-year').value);
  const em = parseInt(document.getElementById('calc-end-month').value);
  const ed = parseInt(document.getElementById('calc-end-day').value);
  
  try {
    const startDate = new NepaliDate(sy, sm, sd);
    const endDate = new NepaliDate(ey, em, ed);
    
    const jsStart = startDate.toJsDate();
    const jsEnd = endDate.toJsDate();
    
    let diffMs = jsEnd.getTime() - jsStart.getTime();
    if (diffMs < 0) {
      document.getElementById('calc-result-main').innerText = "अन्तिम मिति शुरुको मितिभन्दा पछि हुनुपर्छ।";
      document.getElementById('calc-result-sub').innerText = "End date must be after start date.";
      document.getElementById('calc-result-box').style.display = 'block';
      return;
    }
    
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Calculate calendar difference (years, months, days)
    let years = jsEnd.getFullYear() - jsStart.getFullYear();
    let months = jsEnd.getMonth() - jsStart.getMonth();
    let days = jsEnd.getDate() - jsStart.getDate();
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(jsEnd.getFullYear(), jsEnd.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const resultMain = `${toNepaliStr(years)} वर्ष, ${toNepaliStr(months)} महिना, ${toNepaliStr(days)} दिन`;
    const resultSub = `Total Duration: ${toNepaliStr(totalDays)} Days (${years} Years, ${months} Months, ${days} Days)`;
    
    document.getElementById('calc-result-main').innerText = resultMain;
    document.getElementById('calc-result-sub').innerText = resultSub;
    document.getElementById('calc-result-box').style.display = 'block';
  } catch (err) {
    document.getElementById('calc-result-main').innerText = "त्रुटि (Error)";
    document.getElementById('calc-result-sub').innerText = err.message || "Invalid dates";
    document.getElementById('calc-result-box').style.display = 'block';
  }
}

// --- App Start Initializing ---
setupConverterInputs();
updateSelectedDayDetails();
renderCalendar();
renderAllNotesInManager();
updateConnectionUI();
checkDailyReminders();
updateDynamicTrayIcon(selectedDay);
initNewFrontPageWidgets();

// Query custom admin notifications on startup and every 10 seconds (for instant alert delivery)
checkFirestoreNotifications();
setInterval(checkFirestoreNotifications, 10 * 1000);
checkAppUpdates();

// Setup calendar language toggle
const calLangToggleBtn = document.getElementById('cal-lang-toggle');
if (calLangToggleBtn) {
  calLangToggleBtn.addEventListener('click', () => {
    calViewType = calViewType === 'BS' ? 'AD' : 'BS';
    calLangToggleBtn.innerText = calViewType === 'BS' ? 'Show English' : 'Show Nepali';
    renderCalendar();
  });
}
