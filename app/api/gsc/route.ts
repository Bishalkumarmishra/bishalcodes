import { NextResponse } from 'next/server';
import crypto from 'crypto';

interface ServiceAccountCreds {
  client_email: string;
  private_key: string;
}

// Base64URL encoder helper
function base64UrlEncode(str: string | Buffer): string {
  const base64 = typeof str === 'string' ? Buffer.from(str).toString('base64') : str.toString('base64');
  return base64
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Generate Google Access Token using Node built-in crypto
async function getGoogleAccessToken(creds: ServiceAccountCreds): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/indexing https://www.googleapis.com/auth/webmasters',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Fix private key newlines if escaped
  let privateKey = creds.private_key;
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(privateKey);
  const jwt = `${unsignedToken}.${base64UrlEncode(signature)}`;

  // Exchange JWT for Google OAuth Access Token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google Authentication Failed (${tokenRes.status}): ${errText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

// Extract credentials from environment or request body
function resolveCredentials(bodyCreds?: Partial<ServiceAccountCreds>): ServiceAccountCreds | null {
  if (bodyCreds?.client_email && bodyCreds?.private_key) {
    return {
      client_email: bodyCreds.client_email.trim(),
      private_key: bodyCreds.private_key,
    };
  }

  // Check GSC_SERVICE_ACCOUNT_KEY env (JSON string)
  if (process.env.GSC_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_KEY);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key,
        };
      }
    } catch {
      // Ignore JSON parse error and fallback
    }
  }

  // Check separate ENV vars
  if (process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY) {
    return {
      client_email: process.env.GSC_CLIENT_EMAIL.trim(),
      private_key: process.env.GSC_PRIVATE_KEY,
    };
  }

  // Project fallback credentials
  const defaultClientEmail = "gsc-indexer@gen-lang-client-0804897713.iam.gserviceaccount.com";
  const defaultPrivateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCixHXkd3PIJ2HH\nRfPtDsDtUifpEiZ15Ntr9OvWoXWxPOA6nsDvKRbioPLgBrtHSL9N7vdFQQ8GL8XE\n7Gug9ROF8rcZXDFe5nKqkUbNopsTwo6OCxwtCt8yY8tPMEirA2Hqg8ejoBNEd7Po\n1AMfPCpLRNvG6li/zsn7KVIYpnZrm1N9xnkfRQEkSSuMXiS5yXvjhUH4Y2/G31Sv\nYQSIokGJIRuDs/HprzTAfcuLEnhRzud0PMi2p/m+otVDKv/TvUO1ifawSRVDoHGG\nLYpzbLB0UmtFjPR1b5KKfQIU3Youoc6IE+he34/RoMSOKiHIAkCbeiS6tPJTLV5E\n9mpBe/hHAgMBAAECggEARDq2cJ7iGfToN/BK4ARfOxxFPp4tIR5eHFL+yWnFPBaY\np/oERjyjKzzskpw/xRHpn3GclZtAAQfljzbLpx0UogGsXyUWTQGs73MWivyupQnZ\nWBGwLfFwvl62yusiiw1P7k5vUVe4u+qxr9evt1gxInwq5Kc3rK+yW2Zm045z9Ybr\nrKmazvlUel7w991Yi8WUN97ioO2Owr82OZhwC/oXqxNFgb/bW3yzBPydYCpj8eGw\ndP1QzqUZh/76UnpVQxIDS5g5Eg4z7B/A9xgvwletQajyDaBJcu3EcUtzsq1tVTK2\nijssdiRcUzpi8EiyodFLKK2VaBWWvrY1mJxbdsR4gQKBgQDTI/9vSJDOxul0UH1B\ntrZziqOIDbRc0BMVHMdOOcsrQP6SHoK+LDI1FZvseonEVRauiO7saBoXxEkwydsW\n/NYG4Fp3al+9t3rJY5ElugyTXA40b0GeR00vlPtj2WS85S4iJGmT1D1ksp/bdwlC\nWRiF6lGCjhaK0rTWWcmCPvUjWwKBgQDFWW4bWitLFJUi0ZZ7wHIB9bQBL9z/ukiD\nCBn+umTYNYt+6WQ4Z9TUtjeUi8PbPAiQYIPtyfOj1NjzLwSxQBkgOnbfC/51RUqo\n90mUoqSzvsAUVZn+eyZ+GnvBvCHgy1Cs3XY7oUnhP0uM/3ZtbMn/7eiwSSSaTc5e\n7Yry3WbuhQKBgFkvtH8qVNizVvul4DL43frSTh9zQoON9PGPFXUqnnJn4uCP+MQh\n4RdhSFrMrBL9qjYRa3L6ykLNy+jK6zu7kyCWdkBI86YssbYN08ru2s8ILIvjjwEv\ntx/pO4NC2fWcjS8o2Fv0Y/Z8KWBH2OZowh4XC1UtdcIwHOkKRj85Hs1PAoGBAL/V\n8PxRqGfxeA9CoP9m0OwqxXGp7y//CuGkjHBbDBBH7HPPuAZEmFS1VE3nltmT/9co\nmtYZS+bjzoiGGg+a+VGkw0yKQi4Iz0x0JWiAuY2oTNr3YxxG5eILKGXo1R3JRYDk\nPjw0yrZUasKCycIQ0EMiJuDGGPiNzZ/lVP5ETfxpAoGABt2Zo2ZqrqESNkjGvxtb\n2Ux2JJmxQHBqlUaWFswnh9ZM8zVFQSBoopQP9LgKkA+xtMzIQmQ+wS/x1wS8sAcO\niWIbPPGR6/Q21lRQDGMEyNUVTGwfmOniBya6nPHR33hvWhK2/qi9XWtBRsDmrmka\nBbSjWmxZDwbBkU6giTn5beU=\n-----END PRIVATE KEY-----\n";

  return {
    client_email: defaultClientEmail,
    private_key: defaultPrivateKey,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, urls, url, credentials, notificationType = 'URL_UPDATED' } = body;

    const creds = resolveCredentials(credentials);

    if (!creds) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Service Account credentials. Please enter client_email and private_key in Admin Panel or set GSC_SERVICE_ACCOUNT_KEY environment variable.',
        },
        { status: 400 }
      );
    }

    // 1. Test Credentials Action
    if (action === 'test_credentials') {
      const token = await getGoogleAccessToken(creds);
      return NextResponse.json({
        success: true,
        message: 'Google Service Account authenticated successfully!',
        client_email: creds.client_email,
        hasToken: !!token,
      });
    }

    // 2. Publish URL / Batch Publish Action
    if (action === 'publish_url' || action === 'batch_publish') {
      const targetUrls: string[] = Array.isArray(urls)
        ? urls
        : url
        ? [url]
        : [];

      if (targetUrls.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No URLs specified for indexing submission.' },
          { status: 400 }
        );
      }

      const accessToken = await getGoogleAccessToken(creds);
      const results: Array<{ url: string; success: boolean; status: number; data?: any; error?: string }> = [];

      // Process requests sequentially
      for (const targetUrl of targetUrls) {
        try {
          const apiRes = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              url: targetUrl,
              type: notificationType,
            }),
          });

          const data = await apiRes.json();

          if (apiRes.ok) {
            results.push({
              url: targetUrl,
              success: true,
              status: apiRes.status,
              data: data.urlNotificationMetadata || data,
            });
          } else {
            results.push({
              url: targetUrl,
              success: false,
              status: apiRes.status,
              error: data.error?.message || JSON.stringify(data),
            });
          }
        } catch (err: any) {
          results.push({
            url: targetUrl,
            success: false,
            status: 500,
            error: err.message || 'Network request failed',
          });
        }
      }

      const successfulCount = results.filter((r) => r.success).length;

      return NextResponse.json({
        success: successfulCount > 0,
        summary: `Submitted ${targetUrls.length} URLs. ${successfulCount} succeeded, ${targetUrls.length - successfulCount} failed.`,
        results,
      });
    }

    // 3. Get Indexing Status Action
    if (action === 'get_status') {
      if (!url) {
        return NextResponse.json(
          { success: false, error: 'URL is required to fetch status.' },
          { status: 400 }
        );
      }

      const accessToken = await getGoogleAccessToken(creds);
      const encodedUrl = encodeURIComponent(url);
      const statusRes = await fetch(
        `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodedUrl}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await statusRes.json();
      return NextResponse.json({
        success: statusRes.ok,
        url,
        data,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Supported: test_credentials, publish_url, batch_publish, get_status' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Google Indexing API Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'An internal server error occurred while connecting to Google Indexing API.',
      },
      { status: 500 }
    );
  }
}
