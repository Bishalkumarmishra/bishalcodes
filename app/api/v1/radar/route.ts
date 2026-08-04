import { NextResponse } from 'next/server';

interface RadarDevice {
  id: string;
  name: string;
  platform: 'android_app' | 'ios_web' | 'android_web' | 'desktop_web';
  ip?: string;
  port?: number;
  status: 'active' | 'receiving' | 'sending';
  lastSeen: number;
}

interface PairRequest {
  id: string;
  fromId: string;
  fromName: string;
  targetId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

interface DirectFilePayload {
  id: string;
  senderId: string;
  senderName: string;
  targetId: string;
  fileName: string;
  fileSize: number;
  fileData: string; // Base64 data string
  timestamp: number;
}

let activeDevices: Map<string, RadarDevice> = new Map();
let pairRequests: Map<string, PairRequest> = new Map();
let directFiles: Map<string, DirectFilePayload> = new Map();

function cleanupStaleDevices() {
  const now = Date.now();
  for (const [id, device] of activeDevices.entries()) {
    if (now - device.lastSeen > 10000) {
      activeDevices.delete(id);
    }
  }
  for (const [reqId, req] of pairRequests.entries()) {
    if (now - req.timestamp > 30000) {
      pairRequests.delete(reqId);
    }
  }
  for (const [fId, file] of directFiles.entries()) {
    if (now - file.timestamp > 60000) {
      directFiles.delete(fId);
    }
  }
}

export async function GET() {
  cleanupStaleDevices();
  return NextResponse.json({
    success: true,
    count: activeDevices.size,
    devices: Array.from(activeDevices.values())
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, name, platform, ip, port, status, targetId, requestId, responseStatus, fileName, fileSize, fileData } = body;

    cleanupStaleDevices();

    // 1. Connection Request Action (Device A wants to pair with Device B)
    if (action === 'connect_request') {
      if (!id || !targetId) {
        return NextResponse.json({ error: 'Sender and Target IDs required' }, { status: 400 });
      }
      const pairId = 'pair-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const newPair: PairRequest = {
        id: pairId,
        fromId: id,
        fromName: name || 'Remote Device',
        targetId: targetId,
        status: 'pending',
        timestamp: Date.now()
      };
      pairRequests.set(pairId, newPair);

      return NextResponse.json({
        success: true,
        message: 'Connection request sent to target device',
        pairRequest: newPair
      });
    }

    // 2. Respond Request Action (Device B accepts or declines Device A's request)
    if (action === 'respond_request') {
      if (!requestId || !responseStatus) {
        return NextResponse.json({ error: 'Request ID and Status required' }, { status: 400 });
      }
      const existingReq = pairRequests.get(requestId);
      if (existingReq) {
        existingReq.status = responseStatus;
        pairRequests.set(requestId, existingReq);
      }
      return NextResponse.json({
        success: true,
        message: `Connection request ${responseStatus}`,
        pairRequest: existingReq
      });
    }

    // 3. Check Pair Status for Sender Device A
    if (action === 'check_pair_status') {
      const mySentRequests = Array.from(pairRequests.values()).filter(r => r.fromId === id);
      return NextResponse.json({
        success: true,
        sentRequests: mySentRequests
      });
    }

    // 4. Send Direct File Action (No Link / No QR Code!)
    if (action === 'send_direct_file') {
      if (!targetId || !fileName || !fileData) {
        return NextResponse.json({ error: 'Target ID, File Name, and Data required' }, { status: 400 });
      }
      const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const payload: DirectFilePayload = {
        id: fileId,
        senderId: id,
        senderName: name || 'Paired Device',
        targetId,
        fileName,
        fileSize: fileSize || 0,
        fileData,
        timestamp: Date.now()
      };
      directFiles.set(fileId, payload);

      return NextResponse.json({
        success: true,
        message: 'Direct file payload buffered for recipient',
        fileId
      });
    }

    // Standard Heartbeat Registration
    if (!id || !name) {
      return NextResponse.json({ error: 'Device ID and Name are required' }, { status: 400 });
    }

    const device: RadarDevice = {
      id,
      name,
      platform: platform || 'desktop_web',
      ip: ip || '127.0.0.1',
      port: port || 12345,
      status: status || 'active',
      lastSeen: Date.now()
    };

    activeDevices.set(id, device);

    // Fetch incoming pair requests targeting THIS device
    const incomingRequests = Array.from(pairRequests.values()).filter(
      r => r.targetId === id && r.status === 'pending'
    );

    // Fetch incoming direct files targeting THIS device
    const incomingFiles = Array.from(directFiles.values()).filter(r => r.targetId === id);
    // Remove retrieved files from buffer
    for (const f of incomingFiles) {
      directFiles.delete(f.id);
    }

    return NextResponse.json({
      success: true,
      registeredDevice: device,
      activeDevices: Array.from(activeDevices.values()),
      incomingRequests,
      incomingFiles
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
