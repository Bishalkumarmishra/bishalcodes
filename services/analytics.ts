import { doc, setDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

export const logDailyVisit = async () => {
  if (typeof window === 'undefined') return;
  try {
    const sessionFlag = 'visitor_session_logged';
    if (sessionStorage.getItem(sessionFlag)) return;

    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'analytics_daily_visits', today);
    await setDoc(docRef, {
      date: today,
      visits: increment(1),
      timestamp: Date.now()
    }, { merge: true });
    sessionStorage.setItem(sessionFlag, 'true');
  } catch (err) {
    console.warn('Analytics: Failed to log daily visit', err);
  }
};

export const logToolClick = async (toolSlug: string) => {
  if (!toolSlug) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyRef = doc(db, 'analytics_daily_visits', today);
    const toolClickRef = doc(db, 'analytics_tool_clicks', toolSlug);

    const updateObj: Record<string, any> = {
      [`tools.${toolSlug}`]: increment(1)
    };

    await setDoc(dailyRef, updateObj, { merge: true });
    await setDoc(toolClickRef, {
      toolSlug,
      clicks: increment(1),
      lastClicked: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn(`Analytics: Failed to log tool click for ${toolSlug}`, err);
  }
};
