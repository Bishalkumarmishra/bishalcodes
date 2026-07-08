import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface EditableTextProps {
  collection: string;
  document: string;
  field: string;
  fallback: string;
  className?: string;
  isTextArea?: boolean;
  isRichText?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  collection,
  document: docId,
  field,
  fallback,
  className = '',
  isTextArea = false,
  isRichText = true
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [text, setText] = useState(fallback);
  const [elementStyles, setElementStyles] = useState<React.CSSProperties>({});
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMode = () => {
      setIsEditMode(localStorage.getItem('liveEditMode') === 'true');
    };
    checkMode();
    window.addEventListener('liveEditToggle', checkMode);
    return () => window.removeEventListener('liveEditToggle', checkMode);
  }, []);

  useEffect(() => {
    let active = true;
    const loadValue = async () => {
      try {
        const snap = await getDoc(doc(db, collection, docId));
        if (snap.exists() && active) {
          const val = snap.data()[field];
          if (val !== undefined) {
            setText(val);
          }
          const savedStyles = snap.data()[`${field}_styles`] || {};
          setElementStyles(savedStyles);
        }
      } catch (err) {
        console.warn(`Error loading editable field ${collection}/${docId}/${field}:`, err);
      }
    };
    loadValue();
    return () => { active = false; };
  }, [collection, docId, field]);

  const handleFocus = (e: React.FocusEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => {
    if (isEditMode) {
      window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
    }
  };

  const handleBlur = async () => {
    if (!elementRef.current) return;
    const newVal = isRichText 
      ? elementRef.current.innerHTML 
      : (isTextArea ? elementRef.current.innerText : elementRef.current.textContent || '');
      
    // Capture style settings
    const inlineStyles: Record<string, string> = {};
    const element = elementRef.current;
    const styleProps = [
      'backgroundColor', 'borderWidth', 'borderStyle', 'borderRadius', 'borderColor',
      'fontSize', 'lineHeight', 'fontFamily',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'textAlign'
    ];
    
    styleProps.forEach(prop => {
      const val = (element.style as any)[prop];
      if (val !== undefined && val !== null && val !== '') {
        inlineStyles[prop] = val;
      }
    });

    if (newVal === text && JSON.stringify(inlineStyles) === JSON.stringify(elementStyles)) return;
    
    setText(newVal);
    setElementStyles(inlineStyles);
    window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));

    try {
      await updateDoc(doc(db, collection, docId), {
        [field]: newVal,
        [`${field}_styles`]: inlineStyles
      });
      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
    } catch (err) {
      console.error(`Error saving editable field ${collection}/${docId}/${field}:`, err);
    }
  };

  const Component = isTextArea ? 'div' : 'span';

  if (isRichText) {
    return (
      <Component
        ref={elementRef as any}
        data-editable-id={`${collection}-${docId}-${field}`}
        contentEditable={isEditMode}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onFocus={handleFocus}
        onClick={handleFocus}
        style={elementStyles}
        className={`${className} ${
          isEditMode 
            ? 'outline-dashed outline-1 outline-amber-500/80 p-0.5 rounded cursor-text bg-amber-50/5 dark:bg-amber-950/10' 
            : ''
        }`}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  return (
    <Component
      ref={elementRef as any}
      data-editable-id={`${collection}-${docId}-${field}`}
      contentEditable={isEditMode}
      suppressContentEditableWarning
      onBlur={handleBlur}
      onFocus={handleFocus}
      onClick={handleFocus}
      className={`${className} ${
        isEditMode 
          ? 'outline-dashed outline-1 outline-amber-500/80 p-0.5 rounded cursor-text bg-amber-50/5 dark:bg-amber-950/10' 
          : ''
      }`}
      style={isTextArea ? { ...elementStyles, whiteSpace: 'pre-wrap' } : elementStyles}
    >
      {text}
    </Component>
  );
};

export default EditableText;
