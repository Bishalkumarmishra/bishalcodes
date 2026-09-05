import { NextResponse } from 'next/server';
import { db } from '../../../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const servicesRef = collection(db, 'services');
    const snapshot = await getDocs(servicesRef);
    
    // 1. Update existing tools with correct icons
    const updates = snapshot.docs.map(async (d) => {
      const s = d.data();
      let newIcon = s.iconUrl;
      
      if (s.linkUrl === 'image-compressor') newIcon = '/image compressor.svg';
      if (s.linkUrl === 'secure-vault') newIcon = '/secure vault.svg';
      if (s.linkUrl === 'scan-pdf') newIcon = '/scan pdf cam scanner.svg';
      if (s.linkUrl === 'ocr-converter') newIcon = '/ai ocr.svg';
      if (s.linkUrl === 'font-downloader') newIcon = '/font tools.svg';
      if (s.linkUrl === 'bg-remover') newIcon = '/bg remove.svg';
      if (s.linkUrl === 'edit-pdf') newIcon = '/pdf edit.svg';
      if (s.linkUrl === 'json-formatter') newIcon = '/json-file-svgrepo-com.svg';
      if (s.linkUrl === 'code-runner') newIcon = '/coding-html-svgrepo-com.svg';
      if (s.linkUrl === 'diff-checker') newIcon = '/file-diff-svgrepo-com.svg';
      if (s.linkUrl === 'currency-converter') newIcon = '/convert-converter-currency-svgrepo-com.svg';
      if (s.linkUrl === 'emi-calculator') newIcon = '/emi-calculator-pro.svg';

      if (newIcon !== s.iconUrl) {
        await updateDoc(doc(db, 'services', d.id), { iconUrl: newIcon });
      }
    });
    await Promise.all(updates);

    // 2. Insert missing tools
    const existingLinks = snapshot.docs.map(d => d.data().linkUrl);
    
    const missingTools = [
      {
        id: 'file-transfer',
        title: 'File Transfer',
        description: 'Send files up to 100 GB instantly via secure peer-to-peer connection. Get a shareable link or email directly — free, no registration required.',
        iconUrl: '/file-transfer-icon.svg',
        bgImageUrl: '',
        linkUrl: 'file-transfer',
        badge: 'NEW',
        order: 15
      },
      {
        id: 'screenshot-studio',
        title: 'Website Screenshot Studio',
        description: 'Capture high-resolution full-page scrolling screenshots of any site. Customize device viewports, resolutions, and download captures instantly.',
        iconUrl: '/screenshot-capture-icon.svg',
        bgImageUrl: '',
        linkUrl: 'screenshot-studio',
        badge: 'NEW',
        order: 16
      },
      {
        id: 'dev-card-studio',
        title: 'Developer Card Studio',
        description: 'Design customized developer profile cards and OpenGraph preview banners. Export as PNG images or copy copyable SVG/React vector markups.',
        iconUrl: '/dev-card.svg',
        bgImageUrl: '',
        linkUrl: 'dev-card-studio',
        badge: 'NEW',
        order: 14
      }
    ];

    for (const tool of missingTools) {
      if (!existingLinks.includes(tool.linkUrl)) {
        await setDoc(doc(db, 'services', tool.id), tool);
      }
    }

    return NextResponse.json({ success: true, message: 'Migration completed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
