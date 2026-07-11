const { ipcRenderer } = require('electron');
const NepaliDate = require('nepali-date-converter');

// Handle module compatibility
const NPDate = (NepaliDate && NepaliDate.default) ? NepaliDate.default : NepaliDate;

const NEPALI_MONTHS_NE = ['वैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कात्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत'];
const WEEKDAYS_NE = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
const GREGORIAN_MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toNepaliStr(num) {
  const neMap = {'0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'};
  return String(num).split('').map(c => neMap[c] || c).join('');
}

function updateWidget() {
  try {
    const jsToday = new Date();
    const npToday = new NPDate(jsToday);

    const npYear = toNepaliStr(npToday.getYear());
    const npMonth = NEPALI_MONTHS_NE[npToday.getMonth()];
    const npDay = toNepaliStr(npToday.getDate());
    const npWeekday = WEEKDAYS_NE[npToday.getDay()];

    const enYear = jsToday.getFullYear();
    const enMonth = GREGORIAN_MONTHS_EN[jsToday.getMonth()];
    const enDay = String(jsToday.getDate()).padStart(2, '0');
    const enWeekday = WEEKDAYS_EN[jsToday.getDay()];

    document.getElementById('np-date').innerText = `${npYear} ${npMonth} ${npDay} गते ${npWeekday}`;
    document.getElementById('en-date').innerText = `${enYear} ${enMonth} ${enDay} ${enWeekday}`;
    
    // In a real app we would calculate actual tithi, but for this widget we will simulate it or leave it blank
    // The previous renderer had a hardcoded mapping, let's use a generic greeting or leave it simple.
    document.getElementById('tithi').innerText = `शुभ दिन (Good Day)`;
  } catch (err) {
    console.error('Widget update error', err);
    document.getElementById('np-date').innerText = 'Error loading date';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateWidget();
  // Update every minute to catch day changes
  setInterval(updateWidget, 60000);

  // Close button
  document.getElementById('close-btn').addEventListener('click', () => {
    ipcRenderer.send('close-widget');
  });

  // Dashboard button
  document.getElementById('dash-btn').addEventListener('click', () => {
    ipcRenderer.send('open-dashboard');
  });
});
