import React, { useState } from 'react';

interface GuideData {
  title: string;
  subtitle: string;
  sections: Array<{
    title: string;
    icon: string;
    content: string | string[];
  }>;
  faqs: Array<{
    q: string;
    a: string;
  }>;
}

const GUIDES_DATABASE: Record<string, GuideData> = {
  'date-converter': {
    title: "Complete Guide: Nepali Date Converter (AD to BS & BS to AD)",
    subtitle: "Understand the science and calculation behind Bikram Sambat (BS) and Gregorian (AD) calendars. Learn how to convert dates offline with high precision.",
    sections: [
      {
        title: "Understanding the Nepali Calendar System",
        icon: "🗓️",
        content: [
          "Bikram Sambat (BS) is the official solar calendar of Nepal, deeply rooted in historical Hindu traditions. Unlike the Gregorian calendar, which uses fixed month lengths (except for leap years), the Bikram Sambat system features month durations that fluctuate from 29 to 32 days. These variances are determined dynamically by the exact time it takes for the sun to cross into different zodiac constellations (Sankranti).",
          "Because of this celestial tracking system, there is no static formula (such as adding a simple number of days) that can convert dates between AD and BS. A comprehensive historical lookup table, mapping the exact length of every month for every year, is required to align these two distinct timelines correctly.",
          "Bikram Sambat is approximately 56 years and 8.5 months ahead of the Gregorian calendar. The Nepali New Year always begins on Baisakh 1, which typically corresponds to April 13 or 14 in the Gregorian (AD) calendar."
        ]
      },
      {
        title: "How to Convert Dates Step-by-Step",
        icon: "⚡",
        content: [
          "To convert Gregorian (AD) to Nepali (BS): Choose the 'English (AD) to Nepali (BS)' option. Input the specific English year, month, and day. The converter maps the date against its internal lookup table, determines the exact number of days offset from a reference date, and outputs the Nepali date instantly.",
          "To convert Nepali (BS) to Gregorian (AD): Select 'Nepali (BS) to English (AD)' mode. Input the Nepali Year (range 2000 to 2095), Month (Baisakh through Chaitra), and Day. The calendar engine calculates the corresponding Gregorian date and displays it with the day of the week.",
          "Our system runs entirely on the client side. By caching the month-length databases in your browser memory, all date calculations and conversions occur instantly and completely offline."
        ]
      }
    ],
    faqs: [
      {
        q: "What is the relation between Bikram Sambat (BS) and Gregorian (AD) calendars?",
        a: "Bikram Sambat is approximately 56.7 years ahead of the Gregorian calendar. The exact start of the Nepali year is based on solar transit and starts on Baisakh 1, typically falling around April 13-14 AD."
      },
      {
        q: "How many months are in the Nepali Calendar?",
        a: "There are 12 months in the Nepali calendar: Baisakh, Jestha, Ashadh, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, and Chaitra. Month lengths range from 29 to 32 days depending on the solar cycle."
      },
      {
        q: "Is leap year calculation different in Bikram Sambat?",
        a: "Yes. Gregorian leap years occur strictly every 4 years. In Bikram Sambat, the solar transit is mathematically calculated year-by-year based on astronomical coordinates, meaning the length of months can differ without a simple 4-year cycle."
      },
      {
        q: "How accurate is this online date converter?",
        a: "This converter uses precise mathematical mapping verified against standard astronomical tables. It is fully accurate for any conversions between BS 2000 to BS 2095."
      }
    ]
  },
  'file-transfer': {
    title: "P2P File Transfer Guide & WebRTC Technology",
    subtitle: "Discover how zero-knowledge direct browser sharing works, why peer-to-peer WebRTC file transfers are highly secure, and how you can share files up to 100 GB.",
    sections: [
      {
        title: "How WebRTC P2P Sharing Works",
        icon: "🚀",
        content: [
          "Traditional file sharing sites require you to first upload a file to their central cloud servers, wait for the upload to complete, and then send a link to the receiver. The receiver then has to download the file from that cloud storage.",
          "Bishal Transfer uses WebRTC (Web Real-Time Communication) technology to establish a direct, peer-to-peer data tunnel between your browser and the recipient's browser. Files are compressed client-side and stream directly from your device to theirs.",
          "Because it bypasses the cloud entirely, there is no waiting time for uploads, and the speed is only limited by the physical bandwidth of the two connections."
        ]
      },
      {
        title: "Zero-Knowledge & Absolute Privacy",
        icon: "🔒",
        content: [
          "When you send sensitive documents, designs, or personal data, the last thing you want is for a copy to reside on a third-party server.",
          "Our WebRTC data channels are encrypted end-to-end using standard DTLS (Datagram Transport Layer Security) and SRTP (Secure Real-time Transport Protocol). The signaling server only handles the initial discovery handshake and is completely blind to your file data.",
          "Once connected, the transfer is direct, private, and leaves no digital footprint on the internet."
        ]
      }
    ],
    faqs: [
      {
        q: "Do I need to keep the sender browser tab open during transfer?",
        a: "Yes. Since WebRTC relies on a direct peer-to-peer link between the two browsers, you must keep the sender tab open and active until the receiver finishes downloading the files."
      },
      {
        q: "What is the maximum file size limit?",
        a: "You can send single files or entire folders up to 100 GB. For folders, the files are zipped dynamically in your browser using local client-side workers before transmission."
      },
      {
        q: "Are my files stored on your server?",
        a: "No, files are never stored on any server. The data streams directly from the sender's hard drive to the receiver's memory/cache, ensuring total file privacy."
      },
      {
        q: "What ports or setup are required for WebRTC?",
        a: "No downloads, extensions, or registration are needed. WebRTC runs natively in all modern web browsers (Chrome, Safari, Firefox, Edge) and works behind NAT firewalls using STUN/TURN servers."
      }
    ]
  },
  'currency-converter': {
    title: "Live Currency Converter & Exchange Rates Guide",
    subtitle: "Learn how global currency markets compute exchange rates, what mid-market interbank rates are, and how online rates compare to bank remittances.",
    sections: [
      {
        title: "Understanding Live Interbank Rates",
        icon: "📈",
        content: [
          "The exchange rates displayed in this tool are fetched dynamically every hour from Yahoo Finance, reflecting the mid-market interbank rate. This is the real-time wholesale rate at which global banks trade currencies with each other.",
          "Online systems like Google Finance, Yahoo Finance, and search engine widgets display these mid-market rates as they represent the most accurate, objective value of a currency pair in the global market.",
          "By monitoring these interbank markets, you can see live trends for pairs like USD to NPR, USD to INR, and EUR to USD as they fluctuate throughout the trading day."
        ]
      },
      {
        title: "Why Do Bank & Remittance Rates Differ?",
        icon: "💸",
        content: [
          "When you go to a retail bank, an airport currency exchange booth, or send money abroad, you will notice their rate is slightly lower than the live online rate.",
          "This is because retail institutions add a service fee, markup, or conversion commission to the wholesale rate. They buy currencies at a lower rate and sell them at a higher rate to cover operational overhead.",
          "To ensure you get the best deal, compare the remittance agent's final payout value against the live mid-market rate displayed in our tool before initiating a transfer."
        ]
      }
    ],
    faqs: [
      {
        q: "What is a mid-market exchange rate?",
        a: "The mid-market rate is the real exchange rate at which banks buy and sell currency from each other. It is the midpoint between the buy and sell prices on global markets."
      },
      {
        q: "How often are these live exchange rates updated?",
        a: "Our currency converter tool pulls live currency rate feeds every hour to ensure accuracy for top converted pairs like USD/NPR, USD/INR, and USD/EUR."
      },
      {
        q: "Is there any conversion fee or commission on this tool?",
        a: "No. This is a completely free developer utility tool provided by Bishal Codes. There are no fees, ads, or commissions added to the calculations."
      },
      {
        q: "Can I use this tool to lock in a remittance transfer rate?",
        a: "No, this tool provides real-time market data for reference purposes. Remittance agencies and banks enforce their own operational rates and conversion metrics."
      }
    ]
  },
  'currency-calculator': {
    title: "Multi-Currency Calculator & Conversion Ledger",
    subtitle: "Perform advanced arithmetic calculations on multiple currencies simultaneously with real-time rate integration. Evaluate cross-currency transactions instantly.",
    sections: [
      {
        title: "What is a Multi-Currency Calculator?",
        icon: "🧮",
        content: [
          "A multi-currency calculator allows you to perform arithmetic expressions featuring different currency denominations (e.g. calculating 100 USD + 50 EUR - 12000 NPR) in a single equation. The calculator resolves the exchange rates relative to your base target currency in real-time, displaying a step-by-step breakdown ledger.",
          "This is particularly useful for freelance developers, business owners, and travelers who manage expenses in multiple currencies. Instead of manually converting each item and then summing them up, this tool streamlines the math.",
          "The output is shown with complete decimal precision, which can then be rounded or copied as needed for invoicing or bookkeeping files."
        ]
      },
      {
        title: "How Equation Parsing Works",
        icon: "⚙️",
        content: [
          "Each numerical input is tied to a selected currency symbol. When you press compute, our parser maps the values, fetches the mid-market interbank rates from our live currency API, converts each component value, and aggregates them into the final desired total.",
          "The parser uses strict regex filters to extract numerical tokens and currency units, ensuring mathematical operators (+, -, *, /) follow standard arithmetic precedence rules.",
          "All conversions occur inside your browser memory. The live rates are updated hourly, matching the Yahoo Finance interbank exchange values."
        ]
      }
    ],
    faqs: [
      {
        q: "Can I perform direct math formulas with multiple currencies?",
        a: "Yes. You can input mathematical operators (+, -, *, /) along with different currency symbols to calculate multi-currency transactions dynamically."
      },
      {
        q: "Where do the exchange rates come from?",
        a: "The exchange rates are pulled dynamically every hour from live interbank market feeds. This guarantees the highest accuracy when calculating transactions across different currencies."
      },
      {
        q: "Can I choose which base currency the final sum is calculated in?",
        a: "Yes. You can change the target output currency from the drop-down selector. The calculator will immediately re-run the conversions and display the total converted value."
      },
      {
        q: "Does the calculator work offline?",
        a: "The arithmetic engine operates offline, but the live currency exchange rates require an initial network connection to download the latest rates from the market."
      }
    ]
  },
  'ai-summarizer': {
    title: "AI Document Summarizer & PDF Abstract Builder",
    subtitle: "Generate instant bulleted highlights, core outlines, and printable summaries of large PDF files and scanned reports using secure, local parsing.",
    sections: [
      {
        title: "How AI PDF Summarization Works",
        icon: "🧠",
        content: [
          "When you select a PDF, the system uses browser-based engines to extract the raw text elements client-side. The compiled text structure is then processed through safe, encrypted API channels to Google Gemini 1.5 Flash to draft dynamic abstracts.",
          "This approach guarantees high performance even for massive documents. By extracting text layers in the browser, only the text payload is processed, making it faster and saving bandwidth.",
          "The resulting summary includes major takeaways, key terms, and detailed lists, presented in a clean, legible design."
        ]
      },
      {
        title: "Data Confidentiality & Local Execution",
        icon: "🔒",
        content: [
          "Your uploaded documents are processed securely. The PDF extraction runs 100% locally in your browser cache memory using PDF.js. Unlike traditional tools, your PDF files are never uploaded to our servers or saved permanently.",
          "Only the extracted text blocks are sent via secure API requests to the LLM backend for summarization, meaning the binary file itself never leaves your device.",
          "This local sandbox architecture is ideal for processing internal reports, notes, assignments, and research drafts securely."
        ]
      }
    ],
    faqs: [
      {
        q: "Is there a limit to the PDF file size I can upload?",
        a: "We support PDF documents up to 50MB. Extraction and processing speeds depend on your internet speed and the number of pages inside the document."
      },
      {
        q: "Are my documents saved on the server for training models?",
        a: "No. The parsed text is sent via secure channels to the AI API solely for real-time summary generation. None of your data is saved or used to train public machine learning models."
      },
      {
        q: "Does this summarizer support scanned PDFs?",
        a: "If the PDF contains embedded text, it will be summarized immediately. For scanned files without selectable text layers, we recommend running our AI OCR tool first to extract the content."
      },
      {
        q: "Can I copy or export the generated summary?",
        a: "Yes. You can copy the text to your clipboard with a single click, or print the summary layout directly from your browser."
      }
    ]
  },
  'translator': {
    title: "Interactive Language Translator & Voice Synthesizer",
    subtitle: "Translate text instantly between English, Nepali, Spanish, Hindi, and 100+ other major global languages with accurate local pronunciation.",
    sections: [
      {
        title: "How the Translation Engine Works",
        icon: "🌐",
        content: [
          "The Language Translator connects directly with high-performance machine translation models. It processes input text structures, auto-detects original languages, and outputs localized translations in real-time.",
          "The parser uses advanced neural networks to map sentences, maintaining grammatical structure, tone, and contextual meaning across different languages.",
          "Whether you need to translate simple phrases or complete documents, the translator handles characters and structures seamlessly."
        ]
      },
      {
        title: "Voice Output & Text-To-Speech Pronunciation",
        icon: "🔊",
        content: [
          "To help you learn pronunciations, the translator integrates local browser speech synthesis APIs. Click the sound speaker icon on any translation box to hear standard, natural-sounding audio read aloud.",
          "The speech engine automatically detects the language and matches it with the best available voice locale files installed on your operating system (such as iOS, Android, or Windows native voice packages).",
          "This makes it an excellent tool for learning vocabulary, checking pronunciation accuracy, or listening to text read aloud."
        ]
      }
    ],
    faqs: [
      {
        q: "How accurate is the language translation?",
        a: "The tool leverages advanced neural translation algorithms, ensuring high accuracy for conversational and technical texts. However, contextual idioms may vary."
      },
      {
        q: "Is text-to-speech audio supported in Nepali?",
        a: "Yes. The speech synthesizer auto-detects available voice files on your operating system and reads Nepali text utilizing local browser voice scripts."
      },
      {
        q: "What is the character limit for translations?",
        a: "You can translate up to 4,000 characters per request, making it ideal for converting letters, emails, code comments, or general reference articles."
      },
      {
        q: "Does this translator store the translation logs?",
        a: "No, all translation tasks are run dynamically on demand. We do not store, monitor, or track the text content you choose to translate."
      }
    ]
  },
  'pdf-to-image': {
    title: "High-Resolution PDF to Image Converter",
    subtitle: "Extract pages from any PDF document and save them as high-quality JPG or PNG images instantly without software installation.",
    sections: [
      {
        title: "Direct Client-Side Extraction",
        icon: "🖼️",
        content: [
          "Our converter processes PDF files 100% inside your browser using canvas rendering. Each page is drawn as a high-density image frame, allowing you to preview and download individual pages or export them all together in a single zip archive.",
          "By avoiding server uploads, files are converted immediately. You don't have to wait for large documents to upload, and your processing speed is limited only by your computer's performance.",
          "This local method is ideal for converting sensitive documents like ID cards, tax forms, and reports safely."
        ]
      },
      {
        title: "Resolution Adjustments & Compression",
        icon: "⚙️",
        content: [
          "Select between Standard or High-Resolution (HD) output. Standard rendering is perfect for quick web sharing, while High-Resolution mode preserves maximum legibility for small texts and graphical tables.",
          "You can also select your preferred output format: JPG for optimized file sizes or PNG for lossless image quality with alpha transparency support.",
          "The compiled image files are packed into a single organized ZIP archive using client-side zipping libraries, ready for instant download."
        ]
      }
    ],
    faqs: [
      {
        q: "Are my PDF files uploaded to a server to extract images?",
        a: "No. The rendering is done locally in your browser sandbox using PDF.js. Your document data never leaves your computer."
      },
      {
        q: "What image formats are supported for export?",
        a: "You can download pages as high-resolution PNG or standard compressed JPG format images."
      },
      {
        q: "Is there a limit to the number of PDF pages I can convert?",
        a: "No limit. Since all rendering is executed on your local machine, you can process documents of any length without server timeout errors."
      },
      {
        q: "Can I select specific pages to convert instead of the whole file?",
        a: "Currently, the tool converts all pages in the PDF document into images and packages them. You can extract individual images from the downloaded ZIP archive."
      }
    ]
  },
  'pdf-to-word': {
    title: "Sleek and Fast PDF to Word Converter",
    subtitle: "Convert PDF files into fully editable Microsoft Word DOCX files with native layout preservation and offline client-side OCR.",
    sections: [
      {
        title: "Native Layout Reconstruction",
        icon: "📄",
        content: [
          "Our offline tool reads the structural elements (such as vector lines, fonts, and text items) directly from your PDF and translates them into matching Word paragraph and style formats.",
          "Unlike standard screenshot converters that generate flat images, our tool preserves font styles, bold/italic weights, paragraph breaks, and text spacings, giving you a real editable document.",
          "This local method is lightning-fast and respects your data privacy since files are never uploaded to our servers."
        ]
      },
      {
        title: "Client-Side OCR Processing",
        icon: "🔍",
        content: [
          "If you upload scanned paper sheets or image-based PDFs, you can select the 'OCR Engine' option. This runs Optical Character Recognition directly in your browser sandbox.",
          "The OCR engine reads letters and lines, converts them into digital text strings, and packs them cleanly into DOCX paragraphs.",
          "This ensures that scanned text is fully searchable and editable inside Microsoft Word."
        ]
      }
    ],
    faqs: [
      {
        q: "Are my PDF documents uploaded to any external server?",
        a: "No. The entire conversion process (layout reconstruction and OCR engine) runs 100% locally in your browser sandbox. None of your data is ever uploaded or stored."
      },
      {
        q: "Will the formatting and layout be identical to the PDF?",
        a: "Our parser reconstructs headings, paragraphs, bold/italic text, and line breaks. While minor font offsets can occur depending on system fonts, the resulting text and images are fully editable."
      },
      {
        q: "Can I convert scanned PDFs?",
        a: "Yes. Simply choose the 'OCR Engine' setting. It will run high-performance optical character recognition on the pages to extract text."
      },
      {
        q: "What file format is downloaded?",
        a: "The tool generates a standard `.docx` document which is fully compatible with Microsoft Word, Google Docs, and LibreOffice."
      }
    ]
  },
  'word-to-pdf': {
    title: "High-Fidelity Word to PDF Converter",
    subtitle: "Convert Word documents (.docx, .doc) into high-fidelity PDF documents with exact layout, margin, and formatting preservation.",
    sections: [
      {
        title: "Exact Layout Preservation",
        icon: "📄",
        content: [
          "Our conversion engine reads the Word document styling, alignments, custom margins, and headers directly to compile them into matching PDF vector definitions.",
          "This guarantees that your document margins, page breaks, text justifications, and line spacings look exactly like they did in Microsoft Word.",
          "This local method is highly optimized, ensuring rapid processing without exposing your files to external security risks."
        ]
      },
      {
        title: "Rich Content Formatting Support",
        icon: "🎨",
        content: [
          "It supports complex tables, embedded images, dynamic header/footer labels, bulleted lists, and multiple column sections.",
          "Custom fonts and typography styles are dynamically mapped and embedded inside the output PDF document, ensuring universal display compatibility.",
          "Produces standard, search-optimized PDF files compliant with modern PDF readers."
        ]
      }
    ],
    faqs: [
      {
        q: "Are my Word files safe?",
        a: "Yes. The conversion engine runs on a secure environment where files are immediately deleted from storage after the conversion task completes. Your data is 100% private."
      },
      {
        q: "Will the PDF layout look exactly like my Word file?",
        a: "Yes. The conversion system maintains font choices, table styles, paragraph properties, alignments, headers, and image formatting to deliver an identical layout."
      },
      {
        q: "Is there a limit on Word file size?",
        a: "The system easily handles files up to 50MB. Large files may take a few additional seconds to compile layouts."
      },
      {
        q: "Does it support .doc format?",
        a: "Yes, it supports both modern Word (.docx) and legacy Word (.doc) document formats."
      }
    ]
  },
  'excel-to-pdf': {
    title: "High-Fidelity Excel to PDF Converter",
    subtitle: "Convert Excel spreadsheets (.xlsx, .xls) into high-fidelity PDF documents with exact layout, gridline, and chart preservation.",
    sections: [
      {
        title: "Exact Sheet Scaling Preservation",
        icon: "📊",
        content: [
          "Our conversion engine reads spreadsheet alignments, font choices, custom columns, and page break properties to compile them into PDF sheets.",
          "It maintains exact gridline alignments, merged cells, custom column widths, and cell background fills just as they appear in Microsoft Excel.",
          "This local processing is quick, secure, and preserves data privacy by converting files cleanly without third-party exposure."
        ]
      },
      {
        title: "Formula Representation & Charts Support",
        icon: "📈",
        content: [
          "Supports rendering calculated outputs, complex table cells, and multi-sheet workbooks.",
          "Embedded vector charts, graphs, and drawings are grouped and rasterized dynamically into high-resolution graphics, ensuring all page data is fully visible.",
          "Outputs compliant PDF documents ready for professional printing, sharing, or archiving."
        ]
      }
    ],
    faqs: [
      {
        q: "Are my Excel sheets safe?",
        a: "Yes. The backend processing environment executes the conversion and instantly deletes your uploaded spreadsheets. Your cell values and data remain 100% private."
      },
      {
        q: "Will my custom gridlines and formatting show up in the PDF?",
        a: "Yes. The conversion maps exact gridlines, merged headers, border widths, background color fills, and font configurations to render an identical layout."
      },
      {
        q: "Does it support multiple sheets in a workbook?",
        a: "Yes. The compiler loops through all worksheets in the Excel file and packages them sequentially into the final PDF."
      },
      {
        q: "Does it support legacy .xls format?",
        a: "Yes, it supports both modern Excel (.xlsx) and legacy Excel (.xls) formats."
      }
    ]
  },
  'pdf-to-excel': {
    title: "High-Performance PDF to Excel Converter",
    subtitle: "Convert PDF documents into formatted Microsoft Excel spreadsheets (.xlsx) with automated table and layout reconstruction.",
    sections: [
      {
        title: "Structure-Aware Table Extraction",
        icon: "📈",
        content: [
          "Our extraction engine parses individual PDF tables, identifies row/column cells, and maps them directly into native Excel grid definitions.",
          "Unlike screenshot tools, it parses numeric strings, headings, and columns as structured cell objects, so your calculations and data can be edited.",
          "Runs securely on a protected environment, instantly cleaning up all files post-processing."
        ]
      },
      {
        title: "Clean Gridlines & Auto-Fitting",
        icon: "📊",
        content: [
          "Automatically adjusts column widths to prevent clipped text, and enables print gridlines on every exported sheet.",
          "Preserves original numeric values, text justifications, and line breaks inside your spreadsheet cells.",
          "Includes text-page fallback extraction, writing page lines into clean sequential rows if no vector grids are present."
        ]
      }
    ],
    faqs: [
      {
        q: "Are my spreadsheets secure?",
        a: "Yes. All conversion processing is sandboxed, and your files are permanently deleted from server storage immediately after download."
      },
      {
        q: "Will the numbers remain editable?",
        a: "Yes. The text characters, strings, and numbers are extracted into actual cell text strings, allowing you to use Excel functions and formulas."
      },
      {
        q: "Does it support borderless tables?",
        a: "Yes. The parser recognizes table structures even if they do not have visible border lines by mapping character positions and spaces."
      },
      {
        q: "What format does it download?",
        a: "It generates standard Microsoft Excel open XML files (.xlsx) compatible with Excel, Google Sheets, and Numbers."
      }
    ]
  },
  'split-pdf': {
    title: "Professional PDF Splitter — Split Any PDF Instantly",
    subtitle: "Extract specific page ranges, split into fixed-size chunks, or separate every page into individual PDFs. Just like ilovepdf.",
    sections: [
      {
        title: "Three Powerful Split Modes",
        icon: "✂️",
        content: [
          "Range Mode: Define up to unlimited custom page ranges (e.g., pages 1–3, then 5–9) and extract each as its own PDF. Optionally merge all ranges into a single file.",
          "Fixed Mode: Split the PDF into chunks of N pages each — useful for breaking large reports into equal parts.",
          "Pages Mode: Extract every single page as its own individual PDF file, packaged into a downloadable ZIP archive."
        ]
      },
      {
        title: "Real-Time Page Thumbnails",
        icon: "🖼️",
        content: [
          "The page thumbnail preview system renders the actual PDF content so you can visually confirm your page selections before splitting.",
          "Selected pages are highlighted in red so you always see exactly what will be included in each output file.",
          "Thumbnails are generated server-side using PyMuPDF and delivered as base64 encoded images for instant display."
        ]
      }
    ],
    faqs: [
      {
        q: "Are my PDF files secure?",
        a: "Yes. All split processing runs in a sandboxed server environment. Your uploaded files are permanently deleted immediately after the split files are delivered."
      },
      {
        q: "Can I define multiple custom ranges?",
        a: "Yes. In Range → Custom mode, click 'Add Range' to define as many page ranges as you need. Each range becomes its own PDF file."
      },
      {
        q: "What happens when I split into every page?",
        a: "Each page is extracted as an individual PDF file. Since there are multiple files, they are packaged together into a ZIP archive for download."
      },
      {
        q: "Is there a page count limit?",
        a: "No. The splitter handles PDFs of any length — from a 2-page contract to a 500-page technical report."
      }
    ]
  },
  'edit-pdf': {
    title: "Online PDF Editor — Add Text, Shapes, Images & Annotations Natively",
    subtitle: "Modify PDF documents directly in your browser. Add text boxes, freehand pen drawings, shapes, uploaded images, and highlights.",
    sections: [
      {
        title: "Full-Featured Online Workbench",
        icon: "✏️",
        content: [
          "Text Overlays: Add custom text boxes with full font size, color, bold, italic, and alignment controls.",
          "Original Text Editing: Hover over existing text blocks in your PDF and click to erase or override them cleanly.",
          "Freehand Annotations & Drawings: Use the pen tool to draw diagrams, signatures, or notes directly onto any page.",
          "Shapes & Stamps: Draw clean rectangles, circles, or stamp images directly onto your document."
        ]
      },
      {
        title: "High-Resolution Native Vector Output",
        icon: "⚡",
        content: [
          "Your edits are rendered natively into the PDF structure using PyMuPDF vector engines — ensuring maximum clarity and small file size.",
          "Pages are processed securely without quality degradation, preserving all original vector text and formatting."
        ]
      }
    ],
    faqs: [
      {
        q: "Can I edit existing text in a PDF?",
        a: "Yes! Hover over any text block on your PDF canvas to select it. Click to erase the original text and replace it with your own formatted text box."
      },
      {
        q: "Are my documents kept private?",
        a: "Yes. All file processing takes place in a sandboxed server session. Your uploaded and edited PDF files are automatically deleted immediately after download."
      },
      {
        q: "Can I draw signatures on my PDF?",
        a: "Yes. Use the Draw tool with custom line thickness and color to draw hand-written signatures or annotations onto any page."
      }
    ]
  },
  'dev-card-studio': {
    title: "Developer Card & OpenGraph Social Banner Studio",
    subtitle: "Design stunning social preview cards, GitHub README headers, and LinkedIn cover banners with real-time visual canvas controls.",
    sections: [
      {
        title: "Visual Drag-and-Drop Card Builder",
        icon: "🎨",
        content: [
          "Customize backgrounds, gradients, border-radius, user avatars, social links, and bio text. Preview exactly how your banner looks on Twitter, LinkedIn, and GitHub Readme slots before export.",
          "Featuring an interactive canvas with real-time feedback, you can adjust positioning, alignment, spacing, and layout sizes easily to suit your design preferences.",
          "You can also toggle between dark and light themes for your preview cards to make sure they match your personal brand design."
        ]
      },
      {
        title: "Optimized Social Media Branding",
        icon: "✨",
        content: [
          "Build cards with predefined sizes matching LinkedIn, GitHub, and Twitter guidelines. Export options include 3x resolution scaling, ensuring text and icons appear crisp on modern Retina and high-density screens.",
          "The studio integrates vector icons for top developer platforms (GitHub, LinkedIn, Twitter, Portfolio, Mail, Dev.to) to display professional contact points on your cards.",
          "Once you are happy with the layout, click export to generate and download a clean, high-resolution PNG file instantly."
        ]
      }
    ],
    faqs: [
      {
        q: "What resolution are the social cards exported in?",
        a: "Banners are exported in standard high-resolution (3x density) PNG format to ensure they look sharp and pixel-perfect on all device screens."
      },
      {
        q: "Is this design studio free to use?",
        a: "Yes, it is completely free to create and export infinite developer profile banners and developer cards."
      },
      {
        q: "Can I import custom icons or logos?",
        a: "Yes, you can upload profile pictures, avatars, and logo assets directly into the canvas. All processing and rendering is performed client-side."
      },
      {
        q: "What dimensions are the social templates designed for?",
        a: "We support standard social dimensions: GitHub Profile Headers (1280x640), LinkedIn Banners (1584x396), Twitter Headers (1500x500), and business card styles."
      }
    ]
  },
  'add-page-numbers': {
    title: "Add Page Numbers to PDF Documents Online",
    subtitle: "Number your PDF pages instantly. Choose custom positions, fonts, font-sizes, and formats entirely in your browser.",
    sections: [
      {
        title: "Dynamic PDF Numbering Customization",
        icon: "🔢",
        content: [
          "Upload any document and configure number patterns (e.g. Page X, X of Y). Position numbers at the header, footer, left, center, or right margins. The styling is applied dynamically and compiled into a new PDF download.",
          "This is extremely useful for structuring long reports, eBooks, legal agreements, and academic papers before printing or sharing them online.",
          "You can adjust number positions dynamically using visual sliders, ensuring the pagination aligns with your margins and layouts."
        ]
      },
      {
        title: "Local Assembly and Styling",
        icon: "🎨",
        content: [
          "Utilizes advanced client-side PDF modification engines (pdf-lib) to append text fields onto existing page canvases without re-rendering original vector layout lines, preserving original document formatting.",
          "By processing the file locally, your text coordinates, vector drawings, and fonts are preserved at 100% original quality.",
          "Since there are no server uploads, large files are processed in a fraction of a second, ready for download."
        ]
      }
    ],
    faqs: [
      {
        q: "Can I number only specific page ranges?",
        a: "Yes. You can set the starting page number and choose to skip the cover page or introductory index pages entirely."
      },
      {
        q: "Does this numbering tool decrease PDF quality?",
        a: "No. Since it embeds text layers directly on top of the original vector structures rather than flattening pages, it maintains 100% of the original quality."
      },
      {
        q: "Is it secure to process contracts and official documents here?",
        a: "Completely secure. The document is modified locally in your browser memory and never uploaded to any cloud storage or external API."
      },
      {
        q: "Can I customize the font color and style?",
        a: "Yes. We support standard font styles (Helvetica, Roman) and allow you to configure font sizes and colors to align with your design system."
      }
    ]
  },
  'merge-pdf': {
    title: "Direct PDF Merger & Page Organizer Tool",
    subtitle: "Combine multiple PDF documents into a single organized file. Reorder pages and files before merging in seconds.",
    sections: [
      {
        title: "Drag, Drop, Reorder & Combine",
        icon: "🔗",
        content: [
          "Upload multiple PDF documents. Reorder the files using a simple visual drag-and-drop list, delete unwanted files, and click Merge. The engine pieces them together in your browser memory.",
          "This allows you to organize papers, merge scans, and combine reports into a single, cohesive file easily.",
          "You can review your files in a list format showing details like size and name before confirming the compilation."
        ]
      },
      {
        title: "Lossless PDF Page Stitching",
        icon: "💎",
        content: [
          "Our merge compiler keeps all original vector layouts, fonts, links, and forms intact. By avoiding page rasterization, the compiled file is highly compressed, legible, and lightweight.",
          "This keeps file sizes small and ensures all texts remain fully searchable, which is essential for e-reading devices and official databases.",
          "The merged PDF is compiled client-side in a sandbox, preventing data leaks or server delays."
        ]
      }
    ],
    faqs: [
      {
        q: "Is there a limit on the number of PDFs I can merge?",
        a: "No. You can merge as many documents as you need. Since the compilation is handled locally, the speed is limited only by your computer's RAM."
      },
      {
        q: "Will the hyperlinks inside my PDFs still work after merging?",
        a: "Yes. The merge tool preserves the internal PDF dictionaries, including bookmarks, links, interactive forms, and annotations."
      },
      {
        q: "How secure is the PWA PDF merger?",
        a: "It runs entirely offline inside your browser sandbox. No file data is sent to our servers, keeping sensitive documents confidential."
      },
      {
        q: "What should I do if the merged PDF file size is too large?",
        a: "You can use an image compressor or specialized PDF optimizer tool to compress the embedded images in the merged document if necessary."
      }
    ]
  },
  'jpg-to-pdf': {
    title: "JPG & PNG Images to PDF Document Converter",
    subtitle: "Convert photos, screenshots, and scanned images into a single clean PDF document online with custom page layouts.",
    sections: [
      {
        title: "Photo to PDF Compilation",
        icon: "📷",
        content: [
          "Select multiple image files (JPG, PNG, WebP). Adjust margins, page orientation (portrait/landscape), and image scale. The tool compiles them instantly into a standard, print-ready PDF file.",
          "This is extremely helpful for digitizing receipts, collecting book page scans, submitting assignments, or organizing photo portfolios into a single shareable document.",
          "Each uploaded image is rendered as an individual page, maintaining its original aspect ratios and dimensions."
        ]
      },
      {
        title: "Page Alignment & Visual Margin Calibration",
        icon: "📐",
        content: [
          "Configure individual sheet sizes (A4, Letter) or stretch images to fit. Previews of all image pages allow you to drag and drop sheets to reorder the PDF structure before final compilation.",
          "You can configure page margins (no margin, thin margin, thick margin) to create professional documents ready for printing.",
          "The PDF is generated entirely in memory, eliminating wait times and providing an immediate local download."
        ]
      }
    ],
    faqs: [
      {
        q: "Can I reorder images before saving the PDF?",
        a: "Yes. You can drag and reorder the image previews on the dashboard to ensure pages appear in the correct chronological order."
      },
      {
        q: "Will my images lose quality during the PDF conversion?",
        a: "No. The converter reads the raw base64 data bytes of your images and wraps them directly into the PDF container without compressing them further."
      },
      {
        q: "What types of image formats does the converter support?",
        a: "It supports all standard web formats, including JPEG, JPG, PNG, APNG, and WebP images."
      },
      {
        q: "Is there a limit on the number of images I can combine?",
        a: "There is no hardcoded limit. You can combine dozens of photos. Since the file is processed locally, memory capacity depends on your device's browser memory."
      }
    ]
  },
  'image-compressor': {
    title: "Fast client-side Image Compressor & Resizer",
    subtitle: "Compress PNG, JPG, and WebP images to your target size (under 200KB, 100KB, etc.) without losing visual quality.",
    sections: [
      {
        title: "How Browser-Based Compression Works",
        icon: "📉",
        content: [
          "Our compressor scales image dimensions and re-encodes pixel matrices locally using canvas compression ratios. This reduces file sizes by up to 90% in milliseconds, keeping details crisp.",
          "By adjusting the pixel matrix dimensions and quality percentages directly, we can shrink files without adding noticeable blur or artifacts.",
          "You can compress single images or compile multiple optimized images into a single ZIP archive easily."
        ]
      },
      {
        title: "Setting Specific Target Sizes",
        icon: "🎯",
        content: [
          "Whether you need to upload a photo to a portal that limits files to under 100KB or want to optimize web assets, you can specify dimensions, compression ratios, and view immediate live previews.",
          "The tool calculates the before-and-after file size differences in real-time, showing the compression savings immediately.",
          "All tasks execute inside your browser sandbox, ensuring absolute privacy for your personal photographs."
        ]
      }
    ],
    faqs: [
      {
        q: "Can I compress images in batch mode?",
        a: "Yes. You can upload multiple images at once, apply identical quality targets, and download all compressed files in a single click."
      },
      {
        q: "Is compression performed on a remote server?",
        a: "No. The compression runs entirely on your local CPU inside your browser using canvas APIs. Your private images are never uploaded."
      },
      {
        q: "Does this tool support PNG compression with transparency?",
        a: "Yes, it supports alpha-channel transparency preservation for PNG images, while still optimizing the file size significantly."
      },
      {
        q: "What image formats are supported for compression?",
        a: "The tool supports standard formats, including JPEG, JPG, PNG, and WebP images."
      }
    ]
  },
  'emi-calculator': {
    title: "EMI Loan Calculator & Repayment Amortization Schedule",
    subtitle: "Plan your loans, home mortgages, and car finance payments with interactive charts and breakdown ledgers.",
    sections: [
      {
        title: "Loan Amortization Calculation",
        icon: "📊",
        content: [
          "Input the principal loan amount, interest rate percentage, and tenure in months or years. The calculator evaluates monthly payments (EMI), interest totals, and draws a yearly repayment breakdown table.",
          "This helps you visualize how much of your monthly installment goes toward reducing the principal loan balance vs. paying off accumulated interest fees.",
          "You can plan your budget, home loans, car loans, and student debts by modifying sliders and seeing calculations update instantly."
        ]
      },
      {
        title: "Donut Repayment Ratios & Printing",
        icon: "🖨️",
        content: [
          "Includes an interactive SVG donut chart that separates the loan principal from interest payments. You can export the statement or print the entire ledger directly for financial reference.",
          "The chart displays the ratio of principal vs. interest visually, making it easy to digest your long-term debt parameters.",
          "Use the 'Print Statement' option to generate clean, paper-friendly PDF amortization reports instantly."
        ]
      }
    ],
    faqs: [
      {
        q: "What is an amortization schedule?",
        a: "An amortization schedule is a complete table showing how each monthly payment is divided between the interest fees and the principal loan reduction over the tenure."
      },
      {
        q: "How does compounding frequency affect EMI calculations?",
        a: "This calculator assumes monthly compounding, which is the standard practice for home, auto, and personal loans across most banks."
      },
      {
        q: "Can I calculate pre-payments or extra monthly payments?",
        a: "You can adjust the sliders to simulate a reduced principal amount or shorter tenure to see how it affects your total interest payments."
      },
      {
        q: "Why is the interest payment higher in the early years of the loan?",
        a: "Interest is calculated on the outstanding loan balance. In the early years, the balance is high, so the interest portion of the EMI is larger. As the principal is paid down, the interest portion decreases."
      }
    ]
  },
  'qr-studio': {
    title: "QR Code Studio: Generator, Stylizer & Reader",
    subtitle: "Design customized QR codes with custom colors, dots, inner markers, and brand logos. Scan QR codes via live camera feeds.",
    sections: [
      {
        title: "Creative QR Customization & Scanning",
        icon: "🎨",
        content: [
          "Generate standard, visual QR codes. Choose gradients, circular markers, or corner frames. You can also upload a QR image or enable webcam scanning to decode code values in real-time.",
          "By adjusting the color gradients and styling of the dots and eye patterns, you can align QR codes with your branding identity.",
          "Webcam scanner capability allows you to read and decode QR code values immediately without needing separate phone app downloads."
        ]
      },
      {
        title: "Vector and Raster QR Formats",
        icon: "💾",
        content: [
          "Download generated QR codes in high-resolution PNG format. Adjust error correction levels to ensure codes remain readable even when custom logos are placed in the center.",
          "Error correction levels (Low, Medium, Quartile, High) add redundant data patterns, making the QR scan stable even under low lighting or when partially damaged.",
          "All processes are executed client-side, ensuring complete confidentiality for the URLs or passwords you encode."
        ]
      }
    ],
    faqs: [
      {
        q: "Do generated QR codes ever expire?",
        a: "No. The QR codes represent static values or direct links, meaning they remain valid and readable forever."
      },
      {
        q: "What is the purpose of setting error correction levels?",
        a: "Higher error correction (e.g. Level H) adds more redundant modules to the QR grid, allowing it to remain readable even if covered by a custom brand logo."
      },
      {
        q: "Is there any limit to the amount of text I can encode?",
        a: "Standard QR codes can store up to 4,296 alphanumeric characters, but shorter texts or simple URLs are recommended for easier scanning."
      },
      {
        q: "Can I add my logo in the center of the QR code?",
        a: "Yes. You can select custom marker layouts and drop avatar/brand images over the center of the QR code canvas directly."
      }
    ]
  },
  'json-formatter': {
    title: "JSON Formatter, Validator & Pretty Printer",
    subtitle: "Format messy JSON data, validate syntax errors, and convert JSON structures into clean interactive tree structures.",
    sections: [
      {
        title: "Real-Time JSON Syntax Verification",
        icon: "⚙️",
        content: [
          "Paste raw JSON text. The validator auto-identifies missing commas, unclosed brackets, or invalid strings, highlighting errors with line numbers. Click Format to clean up indentation.",
          "This is a valuable developer tool for debugging API payloads, config settings, and data structures quickly.",
          "Syntax validation runs dynamically in the browser, showing lines and columns where parsing errors occur."
        ]
      },
      {
        title: "Interactive Object Tree View",
        icon: "🌳",
        content: [
          "Switch to Tree Model view to inspect large nested JSON objects. Click nodes to collapse or expand keys, making it easy to analyze complex response structures from APIs.",
          "This allows you to parse long files, check nested arrays, and verify data structures without scrolling through thousands of lines of code.",
          "Formatted results can be minified with a single click, removing whitespace for optimal API storage usage."
        ]
      }
    ],
    faqs: [
      {
        q: "Is it safe to paste confidential credentials here?",
        a: "Yes, our JSON formatter is 100% private. Parsing and formatting are performed locally inside your browser memory; no data is sent to the internet."
      },
      {
        q: "What happens if my JSON is invalid?",
        a: "The parser will display a detailed error description identifying the exact line number and column where the syntax error is located."
      },
      {
        q: "Does it support minifying JSON strings?",
        a: "Yes, you can toggle the Minify mode to strip out all white spaces, newlines, and indentations to reduce the payload footprint."
      },
      {
        q: "Can I view the size and character count of the JSON data?",
        a: "Yes. The formatter status bar displays total characters and line counts dynamically as you modify your inputs."
      }
    ]
  },
  'diff-checker': {
    title: "Online Code & Text Diff Comparison Checker",
    subtitle: "Compare two text blocks or code files side-by-side to highlight additions, deletions, and inline differences instantly.",
    sections: [
      {
        title: "Side-by-Side and Inline Diff Comparison",
        icon: "⚖️",
        content: [
          "Paste the original text in the left pane and the modified version in the right pane. The engine runs diff algorithms to highlight line modifications and character changes in green and red.",
          "This is extremely useful for reviewing code edits, tracking text additions, and comparing configuration files side-by-side.",
          "You can select between Split View or Inline View to review the differences in the format that suits you best."
        ]
      },
      {
        title: "Synchronized Scroll & Metrics",
        icon: "🔄",
        content: [
          "Features synchronized scroll locks for split comparison panes. An additions/deletions counter reports exactly how many lines have been modified or appended.",
          "The synchronized scroll aligns lines of both panes, allowing you to examine modifications across large files easily.",
          "Everything runs client-side in the browser, ensuring your private documentation changes remain confidential."
        ]
      }
    ],
    faqs: [
      {
        q: "Does this compare folders or files?",
        a: "You can open or copy-paste individual code files, config logs, or essays to inspect differences line-by-line."
      },
      {
        q: "What algorithm does this diff checker use?",
        a: "It uses a highly efficient client-side LCS (Longest Common Subsequence) comparison algorithm to detect additions and deletions."
      },
      {
        q: "Does this tool store my pasted code?",
        a: "No. The text comparison is run entirely inside your browser tab. We do not transmit or log any of the content you compare."
      },
      {
        q: "What do the green and red highlights represent?",
        a: "Green highlights indicate additions (code or text appended to the modified draft), while red highlights represent deletions (text removed from the original draft)."
      }
    ]
  },
  'code-runner': {
    title: "Web-Based Sandboxed Code Runner IDE",
    subtitle: "Write, edit, and run Javascript, HTML, CSS, and lightweight algorithms directly in your browser with immediate console output.",
    sections: [
      {
        title: "Interactive Programming Sandbox",
        icon: "💻",
        content: [
          "Features a standard web editor with line numbering, bracket closure, and syntax highlighting. Ideal for testing code snippets, web design ideas, and teaching concepts.",
          "Write HTML structures, style them with CSS, and run JavaScript code dynamically. The output renders immediately inside a secure output preview pane.",
          "We offer multiple template skeletons (HTML, JavaScript, basic layouts) to help you set up and write code snippets quickly."
        ]
      },
      {
        title: "Console Logging and Shell Output",
        icon: "📟",
        content: [
          "Includes an interactive console panel that intercepts standard output stream calls, outputting variables, tables, and logical errors in a clean CLI interface.",
          "You can inspect variables, log matrices, and trace code execution paths without opening your browser's Developer Tools.",
          "The runtime environment is completely sandboxed within an iframe to keep your browser safe from loops or system access attempts."
        ]
      }
    ],
    faqs: [
      {
        q: "Do I need to install Node.js or runtimes?",
        a: "No. The code executes directly in your browser's sandboxed iframe container, making it completely safe, fast, and secure."
      },
      {
        q: "Which languages are supported in this sandbox?",
        a: "It supports standard Web technologies, including HTML5, CSS3, ES6 JavaScript, and browser APIs like Canvas, DOM, and local fetch requests."
      },
      {
        q: "Is it safe to run untrusted code here?",
        a: "Yes. The execution environment is heavily sandboxed within an iframe with strict security policies, preventing unauthorized cookie or storage access."
      },
      {
        q: "Can I share my code runner creations?",
        a: "Yes. You can copy the code from the editor and share it. All code remains stored locally in your active tab session until reloaded."
      }
    ]
  },
  'screenshot-studio': {
    title: "Screenshot Studio & Website Capture Tool",
    subtitle: "Capture full-page, desktop, or mobile screenshots of any public website URL online in high resolution.",
    sections: [
      {
        title: "Headless Browser Page Capturing",
        icon: "📸",
        content: [
          "Enter a URL, choose target viewport size (Desktop, Tablet, Mobile), and trigger capture. Our API spins up a secure headless chromium instance, loads the page layout, and returns a PNG asset.",
          "This is ideal for compiling portfolios, documenting layouts, checking cross-platform responsiveness, or capturing landing pages for presentations.",
          "The capture handles full-height page scans, scrolling to the bottom of the page to build full long-scroll previews."
        ]
      },
      {
        title: "High-Resolution Image Compilation",
        icon: "📐",
        content: [
          "Configure precise pixel viewport configurations. The screen is rendered at full device scale, delivering clear captures of graphics, landing pages, and typography layout systems.",
          "You can select standard device dimensions (iPhone, iPad, desktop screens) or configure custom ratios to preview website configurations.",
          "Downloaded files are exported as high-density PNG files, suitable for design mockups and reports."
        ]
      }
    ],
    faqs: [
      {
        q: "Does it support capturing password-protected sites?",
        a: "No. The headless browser acts as a guest client, so it can only screenshot public web pages that do not require authentication codes."
      },
      {
        q: "Can I specify a custom size for my screenshots?",
        a: "Yes. You can switch to custom viewport size controls and type in your exact height and width pixel targets."
      },
      {
        q: "Why does my screenshot show a cookie banner?",
        a: "Since the headless capture client acts as a first-time guest user, websites will display their default privacy banners and popups."
      },
      {
        q: "What should I do if the page fails to render?",
        a: "Make sure the URL is public, accessible without passwords, does not have bot protection services (like Cloudflare challenge pages), and is spelled correctly."
      }
    ]
  },
  'secure-vault': {
    title: "Secure Browser Vault: AES-256 Encrypted Storage",
    subtitle: "Encrypt files and text notes client-side. Decrypt them with a master password entirely offline.",
    sections: [
      {
        title: "Military-Grade Client-Side Encryption",
        icon: "🔐",
        content: [
          "Secrets are encrypted in browser memory using AES-256-GCM. The decrypted values are only shown when the correct passphrase is key-entered, leaving nothing readable in browser local storage.",
          "By applying encryption client-side, your files, passwords, and personal notes are converted into cipher text before storage.",
          "This process uses standard Web Crypto APIs, which leverage hardware acceleration for fast, secure hashing."
        ]
      },
      {
        title: "Zero-Knowledge Database Model",
        icon: "🚫",
        content: [
          "We utilize zero-knowledge architecture. Your passwords and private file bytes are processed 100% locally. We do not have database logs, and cannot read or restore your keys.",
          "This keeps your credentials secure, as no server or developer has access to your master keys.",
          "You can download your entire encrypted database as a backup file and load it back on other devices offline."
        ]
      }
    ],
    faqs: [
      {
        q: "What happens if I forget my master password?",
        a: "Since the encryption password is never sent to our servers, we have no way to reset it. If you forget it, your vault data cannot be recovered."
      },
      {
        q: "Is AES-256 encryption secure against brute force?",
        a: "Yes. AES-256 is the encryption standard approved by international security agencies. Brute-forcing it would require billions of years using current computing tech."
      },
      {
        q: "Can I export my encrypted vault database?",
        a: "Yes. You can download your encrypted vault data as a standard JSON ledger and load it back on any other device offline."
      },
      {
        q: "Are my vault keys saved in standard browser cookies?",
        a: "No. Key details are processed in temporary JavaScript variables and browser memory. Unlocked data is cleared immediately upon closing the browser tab."
      }
    ]
  },
  'ocr-converter': {
    title: "AI Document OCR: Image to Text Converter",
    subtitle: "Extract text from scanned documents, photos, invoices, and PDFs using local neural text recognition.",
    sections: [
      {
        title: "Local Optical Character Recognition",
        icon: "🔍",
        content: [
          "Uses Tesseract.js neural layers. Upload an image, choose the text language, and trigger the scanner. The layout engine extracts letters and converts them into editable markdown logs.",
          "This is ideal for digitizing receipts, capturing quotes from physical books, extracting tables, and translating image text blocks.",
          "The extraction runs entirely inside your browser, meaning your scanned pages are never sent to external servers."
        ]
      },
      {
        title: "Multiple Language Packs",
        icon: "🗣️",
        content: [
          "Supports text recognition for English, Nepali, Hindi, Spanish, French, German, Chinese, and Japanese. The corresponding models are loaded directly into browser cache.",
          "By configuring the language dropdown, the scanner maps specific character libraries for improved word detection accuracy.",
          "Extracted text can be copied to the clipboard or downloaded as a standard `.txt` text file."
        ]
      }
    ],
    faqs: [
      {
        q: "What image formats are supported?",
        a: "You can load PNG, JPG, WebP, and multi-page PDF files to capture readable text blocks."
      },
      {
        q: "Do I need an active internet connection to run OCR?",
        a: "The first time you select a language, the browser downloads the translation pack (~10-15MB). After the initial download, the OCR calculations run 100% offline."
      },
      {
        q: "How can I improve the accuracy of text extraction?",
        a: "Ensure the document has good lighting, high contrast (black text on white background), and the text is not rotated or heavily skewed."
      },
      {
        q: "Is there a limit to how many images I can process?",
        a: "No limit. Since all processing runs on your local CPU, you can process documents continuously without subscriptions or credits."
      }
    ]
  },
  'bg-remover': {
    title: "AI Image Background Remover (100% Client-Side)",
    subtitle: "Remove backgrounds from portraits, products, and objects in seconds directly inside your browser.",
    sections: [
      {
        title: "Local Machine Learning Segmentation",
        icon: "✂️",
        content: [
          "Utilizes local neural models in the browser to isolate the foreground subject and clean up background pixels. Since no photo data is uploaded to a remote server, background removal is completely private.",
          "The tool uses advanced segmentation weights (via WebAssembly) to detect edges and separate subjects from backgrounds.",
          "Once processed, you can download a transparent PNG file immediately, ready to be dropped into design canvases."
        ]
      },
      {
        title: "Zero-Server Privacy & Efficiency",
        icon: "🔒",
        content: [
          "Unlike other online tools that charge credits or require registrations to upload photos, our background remover runs entirely in WebAssembly locally, preserving original image resolution.",
          "Your photos are processed inside your browser tab memory, making it safe for personal and professional image modifications.",
          "The segmentation runs locally, so there are no queue lines, server down-times, or bandwidth delays."
        ]
      }
    ],
    faqs: [
      {
        q: "Is there a limit on image dimensions?",
        a: "Large images are processed in high quality. The execution time depends on your device's processor and graphics acceleration capabilities."
      },
      {
        q: "How does the browser download the AI model?",
        a: "Upon triggering the tool, the browser downloads the segmentation weights model (~75MB). This model is stored in your browser cache so future tasks load instantly."
      },
      {
        q: "What kinds of photos work best with this tool?",
        a: "Photos with clear focus, sharp edges between the subject and background, and good contrast will yield the most accurate cutout results."
      },
      {
        q: "Are my processed images stored anywhere on your website?",
        a: "No. The entire segmentation task runs locally in your browser memory. We have no access to your files, photos, or data."
      }
    ]
  },
  'scan-pdf': {
    title: "Web Document Scanner: Clean Multi-Page PDFs",
    subtitle: "Turn paper documents, book pages, and receipts into neat PDF scans using your camera or webcam.",
    sections: [
      {
        title: "Cam-to-PDF Capture & Correction",
        icon: "📷",
        content: [
          "Allows document edge detection, crop adjustment, color filters (grayscale, black & white, contrast), and compiles multiple captures into a single, clean PDF file.",
          "This replicates features of mobile document scanners. You can adjust corner pins to correct document angles if the photo was taken at an incline.",
          "Apply specialized grayscale and high-contrast filters to maximize text readability before compiling the pages."
        ]
      },
      {
        title: "Mobile Synchronization Technology",
        icon: "📱",
        content: [
          "No mobile app installation is required. Scan the QR code with your phone to link cameras. Photos taken on the phone will load immediately onto your desktop dashboard.",
          "This is extremely useful when your computer does not have a webcam or when you want to scan physical documents on a table.",
          "The WebRTC signaling channel is fully secure and encrypts data streaming between the phone and computer."
        ]
      }
    ],
    faqs: [
      {
        q: "Can I adjust document boundaries manually?",
        a: "Yes. You can drag the corners of the cropping window to refine borders and perform perspective correction before rendering."
      },
      {
        q: "Are my camera feeds or scans sent to the cloud?",
        a: "No. The real-time document detection, image processing, and PDF compiling are executed locally in the browser memory."
      },
      {
        q: "How do I sync my mobile phone camera to my desktop?",
        a: "Scan the generated QR code on the desktop scanner dashboard. It will open a private session on your phone where you can snap pages directly."
      },
      {
        q: "Can I apply filters to make text scan sharper?",
        a: "Yes. We offer Grayscale and Black & White threshold filters that increase contrast and make scanned text look clean and legible, like a photocopier output."
      }
    ]
  },
  'font-downloader': {
    title: "System Fonts Downloader & Batch Preview Studio",
    subtitle: "Browse, inspect, and download over 1100+ standard Nepali and English fonts in TTF format for free.",
    sections: [
      {
        title: "Font Previews and Package Download",
        icon: "🔤",
        content: [
          "Features instant typing preview test boxes. View fonts in bold, italic, and specific sizes, then download the individual .ttf font file or zip packages directly.",
          "This is a valuable tool for web developers, graphic designers, and office administrators. You can test your custom text dynamically across all fonts in the list.",
          "We support single downloads as well as bulk packaging. Select multiple fonts to download them combined into a single ZIP archive."
        ]
      },
      {
        title: "Devanagari Unicode vs Legacy Layouts",
        icon: "⌨️",
        content: [
          "Includes comprehensive categorizations for Devanagari Unicode (Mangal, Kalimati), handwriting, sans-serif, and legacy typing styles (Preeti, Kantipur) used in offices.",
          "Understanding the differences is critical: Legacy fonts like Preeti map Nepali characters onto standard English keys, meaning they do not render properly when copy-pasted as standard Unicode text online.",
          "Our downloader organizes these fonts into categories, making it easy to identify the correct style for your document tasks."
        ]
      }
    ],
    faqs: [
      {
        q: "Are these fonts compatible with Word and Photoshop?",
        a: "Yes. The standard TTF (TrueType Font) formats install natively on Windows, macOS, Android, and iOS software."
      },
      {
        q: "How do I install fonts downloaded from this archive?",
        a: "Download the font file, double-click the .ttf file on Windows or Mac, and click the 'Install Font' button in the pop-up window."
      },
      {
        q: "Why does the Preeti font layout display as English characters in the preview?",
        a: "Preeti is a legacy non-Unicode font that maps Nepali characters directly onto standard English keyboard strokes, so typing in standard Unicode fields requires converting them first."
      },
      {
        q: "Are these fonts free for commercial projects?",
        a: "Most fonts in our archive are licensed under open-source agreements (like the SIL Open Font License). However, you should check specific license terms for your commercial projects."
      }
    ]
  },
  'typing-practice': {
    title: "Complete Guide: Mastering Keyboard Speed & Accuracy",
    subtitle: "Understand the mechanics of typing tests, standard calculations, and visual muscle memory techniques to skyrocket your WPM.",
    sections: [
      {
        title: "How Typing Speed (WPM) is Standardized",
        icon: "📊",
        content: [
          "In formal typing tests, a 'word' is standardized as exactly 5 keystrokes (including spaces, punctuation, and capitalizations). This ensures that typing longer words (like 'application') doesn't artificially lower your score compared to shorter words.",
          "WPM (Words Per Minute) is calculated using the formula: (Correct Characters Typed / 5) / (Time Elapsed in Minutes).",
          "Raw WPM tracks your speed regardless of mistakes: (Total Keystrokes / 5) / (Time Elapsed in Minutes). This helps gauge your finger movement capacity compared to final correct accuracy."
        ]
      },
      {
        title: "How to Build Accurate Muscle Memory",
        icon: "🧠",
        content: [
          "Focus on accuracy first. Speed is a natural byproduct of correct finger placement. Aim for a consistent accuracy of 95% or higher before aiming to type faster.",
          "Our integrated Visual Keyboard Visualizer maps your key presses in real-time, showing key placements on screen. This guides your eyes to stay on the text rather than looking down at your physical keyboard.",
          "If you make errors, take note of which keys are highlighted in the Errors Breakdown card, and consciously slow down when those specific letters approach in subsequent test paragraphs."
        ]
      }
    ],
    faqs: [
      {
        q: "What is a good typing speed?",
        a: "An average typing speed is around 40 WPM. Professional typists usually range between 60 to 80 WPM, while competitive typists exceed 100+ WPM with 97%+ accuracy."
      },
      {
        q: "What is the standard formula for typing accuracy?",
        a: "Accuracy is calculated as: (Number of Correct Keystrokes / Total Number of Keystrokes) * 100. Higher accuracy reduces corrective backspaces, boosting WPM."
      },
      {
        q: "Does this page log my custom texts or pasted data?",
        a: "No. All text parsing, input calculations, and visual keyboard loops are executed client-side in browser memory. No data is stored, cached, or sent online."
      }
    ]
  }
};

