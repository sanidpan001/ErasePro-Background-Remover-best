import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { removeBackground } from '@imgly/background-removal';
import {
  ArrowDownToLine,
  ArrowRight,
  ChevronDown,
  CircleCheck,
  Eraser,
  FileImage,
  FileOutput,
  ImagePlus,
  LockKeyhole,
  Menu,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react';

type ToolState = 'idle' | 'processing' | 'complete' | 'error';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Logo() {
  return (
    <a href="#home" className="flex items-center gap-2.5" data-testid="link-logo">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#173847] text-[#d8f45d] shadow-[4px_4px_0_#b8cfce]">
        <Eraser size={19} strokeWidth={2.4} />
        <span className="absolute bottom-[6px] right-[6px] h-1.5 w-1.5 rounded-full bg-[#d8f45d]" />
      </span>
      <span className="text-[18px] font-bold tracking-[-.04em] text-[#173847]">Erase<span className="text-[#087f78]">Pro</span></span>
    </a>
  );
}

function AdSpace({ id, className = '' }: { id: string; className?: string }) {
  return <div id={id} className={`ad-space flex items-center justify-center rounded-xl ${className}`} data-testid={`ad-space-${id}`}>Ad Space</div>;
}

function TrustPills() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-medium tracking-[.16em] text-[#557178]" data-testid="trust-messaging">
      <span className="flex items-center gap-1.5"><LockKeyhole size={12} className="text-[#087f78]" /> NO SIGN IN</span>
      <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#087f78]" /> NO WATERMARK</span>
      <span className="flex items-center gap-1.5"><CircleCheck size={12} className="text-[#087f78]" /> NO SUBSCRIPTION</span>
    </div>
  );
}

