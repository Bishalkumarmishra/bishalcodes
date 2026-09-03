import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function generateUUID(): string {
  return crypto.randomUUID().toUpperCase();
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getDefaultIconBase64(): string {
  try {
    const iconPath = path.join(process.cwd(), 'public', 'apple-touch-icon.png');
    if (fs.existsSync(iconPath)) {
      const buffer = fs.readFileSync(iconPath);
      return buffer.toString('base64');
    }
  } catch (e) {
    console.warn('Could not read default apple-touch-icon.png:', e);
  }
  return '';
}

function buildWebClipPayload(data: {
  title: string;
  url: string;
  iconBase64?: string;
  fullScreen?: boolean;
  isRemovable?: boolean;
  organization?: string;
}) {
  const payloadUUID = generateUUID();
  const topUUID = generateUUID();
  const title = escapeXml(data.title || 'App Shortcut');
  const url = escapeXml(data.url || 'https://bishalcodes.com');
  const organization = escapeXml(data.organization || 'Bishal Codes');
  const fullScreen = data.fullScreen !== false;
  const isRemovable = data.isRemovable !== false;

  let base64Icon = data.iconBase64;
  if (!base64Icon) {
    base64Icon = getDefaultIconBase64();
  }

  let iconXml = '';
  if (base64Icon) {
    const cleanBase64 = base64Icon.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    iconXml = `
            <key>Icon</key>
            <data>${cleanBase64}</data>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <${fullScreen}/>
            <key>IsRemovable</key>
            <${isRemovable}/>
            <key>Label</key>
            <string>${title}</string>
            <key>PayloadDescription</key>
            <string>Configures Web Clip shortcut for ${title}</string>
            <key>PayloadDisplayName</key>
            <string>${title} Shortcut</string>
            <key>PayloadIdentifier</key>
            <string>com.bishalcodes.webclip.${payloadUUID.substring(0, 8)}</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>${payloadUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>URL</key>
            <string>${url}</string>${iconXml}
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>${title}</string>
    <key>PayloadIdentifier</key>
    <string>com.bishalcodes.profile.${topUUID.substring(0, 8)}</string>
    <key>PayloadOrganization</key>
    <string>${organization}</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${topUUID}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;
}

function buildDnsPayload(data: {
  title: string;
  dnsProvider?: string;
  serverUrl?: string;
  organization?: string;
}) {
  const payloadUUID = generateUUID();
  const topUUID = generateUUID();
  const title = escapeXml(data.title || 'Secure DNS Profile');
  const organization = escapeXml(data.organization || 'Bishal Codes');
  const provider = data.dnsProvider || 'cloudflare';

  let dohUrl = 'https://1.1.1.1/dns-query';
  let providerName = 'Cloudflare 1.1.1.1 DNS';

  if (provider === 'nextdns' && data.serverUrl) {
    dohUrl = data.serverUrl;
    providerName = 'NextDNS Custom';
  } else if (provider === 'adguard') {
    dohUrl = 'https://dns.adguard-dns.com/dns-query';
    providerName = 'AdGuard DNS (Ad Blocking)';
  } else if (provider === 'quad9') {
    dohUrl = 'https://dns.quad9.net/dns-query';
    providerName = 'Quad9 Secure DNS';
  } else if (provider === 'custom' && data.serverUrl) {
    dohUrl = data.serverUrl;
    providerName = data.title || 'Custom Encrypted DNS';
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerURL</key>
                <string>${escapeXml(dohUrl)}</string>
            </dict>
            <key>PayloadDescription</key>
            <string>Configures Encrypted DNS (${providerName})</string>
            <key>PayloadDisplayName</key>
            <string>${escapeXml(providerName)}</string>
            <key>PayloadIdentifier</key>
            <string>com.bishalcodes.dns.${payloadUUID.substring(0, 8)}</string>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadUUID</key>
            <string>${payloadUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>${title}</string>
    <key>PayloadIdentifier</key>
    <string>com.bishalcodes.profile.dns.${topUUID.substring(0, 8)}</string>
    <key>PayloadOrganization</key>
    <string>${organization}</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${topUUID}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;
}

async function handleProfileRequest(params: {
  type?: string;
  title?: string;
  url?: string;
  iconBase64?: string;
  fullScreen?: boolean;
  isRemovable?: boolean;
  dnsProvider?: string;
  serverUrl?: string;
  organization?: string;
  customXml?: string;
}) {
  const profileType = params.type || 'webclip';
  let xmlContent = '';
  let filename = (params.title || 'profile').toLowerCase().replace(/[^a-z0-9]/g, '_') + '.mobileconfig';

  if (profileType === 'custom' && params.customXml) {
    xmlContent = params.customXml;
  } else if (profileType === 'dns') {
    xmlContent = buildDnsPayload({
      title: params.title || 'Encrypted DNS Profile',
      dnsProvider: params.dnsProvider,
      serverUrl: params.serverUrl,
      organization: params.organization,
    });
  } else {
    xmlContent = buildWebClipPayload({
      title: params.title || 'Bishal Codes App',
      url: params.url || 'https://bishalcodes.com',
      iconBase64: params.iconBase64,
      fullScreen: params.fullScreen !== false,
      isRemovable: params.isRemovable !== false,
      organization: params.organization,
    });
  }

  return new NextResponse(xmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-apple-aspen-config',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = {
    type: searchParams.get('type') || 'webclip',
    title: searchParams.get('title') || 'Bishal Codes App',
    url: searchParams.get('url') || 'https://bishalcodes.com',
    fullScreen: searchParams.get('fullScreen') !== 'false',
    isRemovable: searchParams.get('isRemovable') !== 'false',
    dnsProvider: searchParams.get('dnsProvider') || 'cloudflare',
    serverUrl: searchParams.get('serverUrl') || '',
    organization: searchParams.get('organization') || 'Bishal Codes',
  };

  return handleProfileRequest(params);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return handleProfileRequest(body);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload in profile request' },
      { status: 400 }
    );
  }
}
