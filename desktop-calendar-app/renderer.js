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

  localStorage.setItem('desktop_calendar_notes', JSON.stringify(notes));
  localStorage.setItem('desktop_calendar_scheduled_events', JSON.stringify(scheduledEvents));
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
  
  localStorage.setItem('desktop_calendar_scheduled_events', JSON.stringify(scheduledEvents));
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
  
  localStorage.setItem('desktop_calendar_scheduled_events', JSON.stringify(scheduledEvents));
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
    const response = await fetch('https://firestore.googleapis.com/v1/projects/bishal-mishra-3c559/databases/(default)/documents/notifications?pageSize=10');
    if (!response.ok) return;
    const data = await response.json();
    if (data.documents) {
      let shownNotifs = [];
      try {
        const saved = localStorage.getItem('desktop_calendar_shown_notifications');
        if (saved) shownNotifs = JSON.parse(saved);
      } catch(e) {}
      
      let updatedShown = [...shownNotifs];
      let newNotifFound = false;

      data.documents.forEach(doc => {
        const docId = doc.name.split('/').pop();
        if (!shownNotifs.includes(docId)) {
          const fields = doc.fields;
          if (fields && fields.title && fields.body) {
            const title = fields.title.stringValue || '';
            const body = fields.body.stringValue || '';
            
            // Show push notification!
            ipcRenderer.send('show-notification', { title, body });
            
            updatedShown.push(docId);
            newNotifFound = true;
          }
        }
      });

      if (newNotifFound) {
        localStorage.setItem('desktop_calendar_shown_notifications', JSON.stringify(updatedShown));
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

// Load saved client credentials from localStorage
if (googleClientIdInput) googleClientIdInput.value = localStorage.getItem('google_client_id') || '';
if (googleClientSecretInput) googleClientSecretInput.value = localStorage.getItem('google_client_secret') || '';
if (outlookClientIdInput) outlookClientIdInput.value = localStorage.getItem('outlook_client_id') || '';
if (outlookClientSecretInput) outlookClientSecretInput.value = localStorage.getItem('outlook_client_secret') || '';

function updateConnectionUI() {
  const googleToken = localStorage.getItem('google_refresh_token');
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

  const outlookToken = localStorage.getItem('outlook_refresh_token');
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
  connectGoogleBtn.addEventListener('click', () => {
    const cid = googleClientIdInput.value.trim();
    const secret = googleClientSecretInput.value.trim();
    if (!cid || !secret) {
      alert("Please enter both Google Client ID and Client Secret!");
      return;
    }
    localStorage.setItem('google_client_id', cid);
    localStorage.setItem('google_client_secret', secret);
    ipcRenderer.send('start-google-auth');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${cid}&redirect_uri=http://localhost:48281/google-callback&response_type=code&scope=https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent`;
    require('electron').shell.openExternal(authUrl);
  });
}

if (syncGoogleNowBtn) {
  syncGoogleNowBtn.addEventListener('click', syncEventsToGoogle);
}

ipcRenderer.on('google-auth-success', async (event, code) => {
  const cid = localStorage.getItem('google_client_id');
  const secret = localStorage.getItem('google_client_secret');
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
      localStorage.setItem('google_access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('google_refresh_token', data.refresh_token);
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
  connectOutlookBtn.addEventListener('click', () => {
    const cid = outlookClientIdInput.value.trim();
    const secret = outlookClientSecretInput.value.trim();
    if (!cid || !secret) {
      alert("Please enter both Microsoft Outlook Client ID and Client Secret!");
      return;
    }
    localStorage.setItem('outlook_client_id', cid);
    localStorage.setItem('outlook_client_secret', secret);
    ipcRenderer.send('start-outlook-auth');
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${cid}&response_type=code&redirect_uri=http://localhost:48281/outlook-callback&response_mode=query&scope=offline_access%20Calendars.ReadWrite`;
    require('electron').shell.openExternal(authUrl);
  });
}

if (syncOutlookNowBtn) {
  syncOutlookNowBtn.addEventListener('click', syncEventsToOutlook);
}

ipcRenderer.on('outlook-auth-success', async (event, code) => {
  const cid = localStorage.getItem('outlook_client_id');
  const secret = localStorage.getItem('outlook_client_secret');
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
      localStorage.setItem('outlook_access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('outlook_refresh_token', data.refresh_token);
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

// --- App Start Initializing ---
setupConverterInputs();
updateSelectedDayDetails();
renderCalendar();
renderAllNotesInManager();
updateConnectionUI();
checkDailyReminders();
updateDynamicTrayIcon(selectedDay);

// Query custom admin notifications on startup and every 5 minutes
checkFirestoreNotifications();
setInterval(checkFirestoreNotifications, 5 * 60 * 1000);

// Setup calendar language toggle
const calLangToggleBtn = document.getElementById('cal-lang-toggle');
if (calLangToggleBtn) {
  calLangToggleBtn.addEventListener('click', () => {
    calViewType = calViewType === 'BS' ? 'AD' : 'BS';
    calLangToggleBtn.innerText = calViewType === 'BS' ? 'Show English' : 'Show Nepali';
    renderCalendar();
  });
}