function FilePreview({ src, label, checker = false }: { src: string; label: string; checker?: boolean }) {
  return (
    <div className="flex min-h-[270px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#d5e1df] bg-[#f1f5f3]">
      <div className="flex items-center justify-between border-b border-[#d5e1df] px-4 py-3">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[.18em] text-[#557178]">{label}</span>
        {checker && <span className="rounded-full bg-[#e2f3ea] px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-[#087f78]">Transparent</span>}
      </div>
      <div className={`relative flex min-h-[225px] flex-1 items-center justify-center p-5 ${checker ? 'checkerboard' : 'bg-[#e7eeec]'}`}>
        <img src={src} alt={`${label} preview`} className="image-fit max-h-[220px] rounded-lg shadow-[0_14px_28px_rgba(22,53,62,.12)]" data-testid={`img-preview-${label.toLowerCase().replace(/\s/g, '-')}`} />
      </div>
    </div>
  );
}

function ProcessingPanel({ progress, fileName }: { progress: number; fileName: string }) {
  const stage = progress < 35 ? 'Reading pixels' : progress < 72 ? 'Finding the subject' : 'Cleaning the edges';
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[#176f6a] bg-[#173847] p-6 text-[#f6faf6] shadow-[0_18px_48px_rgba(23,56,71,.18)] sm:p-9" data-testid="status-processing">
      <div className="scan-line" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#d8f45d]">Erase engine / working</p>
          <h3 className="text-2xl font-semibold tracking-[-.04em]">Making the edges immaculate.</h3>
          <p className="mt-2 max-w-md text-sm text-[#b8cfce]">{fileName} is being processed locally in your browser.</p>
        </div>
        <div className="orbit-ring relative hidden h-12 w-12 shrink-0 rounded-full border border-[#6dbdb1]/35 sm:block">
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#d8f45d]" />
          <Eraser className="absolute inset-0 m-auto text-[#b8cfce]" size={18} />
        </div>
      </div>
      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[.14em]">
          <span className="text-[#b8cfce]">{stage}</span>
          <span className="text-[#d8f45d]">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#365866]">
          <div className="h-full rounded-full bg-[#d8f45d] transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ToolState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setOriginalUrl('');
    setResultUrl('');
    setProgress(0);
    setError('');
    setState('idle');
    if (inputRef.current) inputRef.current.value = '';
  };

  const processFile = async (nextFile: File) => {
    setError('');
    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setState('error');
      setError('That file type is not supported. Please choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setState('error');
      setError('That image is over 10MB. Choose a smaller file and try again.');
      return;
    }
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const previewUrl = URL.createObjectURL(nextFile);
    setFile(nextFile);
    setOriginalUrl(previewUrl);
    setResultUrl('');
    setProgress(3);
    setState('processing');
    try {
      const resultBlob = await removeBackground(nextFile, {
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) setProgress(Math.min(96, Math.max(4, (current / total) * 100)));
        },
      });
      setResultUrl(URL.createObjectURL(resultBlob));
      setProgress(100);
      setState('complete');
    } catch {
      setState('error');
      setError('We could not process that image. Try a different file or reload and try again.');
    }
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) void processFile(selected);
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) void processFile(dropped);
  };

  return (
    <div className="erasepro-shell min-h-[100dvh] overflow-x-hidden bg-[#f5f7f2] text-[#173847]">
      <header className="sticky top-0 z-40 border-b border-[#d9e4e0]/80 bg-[#f5f7f2]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <a href="#home" className="text-sm font-medium text-[#173847] transition-colors hover:text-[#087f78]" data-testid="link-home">Home</a>
            <div className="relative">
              <button type="button" onClick={() => setToolsOpen((open) => !open)} className="flex items-center gap-1.5 text-sm font-medium text-[#557178] transition-colors hover:text-[#087f78]" aria-expanded={toolsOpen} data-testid="button-tools">
                Tools <ChevronDown size={15} className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
              </button>
              {toolsOpen && (
                <div className="absolute left-1/2 top-9 w-52 -translate-x-1/2 rounded-2xl border border-[#d5e1df] bg-[#fbfcf8] p-2 shadow-[0_16px_40px_rgba(23,56,71,.12)]" data-testid="menu-tools">
                  <a href="#how-it-works" onClick={() => setToolsOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-[#557178] hover:bg-[#e9f3ef] hover:text-[#173847]" data-testid="link-how-it-works">How it works</a>
                  <a href="#why-erasepro" onClick={() => setToolsOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-[#557178] hover:bg-[#e9f3ef] hover:text-[#173847]" data-testid="link-why-erasepro">Why ErasePro</a>
                </div>
              )}
            </div>
            <a href="mailto:hello@erasepro.app" className="text-sm font-medium text-[#557178] transition-colors hover:text-[#087f78]" data-testid="link-contact">Contact</a>
          </nav>
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-lg p-2 text-[#173847] md:hidden" aria-label="Toggle navigation menu" aria-expanded={mobileMenuOpen} data-testid="button-mobile-menu">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="border-t border-[#d9e4e0] bg-[#f5f7f2] px-5 py-3 md:hidden" aria-label="Mobile navigation" data-testid="mobile-navigation">
            <a href="#home" onClick={() => setMobileMenuOpen(false)} className="block border-b border-[#d9e4e0] py-3 text-sm font-medium" data-testid="mobile-link-home">Home</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block border-b border-[#d9e4e0] py-3 text-sm font-medium" data-testid="mobile-link-tools">Tools</a>
            <a href="mailto:hello@erasepro.app" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-sm font-medium" data-testid="mobile-link-contact">Contact</a>
          </nav>
        )}
      </header>

      <main id="home">
        <AdSpace id="ad-top" className="mx-auto mt-5 h-10 max-w-[728px] px-5" />
        <section className="mx-auto max-w-[1200px] px-5 pb-14 pt-14 sm:px-8 sm:pt-20 lg:pb-20 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.07fr] lg:gap-16">
            <div className="animate-rise">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cbded9] bg-[#eaf3ed] px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[.15em] text-[#087f78]" data-testid="badge-product">
                <Sparkles size={12} /> Built for the clean cut
              </div>
              <h1 className="max-w-[610px] text-[clamp(2.75rem,6vw,5.75rem)] font-semibold leading-[.96] tracking-[-.075em] text-[#173847]" data-testid="heading-hero">
                Remove Background <span className="text-[#087f78]">in 1 Click</span> <span className="whitespace-nowrap">- Free,</span> No Watermark
              </h1>
              <p className="mt-7 max-w-[470px] text-base leading-7 text-[#557178] sm:text-lg" data-testid="text-hero-subtitle">
                100% Free, No Sign Up, No Watermark, Unlimited
              </p>
              <div className="mt-8 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-[#557178]" data-testid="supported-types">
                <span className="rounded-md bg-[#e8eeeb] px-2.5 py-1.5">JPG</span>
                <span className="rounded-md bg-[#e8eeeb] px-2.5 py-1.5">PNG</span>
                <span className="rounded-md bg-[#e8eeeb] px-2.5 py-1.5">WEBP</span>
                <span className="px-1.5 py-1.5 text-[#8da09f]">MAX 10MB</span>
              </div>
            </div>
            <div className="animate-rise animate-rise-delay-1">
              {state === 'idle' && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inputRef.current?.click(); } }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={onDrop}
                  className="upload-dash relative flex min-h-[350px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[26px] bg-[#edf6ef] px-7 py-12 text-center transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-1 hover:bg-[#e7f3ea] hover:shadow-[0_20px_42px_rgba(8,127,120,.12)] sm:min-h-[390px]"
                  data-testid="dropzone-upload"
                >
                  <div className="mb-6 flex h-[76px] w-[76px] items-center justify-center rounded-[24px] bg-[#d8f45d] text-[#173847] shadow-[7px_7px_0_#9cb5ad] transition-transform duration-300 group-hover:rotate-3">
                    <UploadCloud size={31} strokeWidth={1.8} />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-[-.04em]">Drop image or Click to upload</h2>
                  <p className="mt-2 text-sm text-[#557178]">JPG, PNG, WEBP · up to 10MB</p>
                  <div className="mt-8 flex items-center gap-2 rounded-full bg-[#fbfcf8] px-4 py-2 text-xs font-medium text-[#087f78] shadow-[0_5px_14px_rgba(23,56,71,.06)]">
                    <Zap size={13} fill="currentColor" /> Processing happens in your browser
                  </div>
                  <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={onInput} className="sr-only" data-testid="input-upload" />
                </div>
              )}
              {state === 'processing' && file && <ProcessingPanel progress={progress} fileName={file.name} />}
              {state === 'complete' && file && resultUrl && (
                <div className="rounded-[22px] border border-[#cbded9] bg-[#fbfcf8] p-5 shadow-[0_18px_48px_rgba(23,56,71,.1)] sm:p-6" data-testid="status-complete">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8f45d] text-[#173847]"><CircleCheck size={17} /></span>
                      <div><p className="text-sm font-semibold">Background removed.</p><p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#7b9290]">{formatSize(file.size)} · ready to save</p></div>
                    </div>
                    <button type="button" onClick={reset} className="rounded-lg p-2 text-[#7b9290] transition-colors hover:bg-[#e8eeeb] hover:text-[#173847]" aria-label="Reset and upload another image" data-testid="button-reset-small"><RefreshCw size={16} /></button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FilePreview src={originalUrl} label="Original" />
                    <FilePreview src={resultUrl} label="Result" checker />
                  </div>
                  <a href={resultUrl} download="erasepro-removed.png" className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#087f78] text-sm font-semibold text-[#f6faf6] shadow-[0_7px_0_#075d59] transition-[transform,box-shadow,background-color] hover:bg-[#0a9289] hover:shadow-[0_4px_0_#075d59] active:translate-y-1 active:shadow-none" data-testid="button-download">
                    <ArrowDownToLine size={17} /> Download HD (PNG)
                  </a>
                  <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[.14em] text-[#7b9290]">Transparent PNG · no watermark</p>
                </div>
              )}
              {state === 'error' && (
                <div className="rounded-[22px] border border-[#e7b5a8] bg-[#fff4f0] p-8 text-center shadow-[0_14px_35px_rgba(130,64,42,.08)]" data-testid="status-error">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7d7cd] text-[#a34f3e]"><FileImage size={25} /></div>
                  <h2 className="text-xl font-semibold tracking-[-.03em]">That one did not make the cut.</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#8a5b52]" data-testid="text-error">{error}</p>
                  <button type="button" onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173847] px-5 py-3 text-sm font-semibold text-[#f6faf6] transition-transform hover:-translate-y-0.5" data-testid="button-try-again"><RefreshCw size={15} /> Try another image</button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-9"><TrustPills /></div>
        </section>

        <section className="border-y border-[#d9e4e0] bg-[#edf3ee]" id="how-it-works">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-20 lg:py-24">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#087f78]">The short version</p>
              <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-[.98] tracking-[-.06em] sm:text-5xl">A clean cut, without the catch.</h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-[#557178]">ErasePro runs the entire edit on your device. Your image stays yours, and the download is actually ready for wherever you need it next.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { number: '01', icon: ImagePlus, title: 'Choose an image', copy: 'Drop a JPG, PNG, or WEBP up to 10MB.' },
                { number: '02', icon: Eraser, title: 'We erase it', copy: 'Our in-browser engine finds your subject and cleans the edges.' },
                { number: '03', icon: FileOutput, title: 'Take the PNG', copy: 'Download a crisp, transparent PNG. No account needed.' },
              ].map(({ number, icon: Icon, title, copy }) => (
                <article key={number} className="rounded-2xl border border-[#d5e1df] bg-[#f8faf6] p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(23,56,71,.08)]" data-testid={`card-step-${number}`}>
                  <div className="flex items-center justify-between"><Icon size={23} className="text-[#087f78]" strokeWidth={1.8} /><span className="font-mono text-[10px] text-[#a1b2b0]">{number}</span></div>
                  <h3 className="mt-10 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-5 text-[#557178]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1200px] gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_300px] lg:py-24" id="why-erasepro">
          <div>
            <div className="mb-10 flex items-end justify-between gap-5">
              <div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#087f78]">Why it feels different</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Good tools get out of the way.</h2></div>
              <ArrowRight className="hidden text-[#087f78] sm:block" size={28} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: '01', title: '100% Free Forever', copy: 'No trial clock. No surprise paywall after the first image.' },
                { icon: '02', title: 'No Watermark', copy: 'Your exported PNG is clean, sharp, and unmistakably yours.' },
                { icon: '03', title: 'No Sign Up Needed', copy: 'Open the page, make the cut, keep moving. That is the whole flow.' },
              ].map((item) => (
                <div key={item.icon} className="border-l-2 border-[#d8f45d] pl-5" data-testid={`feature-${item.icon}`}>
                  <span className="font-mono text-[10px] text-[#087f78]">{item.icon}</span>
                  <h3 className="mt-7 text-lg font-semibold tracking-[-.03em]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#557178]">{item.copy}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-3 rounded-2xl bg-[#173847] p-5 text-[#f6faf6] sm:p-6" data-testid="badge-trust">
              <ShieldCheck size={21} className="text-[#d8f45d]" />
              <span className="text-sm font-medium">No Watermark, No Sign In Required</span>
              <span className="ml-auto font-mono text-[9px] uppercase tracking-[.15em] text-[#b8cfce]">private by design</span>
            </div>
          </div>
          <AdSpace id="ad-sidebar" className="min-h-[180px] lg:min-h-[280px]" />
        </section>

        <AdSpace id="ad-bottom" className="mx-auto mb-16 h-20 max-w-[970px] px-5 sm:mb-20" />
      </main>

      <footer className="border-t border-[#d9e4e0] bg-[#edf3ee]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3"><Logo /><span className="hidden h-4 w-px bg-[#cbded9] sm:block" /><span className="text-xs text-[#7b9290]">© 2026 ErasePro</span></div>
          <div className="flex gap-5 text-xs text-[#557178]"><a href="#privacy" className="hover:text-[#087f78]" data-testid="link-privacy">Privacy Policy</a><a href="#terms" className="hover:text-[#087f78]" data-testid="link-terms">Terms</a></div>
        </div>
        <div className="mx-auto flex max-w-[1200px] gap-8 px-5 pb-8 text-[11px] leading-5 text-[#7b9290] sm:px-8">
          <p id="privacy">Privacy first: your images are processed locally and never uploaded.</p>
          <p id="terms">Use ErasePro for images you have permission to edit.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return <Home />;
}

export default App;