interface SeoGuideSectionProps {
  toolId: string;
}

export const SeoGuideSection: React.FC<SeoGuideSectionProps> = ({ toolId }) => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const guide = GUIDES_DATABASE[toolId];

  if (!guide) return null;

  return (
    <div className="w-full bg-[#fcf8f2] dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800/80 py-16 px-6 sm:px-12 mt-16 transition-colors duration-300 z-20">
      <div className="max-w-6xl mx-auto space-y-12 text-left">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-855 dark:text-white font-heading">
            {guide.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-450 text-sm sm:text-base leading-relaxed">
            {guide.subtitle}
          </p>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {guide.sections.map((sect, i) => (
            <div key={i} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-855 dark:text-white font-heading flex items-center gap-2">
                <span>{sect.icon}</span> {sect.title}
              </h3>
              <div className="text-slate-650 dark:text-slate-400 text-sm leading-relaxed space-y-3">
                {Array.isArray(sect.content) ? (
                  <ul className="list-disc list-inside space-y-1.5 pl-1">
                    {sect.content.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{sect.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="border-t border-slate-200 dark:border-slate-800/60 pt-12 max-w-4xl mx-auto space-y-6">
          <h3 className="text-xl sm:text-2xl font-bold text-center text-slate-855 dark:text-white font-heading">
            Frequently Asked Questions (FAQ)
          </h3>
          
          <div className="space-y-4">
            {guide.faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-900/40 transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(openFaqIdx === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 font-semibold text-slate-855 dark:text-white text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-[#e52521] dark:text-[#d01f1c] font-bold ml-4">
                    {openFaqIdx === i ? '−' : '+'}
                  </span>
                </button>
                {openFaqIdx === i && (
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-800/80 text-slate-650 dark:text-slate-450 text-sm leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
