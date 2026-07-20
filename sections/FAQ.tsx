import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import EditableText from '../components/EditableText';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggle: () => void;
  index: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, toggle, index }) => {
  return (
    <div 
      className={`border-b border-slate-100 transition-colors duration-200 ${isOpen ? 'bg-slate-50/50' : 'bg-transparent'}`}
    >
      <button
        onClick={toggle}
        className="w-full py-5 flex items-center justify-between gap-4 text-left group"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${isOpen ? 'bg-slate-950 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
             <HelpCircle size={16} />
          </span>
          <span className={`text-sm sm:text-base font-semibold transition-colors leading-tight ${isOpen ? 'text-slate-950' : 'text-slate-800'}`}>
            <EditableText collection="settings" document="faq" field={`faq_q_${index}`} fallback={question} />
          </span>
        </span>
        <div className={`shrink-0 w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition-all ${isOpen ? 'rotate-180 border-slate-950 text-slate-950' : 'text-slate-300'}`}>
          {isOpen ? <Minus size={12} /> : <Plus size={12} />}
        </div>
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[300px] opacity-100 pb-5' : 'max-h-0 opacity-0'}`}
      >
        <div className="pl-11 pr-4">
          <div className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal border-l border-slate-200 pl-4 text-left">
            <EditableText collection="settings" document="faq" field={`faq_a_${index}`} fallback={answer} isTextArea />
          </div>
        </div>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How long does a typical website project take?",
      answer: "A standard informative website usually takes 7-14 days. Complex e-commerce platforms or custom web applications with advanced logic can take 4-8 weeks."
    },
    {
      question: "What tech stack do you recommend for performance?",
      answer: "For maximum speed and SEO, I primarily use React/Next.js for the frontend and Node.js or PHP for the backend."
    },
    {
      question: "How does the Rs. 999 booking slot work?",
      answer: "The Rs. 999 is a commitment deposit for serious clients. It includes a 30-minute consultancy and is fully adjusted into your final project quote."
    },
    {
      question: "Do you offer post-launch support?",
      answer: "Yes, every project comes with a 1-year warranty. We also offer maintenance retainers for security and performance monitoring."
    },
    {
      question: "Can you migrate my existing slow website?",
      answer: "Absolutely. I specialize in rebuilding legacy sites using modern architecture for better performance and rankings."
    }
  ];

  return (
    <section id="faq" className="py-10 sm:py-14 bg-slate-50 relative overflow-hidden border-t border-slate-200/60">
      <div className="w-full px-[5vw] mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-slate-900 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            <EditableText collection="settings" document="faq" field="title" fallback="Frequently Asked Questions" />
          </h2>
          <div className="text-slate-500 text-sm sm:text-base mt-2 font-normal">
            <EditableText collection="settings" document="faq" field="description" fallback="Information about development timelines, processes, and tools." />
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              toggle={() => setOpenIndex(openIndex === index ? null : index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
