import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import crypto from 'crypto';

const SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'edit_pdf.py');

function runPython(args: object, operation: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const argsJson = JSON.stringify(args).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const cmd = `python "${SCRIPT_PATH}" ${operation} "${argsJson}"`;
    exec(cmd, { maxBuffer: 100 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        try {
          const lastLine = stdout.trim().split('\n').pop() || '{}';
          resolve(JSON.parse(lastLine));
        } catch (err: any) {
          reject(new Error(`Failed to parse Python output: ${err.message}`));
        }
      }
    });
  });
}

// GET page info, dimensions, background images, and text blocks
export async function PUT(request: NextRequest) {
  const scratchDir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const uniqueId = crypto.randomBytes(8).toString('hex');
  const tempPdfPath = path.join(scratchDir, `edit_info_${uniqueId}.pdf`);

  try {
    const body = await request.json();
    const { pdf } = body;

    if (!pdf) {
      return NextResponse.json({ error: 'Base64 PDF data is required.' }, { status: 400 });
    }

    const base64Data = pdf.replace(/^data:application\/pdf;base64,/, '');
    await fs.promises.writeFile(tempPdfPath, Buffer.from(base64Data, 'base64'));

    const info = await runPython({ pdf_path: tempPdfPath, scratch_dir: scratchDir }, 'info');

    fs.promises.unlink(tempPdfPath).catch(() => {});
    return NextResponse.json(info);

  } catch (error: any) {
    try { fs.unlinkSync(tempPdfPath); } catch {}
    console.error('Edit PDF info error:', error);
    return NextResponse.json({ error: error.message || 'Failed to read PDF pages.' }, { status: 500 });
  }
}

// POST apply edits and generate edited PDF
export async function POST(request: NextRequest) {
  const scratchDir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const uniqueId = crypto.randomBytes(8).toString('hex');
  const tempPdfPath = path.join(scratchDir, `edit_input_${uniqueId}.pdf`);
  const outputPdfPath = path.join(scratchDir, `edit_output_${uniqueId}.pdf`);

  try {
    const body = await request.json();
    const { pdf, filename, edits } = body;

    if (!pdf || !edits) {
      return NextResponse.json({ error: 'PDF data and edit instructions are required.' }, { status: 400 });
    }

    const base64Data = pdf.replace(/^data:application\/pdf;base64,/, '');
    await fs.promises.writeFile(tempPdfPath, Buffer.from(base64Data, 'base64'));

    const result = await runPython({
      pdf_path: tempPdfPath,
      edits: edits,
      output_pdf_path: outputPdfPath
    }, 'edit');

    const resultPath: string = result.output_pdf_path || outputPdfPath;

    if (!fs.existsSync(resultPath)) {
      throw new Error('Edited PDF could not be generated.');
    }

    const resultBuffer = await fs.promises.readFile(resultPath);
    const baseName = (filename || 'document').replace(/\.pdf$/i, '');
    const downloadName = `${baseName}_edited.pdf`;

    fs.promises.unlink(tempPdfPath).catch(() => {});
    fs.promises.unlink(resultPath).catch(() => {});

    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
      },
    });

  } catch (error: any) {
    try { fs.unlinkSync(tempPdfPath); } catch {}
    try { fs.unlinkSync(outputPdfPath); } catch {}
    console.error('Edit PDF POST error:', error);
    return NextResponse.json({ error: error.message || 'PDF editing failed.' }, { status: 500 });
  }
}
