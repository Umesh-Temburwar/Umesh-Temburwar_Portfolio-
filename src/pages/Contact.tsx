import React, { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { Reveal } from '../components/Reveal';
import { IconLinkedin as Linkedin, IconInstagram as Instagram } from '../components/icons/BrandIcons';
import { Mail } from 'lucide-react';

// Custom github icon
const Github = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('Unable to send your message. Please try again.');

  const sendEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !formRef.current) return;

    const form = formRef.current;
    const formData = new FormData(form);
    const name = (formData.get('from_name') as string)?.trim();
    const email = (formData.get('from_email') as string)?.trim();
    const subject = (formData.get('subject') as string)?.trim();
    const message = (formData.get('message') as string)?.trim();

    if (!name || !email || !subject || !message) {
      setSubmitStatus('error');
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubmitStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      if (import.meta.env.DEV) {
        console.error("[EmailJS Diagnostics] Missing credentials:", {
          hasServiceId: !!serviceId,
          hasTemplateId: !!templateId,
          hasPublicKey: !!publicKey
        });
      }
      setSubmitStatus('error');
      setErrorMessage(
        import.meta.env.DEV
          ? 'EmailJS configuration is missing. Ensure VITE_EMAILJS_* keys are in .env.local and Vite has been restarted.'
          : 'Unable to send your message. Please try again.'
      );
      setIsSubmitting(false);
      return;
    }

    emailjs.sendForm(serviceId, templateId, form, {
      publicKey: publicKey,
    })
      .then((response) => {
        if (import.meta.env.DEV) {
          console.info("[EmailJS Diagnostics] Delivery success:", response.status, response.text);
        }
        setSubmitStatus('success');
        form.reset();
      })
      .catch((error: unknown) => {
        const errObj = error as { status?: number; text?: string };
        if (import.meta.env.DEV) {
          console.error("[EmailJS Diagnostics] Delivery failed:", errObj?.status, errObj?.text || 'Delivery failed');
          if (errObj?.status === 404 || errObj?.text === 'Account not found') {
            console.error(
              "[EmailJS Diagnostics] 'Account not found': The configured Public Key does not exist in EmailJS. Verify your Public Key under Account -> General in the EmailJS dashboard."
            );
          }
        }
        setSubmitStatus('error');
        setErrorMessage(
          import.meta.env.DEV && (errObj?.status === 404 || errObj?.text === 'Account not found')
            ? 'EmailJS error: Account not found. Verify your Public Key in EmailJS Dashboard.'
            : 'Unable to send your message. Please try again.'
        );
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto min-h-[calc(100vh-80px)] text-textMain pb-12">
      <div className="grid grid-cols-12 gap-6">

        <Reveal delay={200} className="col-span-12 lg:col-span-5 mb-12 lg:mb-0">
          <h3 className="text-3xl font-bold mb-4 uppercase tracking-tighter">Let's Connect</h3>
          <p className="text-xl text-textMuted mb-12">
            Find me on these platforms or reach out directly
          </p>

          <div className="flex flex-col gap-6">
            <a href="https://github.com/Umesh-Temburwar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group">
              <div className="w-14 h-14 border border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                <Github size={24} />
              </div>
              <div>
                <div className="font-bold text-lg group-hover:text-primary transition-colors">GitHub</div>
                <div className="text-textMuted font-mono text-sm">Check out my code and projects</div>
              </div>
            </a>

            <a href="https://www.linkedin.com/in/umesh-temburwar-673555373/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group">
              <div className="w-14 h-14 border border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                <Linkedin className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg group-hover:text-primary transition-colors">LinkedIn</div>
                <div className="text-textMuted font-mono text-sm">Connect with me professionally</div>
              </div>
            </a>

            <a href="https://www.instagram.com/umesh_temburwar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group">
              <div className="w-14 h-14 border border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg group-hover:text-primary transition-colors">Instagram</div>
                <div className="text-textMuted font-mono text-sm">Follow me for updates and behind-the-scenes</div>
              </div>
            </a>

            <a href="mailto:umeshtemburwar2002@gmail.com" className="flex items-center gap-6 group">
              <div className="w-14 h-14 border border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                <Mail size={24} />
              </div>
              <div>
                <div className="font-bold text-lg group-hover:text-primary transition-colors">Email</div>
                <div className="text-textMuted font-mono text-sm">Send me a direct email</div>
              </div>
            </a>
          </div>
        </Reveal>
        <Reveal delay={400} className="col-span-12 lg:col-span-6 lg:col-start-7">
          <form
            ref={formRef}
            onSubmit={sendEmail}
            className="flex flex-col gap-8"
          >
            <div className="border-b border-border pb-2 focus-within:border-primary transition-colors">
              <input name="from_name" type="text" placeholder="Your name" required className="w-full bg-transparent outline-none font-mono text-sm py-2 placeholder:text-textMuted/50 text-textMain" />
            </div>
            <div className="border-b border-border pb-2 focus-within:border-primary transition-colors">
              <input name="from_email" type="email" placeholder="you@email.com" required className="w-full bg-transparent outline-none font-mono text-sm py-2 placeholder:text-textMuted/50 text-textMain" />
            </div>
            <div className="border-b border-border pb-2 focus-within:border-primary transition-colors">
              <input name="subject" type="text" placeholder="Job opportunity / Project inquiry" required className="w-full bg-transparent outline-none font-mono text-sm py-2 placeholder:text-textMuted/50 text-textMain" />
            </div>
            <div className="border-b border-border pb-2 focus-within:border-primary transition-colors">
              <textarea name="message" placeholder="Tell me about your project or opportunity..." required rows={4} className="w-full bg-transparent outline-none font-mono text-sm py-2 placeholder:text-textMuted/50 resize-y text-textMain" />
            </div>

            {submitStatus === 'success' && (
              <div className="text-[#56D8E8] font-mono text-sm">Message sent successfully!</div>
            )}
            {submitStatus === 'error' && (
              <div className="text-red-500 font-mono text-sm">{errorMessage}</div>
            )}

            <button type="submit" disabled={isSubmitting} className="self-start px-8 py-4 bg-textMain text-background hover:bg-primary hover:text-background font-mono text-sm uppercase tracking-widest transition-colors flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Sending...' : 'Send Message'} {!isSubmitting && <Send size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
