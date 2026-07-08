import React, { useState, useEffect, useRef } from 'react';
import { 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Bold, Italic, Underline, Undo, Eraser, Check, 
  PaintBucket, Sliders, Type, Maximize 
} from 'lucide-react';

export const FloatingEditorToolbar: React.FC = () => {
  const [activeEl, _setActiveEl] = useState<HTMLElement | null>(null);
  const activeElRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const isColorPickerOpenRef = useRef(false);

  // Popover Toggle States
  const [activePopover, setActivePopover] = useState<'background' | 'borderStyle' | 'borderColor' | 'typography' | 'spacing' | null>(null);

  // Styling States
  const [bgColor, setBgColor] = useState('#ffffff');
  const [hasBgColor, setHasBgColor] = useState(false);

  const [strokeWidth, setStrokeWidth] = useState('0');
  const [borderStyle, setBorderStyle] = useState('none');
  const [borderRadius, setBorderRadius] = useState('0');

  const [borderColor, setBorderColor] = useState('#000000');
  const [hasBorderColor, setHasBorderColor] = useState(false);

  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState('16');
  const [lineHeight, setLineHeight] = useState('24');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  const [padding, setPadding] = useState({ top: '0', right: '0', bottom: '0', left: '0' });
  const [margin, setMargin] = useState({ top: '0', right: '0', bottom: '0', left: '0' });

  // Color picker Hue states
  const [bgHue, setBgHue] = useState(0);
  const [borderHue, setBorderHue] = useState(200);

  const setActiveEl = (el: HTMLElement | null) => {
    _setActiveEl(el);
    activeElRef.current = el;
  };

  // Position updating
  const updatePosition = (el: HTMLElement) => {
    let currentEl = el;
    if (!document.body.contains(currentEl)) {
      const editId = currentEl.getAttribute('data-editable-id');
      if (editId) {
        const replacement = document.querySelector(`[data-editable-id="${editId}"]`) as HTMLElement;
        if (replacement) {
          currentEl = replacement;
          setActiveEl(replacement);
        } else {
          return;
        }
      } else {
        return;
      }
    }

    const rect = currentEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const toolbarHeight = 54;
    const toolbarWidth = toolbarRef.current?.offsetWidth || 480;
    
    let top = rect.top + window.scrollY - toolbarHeight - 16;
    let left = rect.left + window.scrollX + (rect.width / 2) - (toolbarWidth / 2);

    if (top < 10) top = rect.bottom + window.scrollY + 16;
    if (left < 10) left = 10;
    if (left + toolbarWidth > window.innerWidth - 10) {
      left = window.innerWidth - toolbarWidth - 10;
    }

    setPosition({ top, left });
  };

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return { r, g, b };
  };

  // Helper to convert RGB to Hex
  const rgbToHex = (r: number, g: number, b: number) => {
    const clamp = (val: number) => Math.max(0, Math.min(255, val));
    return "#" + [clamp(r), clamp(g), clamp(b)].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  // Prepopulate values from element style
  const loadElementStyles = (el: HTMLElement) => {
    const style = el.style;
    const computed = window.getComputedStyle(el);

    // Background color
    const bgVal = style.backgroundColor || computed.backgroundColor;
    if (bgVal && bgVal !== 'rgba(0, 0, 0, 0)' && bgVal !== 'transparent') {
      setHasBgColor(true);
      const match = bgVal.match(/\d+/g);
      if (match && match.length >= 3) {
        setBgColor(rgbToHex(Number(match[0]), Number(match[1]), Number(match[2])));
      }
    } else {
      setHasBgColor(false);
      setBgColor('#ffffff');
    }

    // Borders
    setStrokeWidth(style.borderWidth ? style.borderWidth.replace('px', '') : '0');
    setBorderStyle(style.borderStyle || 'none');
    setBorderRadius(style.borderRadius ? style.borderRadius.replace('px', '') : '0');

    // Border Color
    const bcVal = style.borderColor || computed.borderColor;
    if (bcVal && bcVal !== 'rgba(0, 0, 0, 0)' && bcVal !== 'transparent') {
      setHasBorderColor(true);
      const match = bcVal.match(/\d+/g);
      if (match && match.length >= 3) {
        setBorderColor(rgbToHex(Number(match[0]), Number(match[1]), Number(match[2])));
      }
    } else {
      setHasBorderColor(false);
      setBorderColor('#000000');
    }

    // Typography
    setFontFamily(style.fontFamily || computed.fontFamily.split(',')[0].replace(/['"]/g, '') || 'Inter');
    setFontSize(style.fontSize ? style.fontSize.replace('px', '') : computed.fontSize.replace('px', ''));
    setLineHeight(style.lineHeight ? style.lineHeight.replace('px', '') : '24');
    setIsBold(style.fontWeight === 'bold' || computed.fontWeight === '700' || computed.fontWeight === 'bold');
    setIsItalic(style.fontStyle === 'italic' || computed.fontStyle === 'italic');
    setIsUnderline(style.textDecoration.includes('underline') || computed.textDecoration.includes('underline'));
    setIsStrike(style.textDecoration.includes('line-through') || computed.textDecoration.includes('line-through'));
    
    const alignVal = style.textAlign || computed.textAlign;
    setAlignment((alignVal === 'left' || alignVal === 'center' || alignVal === 'right' || alignVal === 'justify') ? alignVal : 'left');

    // Spacing
    setPadding({
      top: (style.paddingTop || computed.paddingTop).replace('px', ''),
      right: (style.paddingRight || computed.paddingRight).replace('px', ''),
      bottom: (style.paddingBottom || computed.paddingBottom).replace('px', ''),
      left: (style.paddingLeft || computed.paddingLeft).replace('px', '')
    });
    setMargin({
      top: (style.marginTop || computed.marginTop).replace('px', ''),
      right: (style.marginRight || computed.marginRight).replace('px', ''),
      bottom: (style.marginBottom || computed.marginBottom).replace('px', ''),
      left: (style.marginLeft || computed.marginLeft).replace('px', '')
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen to custom focus event dispatched from editable elements
    const handleActiveFocus = (e: Event) => {
      const el = (e as CustomEvent).detail as HTMLElement;
      if (el && (el.contentEditable === 'true' || el.hasAttribute('contenteditable'))) {
        if (activeElRef.current !== el) {
          setActiveEl(el);
          loadElementStyles(el);
        }
        setTimeout(() => updatePosition(el), 30);
      }
    };

    // Listen to focusin globally across the page (keep open at all times once active)
    const handleFocusIn = () => {
      setTimeout(() => {
        if (isColorPickerOpenRef.current) return;
        const active = document.activeElement as HTMLElement;
        if (!active) return;

        // Check if focus shifted to an editable element
        const isEditable = active.hasAttribute('contenteditable') || 
                           active.closest('[contenteditable="true"]') !== null ||
                           active.closest('[contenteditable]') !== null;

        if (isEditable) {
          const editableEl = (active.hasAttribute('contenteditable') 
            ? active 
            : (active.closest('[contenteditable="true"]') || active.closest('[contenteditable]'))) as HTMLElement;
            
          if (activeElRef.current !== editableEl) {
            setActiveEl(editableEl);
            loadElementStyles(editableEl);
          }
          setTimeout(() => updatePosition(editableEl), 30);
        }
      }, 50);
    };

    const handleWindowFocus = () => {
      isColorPickerOpenRef.current = false;
    };

    const handleScrollOrResize = () => {
      const currentActive = activeElRef.current;
      if (currentActive) {
        updatePosition(currentActive);
      }
    };

    // Hide toolbar immediately if visual edit mode is disabled
    const handleLiveEditToggle = () => {
      const isModeOn = localStorage.getItem('liveEditMode') === 'true';
      if (!isModeOn) {
        setActiveEl(null);
        setActivePopover(null);
      }
    };

    window.addEventListener('activeEditableFocus', handleActiveFocus);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('liveEditToggle', handleLiveEditToggle);

    return () => {
      window.removeEventListener('activeEditableFocus', handleActiveFocus);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('liveEditToggle', handleLiveEditToggle);
    };
  }, []);

  // RequestAnimationFrame tracking loop to keep position synced during DOM updates/slides
  useEffect(() => {
    if (!activeEl) return;
    
    let frameId: number;
    const tick = () => {
      if (activeElRef.current) {
        updatePosition(activeElRef.current);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [activeEl]);

  // Apply styling properties in real-time
  const applyStyles = (styles: Record<string, string>) => {
    const currentActive = activeElRef.current;
    if (!currentActive) return;
    Object.entries(styles).forEach(([key, val]) => {
      (currentActive.style as any)[key] = val;
    });
  };

  const handleBgToggle = (enabled: boolean) => {
    setHasBgColor(enabled);
    applyStyles({ backgroundColor: enabled ? bgColor : 'transparent' });
  };

  const handleBgColorChange = (hex: string) => {
    setBgColor(hex);
    if (hasBgColor) {
      applyStyles({ backgroundColor: hex });
    }
  };

  const handleBorderColorToggle = (enabled: boolean) => {
    setHasBorderColor(enabled);
    applyStyles({ borderColor: enabled ? borderColor : 'transparent' });
  };

  const handleBorderColorChange = (hex: string) => {
    setBorderColor(hex);
    if (hasBorderColor) {
      applyStyles({ borderColor: hex });
    }
  };

  const handleBorderStrokeChange = (val: string) => {
    setStrokeWidth(val);
    applyStyles({ borderWidth: `${val}px` });
  };

  const handleBorderStyleChange = (val: string) => {
    setBorderStyle(val);
    applyStyles({ borderStyle: val });
  };

  const handleBorderRadiusChange = (val: string) => {
    setBorderRadius(val);
    applyStyles({ borderRadius: `${val}px` });
  };

  const handleSpacingChange = (type: 'padding' | 'margin', side: 'top' | 'right' | 'bottom' | 'left', val: string) => {
    if (type === 'padding') {
      const newPadding = { ...padding, [side]: val };
      setPadding(newPadding);
      applyStyles({
        paddingTop: `${newPadding.top}px`,
        paddingRight: `${newPadding.right}px`,
        paddingBottom: `${newPadding.bottom}px`,
        paddingLeft: `${newPadding.left}px`
      });
    } else {
      const newMargin = { ...margin, [side]: val };
      setMargin(newMargin);
      applyStyles({
        marginTop: `${newMargin.top}px`,
        marginRight: `${newMargin.right}px`,
        marginBottom: `${newMargin.bottom}px`,
        marginLeft: `${newMargin.left}px`
      });
    }
  };

  const exec = (command: string, value: string = '') => {
    const currentActive = activeElRef.current;
    document.execCommand(command, false, value);
    if (currentActive) currentActive.focus();
  };

  const handleAlignment = (align: 'left' | 'center' | 'right' | 'justify') => {
    setAlignment(align);
    applyStyles({ textAlign: align });
  };

  const handleTypographyChange = (key: 'fontFamily' | 'fontSize' | 'lineHeight', val: string) => {
    if (key === 'fontFamily') setFontFamily(val);
    if (key === 'fontSize') setFontSize(val);
    if (key === 'lineHeight') setLineHeight(val);
    applyStyles({ [key]: key === 'fontFamily' ? val : `${val}px` });
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentActive = activeElRef.current;
    if (currentActive) {
      currentActive.blur(); // Saves content + all inline styles to Firestore
      setActiveEl(null);
      setActivePopover(null);
    }
  };

  if (!activeEl) return null;

  return (
    <div 
      ref={toolbarRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-[99999] bg-slate-900/95 text-white border border-slate-700/80 rounded-xl p-1.5 shadow-2xl flex items-center gap-1 backdrop-blur-md transition-all duration-150 select-none font-sans"
    >
      {/* Background Color Trigger */}
      <button 
        onMouseDown={(e) => { e.preventDefault(); setActivePopover(activePopover === 'background' ? null : 'background'); }}
        title="Background Color"
        className={`p-1.5 hover:bg-slate-800 rounded-md transition-colors ${activePopover === 'background' ? 'bg-indigo-600 hover:bg-indigo-600' : 'text-slate-200 hover:text-white'}`}
      >
        <PaintBucket size={14} />
      </button>

      {/* Border Style Trigger */}
      <button 
        onMouseDown={(e) => { e.preventDefault(); setActivePopover(activePopover === 'borderStyle' ? null : 'borderStyle'); }}
        title="Border Styles"
        className={`p-1.5 hover:bg-slate-800 rounded-md transition-colors ${activePopover === 'borderStyle' ? 'bg-indigo-600 hover:bg-indigo-600' : 'text-slate-200 hover:text-white'}`}
      >
        <Sliders size={14} />
      </button>

      {/* Border Color Trigger */}
      <button 
        onMouseDown={(e) => { e.preventDefault(); setActivePopover(activePopover === 'borderColor' ? null : 'borderColor'); }}
        title="Border Color"
        className={`p-1.5 hover:bg-slate-800 rounded-md transition-colors ${activePopover === 'borderColor' ? 'bg-indigo-600 hover:bg-indigo-600' : 'text-slate-200 hover:text-white'}`}
      >
        <Type size={14} className="border border-slate-500 rounded px-0.5" />
      </button>

      {/* Typography Styles Trigger */}
      <button 
        onMouseDown={(e) => { e.preventDefault(); setActivePopover(activePopover === 'typography' ? null : 'typography'); }}
        title="Typography Options"
        className={`p-1.5 hover:bg-slate-800 rounded-md transition-colors text-xs font-black px-2 ${activePopover === 'typography' ? 'bg-indigo-600 hover:bg-indigo-600' : 'text-slate-200 hover:text-white'}`}
      >
        Aa
      </button>

      {/* Padding/Margin Spacing Trigger */}
      <button 
        onMouseDown={(e) => { e.preventDefault(); setActivePopover(activePopover === 'spacing' ? null : 'spacing'); }}
        title="Layout Spacing"
        className={`p-1.5 hover:bg-slate-800 rounded-md transition-colors ${activePopover === 'spacing' ? 'bg-indigo-600 hover:bg-indigo-600' : 'text-slate-200 hover:text-white'}`}
      >
        <Maximize size={14} className="rotate-45" />
      </button>

      <div className="w-[1px] h-5 bg-slate-700/60 mx-1" />

      {/* Actions (Undo / Eraser) */}
      <button 
        onMouseDown={(e) => { e.preventDefault(); exec('undo'); }} 
        title="Undo"
        className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white"
      >
        <Undo size={14} />
      </button>
      <button 
        onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }} 
        title="Clear Formatting"
        className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white"
      >
        <Eraser size={14} />
      </button>

      {/* Submit Button */}
      <button 
        onMouseDown={handleSubmit}
        className="ml-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow-lg shadow-emerald-950/20 animate-pulse"
      >
        <Check size={12} />
        <span>Submit</span>
      </button>

      {/* ========================================================
          POPOVER MENUS (Styled matching user specifications)
         ======================================================== */}

      {/* 1. Background Color Popover */}
      {activePopover === 'background' && (
        <div className="absolute top-12 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-4 shadow-2xl z-50 w-72 flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
            <input 
              type="checkbox" 
              checked={hasBgColor} 
              onChange={(e) => handleBgToggle(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500" 
            />
            <span>Background color</span>
          </label>

          {/* Canvas Spectrum Simulator */}
          <div className="w-full h-36 rounded-lg relative overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            {/* Real HTML Color Picker in a styled frame */}
            <input 
              type="color" 
              value={bgColor}
              onMouseDown={() => { isColorPickerOpenRef.current = true; }}
              onChange={(e) => handleBgColorChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-crosshair"
            />
            {/* Styled overlay simulating HSV space */}
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{
                background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, hsl(${bgHue}, 100%, 50%))`
              }} 
            />
            <div className="absolute z-10 bg-slate-950/75 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-slate-700 pointer-events-none uppercase">
              Click to select color
            </div>
          </div>

          {/* Hue slider */}
          <input 
            type="range" 
            min="0" 
            max="360" 
            value={bgHue}
            onChange={(e) => {
              const hue = Number(e.target.value);
              setBgHue(hue);
              handleBgColorChange(`hsl(${hue}, 100%, 50%)`);
            }}
            className="w-full h-1.5 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-red-500 rounded-lg appearance-none cursor-pointer"
          />

          {/* Hex Input */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400">Hex</span>
            <input 
              type="text" 
              value={bgColor.toUpperCase()}
              onChange={(e) => handleBgColorChange(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100" 
            />
          </div>

          {/* RGB Inputs */}
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(hexToRgb(bgColor)).map(([key, val]) => (
              <div key={key} className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">{key}</span>
                <input 
                  type="number" 
                  min="0" 
                  max="255" 
                  value={val}
                  onChange={(e) => {
                    const rgb = hexToRgb(bgColor);
                    const newVal = Math.max(0, Math.min(255, Number(e.target.value)));
                    if (key === 'r') handleBgColorChange(rgbToHex(newVal, rgb.g, rgb.b));
                    if (key === 'g') handleBgColorChange(rgbToHex(rgb.r, newVal, rgb.b));
                    if (key === 'b') handleBgColorChange(rgbToHex(rgb.r, rgb.g, newVal));
                  }}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-center text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none text-slate-800 dark:text-slate-100" 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Border Style Popover */}
      {activePopover === 'borderStyle' && (
        <div className="absolute top-12 left-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-4 shadow-2xl z-50 w-52 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400">Stroke width (px)</span>
            <input 
              type="number" 
              min="0"
              max="20"
              value={strokeWidth} 
              onChange={(e) => handleBorderStrokeChange(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none" 
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400">Style</span>
            <select 
              value={borderStyle}
              onChange={(e) => handleBorderStyleChange(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="none">None</option>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400">Radius (px)</span>
            <input 
              type="number" 
              min="0"
              max="100"
              value={borderRadius} 
              onChange={(e) => handleBorderRadiusChange(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none" 
            />
          </div>
        </div>
      )}

      {/* 3. Border Color Popover */}
      {activePopover === 'borderColor' && (
        <div className="absolute top-12 left-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-4 shadow-2xl z-50 w-72 flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
            <input 
              type="checkbox" 
              checked={hasBorderColor} 
              onChange={(e) => handleBorderColorToggle(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500" 
            />
            <span>Border color</span>
          </label>

          {/* Canvas Spectrum Simulator */}
          <div className="w-full h-36 rounded-lg relative overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <input 
              type="color" 
              value={borderColor}
              onMouseDown={() => { isColorPickerOpenRef.current = true; }}
              onChange={(e) => handleBorderColorChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-crosshair"
            />
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{
                background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, hsl(${borderHue}, 100%, 50%))`
              }} 
            />
            <div className="absolute z-10 bg-slate-950/75 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-slate-700 pointer-events-none uppercase">
              Click to select color
            </div>
          </div>

          {/* Hue slider */}
          <input 
            type="range" 
            min="0" 
            max="360" 
            value={borderHue}
            onChange={(e) => {
              const hue = Number(e.target.value);
              setBorderHue(hue);
              handleBorderColorChange(`hsl(${hue}, 100%, 50%)`);
            }}
            className="w-full h-1.5 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-red-500 rounded-lg appearance-none cursor-pointer"
          />

          {/* Hex Input */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400">Hex</span>
            <input 
              type="text" 
              value={borderColor.toUpperCase()}
              onChange={(e) => handleBorderColorChange(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100" 
            />
          </div>

          {/* RGB Inputs */}
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(hexToRgb(borderColor)).map(([key, val]) => (
              <div key={key} className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">{key}</span>
                <input 
                  type="number" 
                  min="0" 
                  max="255" 
                  value={val}
                  onChange={(e) => {
                    const rgb = hexToRgb(borderColor);
                    const newVal = Math.max(0, Math.min(255, Number(e.target.value)));
                    if (key === 'r') handleBorderColorChange(rgbToHex(newVal, rgb.g, rgb.b));
                    if (key === 'g') handleBorderColorChange(rgbToHex(rgb.r, newVal, rgb.b));
                    if (key === 'b') handleBorderColorChange(rgbToHex(rgb.r, rgb.g, newVal));
                  }}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-center text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none text-slate-800 dark:text-slate-100" 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Typography Popover */}
      {activePopover === 'typography' && (
        <div className="absolute top-12 left-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-4 shadow-2xl z-50 w-64 flex flex-col gap-3 text-left">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400">Font family</span>
            <select 
              value={fontFamily}
              onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="Inter">Inter</option>
              <option value="Outfit">Outfit</option>
              <option value="Playfair Display">Playfair</option>
              <option value="system-ui">System</option>
            </select>
          </div>

          {/* Style buttons */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400">Style</span>
            <div className="grid grid-cols-4 gap-1 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg">
              <button 
                onMouseDown={(e) => { e.preventDefault(); setIsBold(!isBold); exec('bold'); }}
                className={`py-1 text-xs font-bold rounded ${isBold ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                B
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); setIsItalic(!isItalic); exec('italic'); }}
                className={`py-1 text-xs italic rounded ${isItalic ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                I
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); setIsUnderline(!isUnderline); exec('underline'); }}
                className={`py-1 text-xs underline rounded ${isUnderline ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                U
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); setIsStrike(!isStrike); exec('strikeThrough'); }}
                className={`py-1 text-xs line-through rounded ${isStrike ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                T
              </button>
            </div>
          </div>

          {/* Align buttons */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400">Align</span>
            <div className="grid grid-cols-4 gap-1 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg text-slate-400">
              <button 
                onMouseDown={(e) => { e.preventDefault(); handleAlignment('left'); }}
                className={`py-1 rounded flex items-center justify-center ${alignment === 'left' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <AlignLeft size={12} />
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); handleAlignment('center'); }}
                className={`py-1 rounded flex items-center justify-center ${alignment === 'center' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <AlignCenter size={12} />
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); handleAlignment('right'); }}
                className={`py-1 rounded flex items-center justify-center ${alignment === 'right' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <AlignRight size={12} />
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); handleAlignment('justify'); }}
                className={`py-1 rounded flex items-center justify-center ${alignment === 'justify' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <AlignJustify size={12} />
              </button>
            </div>
          </div>

          {/* Font size / Line height */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400">Font size (px)</span>
              <input 
                type="number" 
                min="8"
                max="120"
                value={fontSize} 
                onChange={(e) => handleTypographyChange('fontSize', e.target.value)}
                className="border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-center text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400">Line height (px)</span>
              <input 
                type="number" 
                min="8"
                max="160"
                value={lineHeight} 
                onChange={(e) => handleTypographyChange('lineHeight', e.target.value)}
                className="border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-center text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none" 
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Spacing Popover */}
      {activePopover === 'spacing' && (
        <div className="absolute top-12 left-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-4 shadow-2xl z-50 w-52 flex flex-col gap-3 text-left">
          {/* Padding */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400">Padding (px)</span>
            <div className="grid grid-cols-4 gap-1.5">
              {['top', 'right', 'bottom', 'left'].map((side) => (
                <div key={side} className="flex flex-col items-center gap-0.5">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={padding[side as keyof typeof padding]} 
                    onChange={(e) => handleSpacingChange('padding', side as any, e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-lg py-1 text-center text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none" 
                  />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{side[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Margin */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400">Margin (px)</span>
            <div className="grid grid-cols-4 gap-1.5">
              {['top', 'right', 'bottom', 'left'].map((side) => (
                <div key={side} className="flex flex-col items-center gap-0.5">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={margin[side as keyof typeof margin]} 
                    onChange={(e) => handleSpacingChange('margin', side as any, e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-lg py-1 text-center text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none" 
                  />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{side[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingEditorToolbar;
