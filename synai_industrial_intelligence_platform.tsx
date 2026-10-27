import React, { useState, useEffect, useRef } from 'react';
import { UI } from './src/i18n.js';
import { 
  ArrowUpRight, 
  ArrowRight, 
  FileText, 
  Upload, 
  Check, 
  AlertTriangle, 
  Terminal, 
  Search, 
  Crosshair, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  CornerDownLeft,
  SlidersHorizontal,
  Eye,
  Plus,
  Minus,
  RefreshCw,
  FileCode,
  Trash2
} from 'lucide-react';

// ============================================================================
// Query shortcuts only. These strings are not answers and contain no document text.
const PRESET_PROMPTS = [
  { id: 'PROMPT-COMPARE', labelKey: 'presetCompare', queryKey: 'presetCompareQ' },
  { id: 'PROMPT-LIMITS', labelKey: 'presetLimits', queryKey: 'presetLimitsQ' },
  { id: 'PROMPT-ABSENT', labelKey: 'presetAbsent', queryKey: 'presetAbsentQ' }
];

// ARCHITECTURAL CROSSHAIR INTERSECTION MARKER
// ============================================================================
const CrosshairMarker = ({ position = 'top-left' }) => {
  const posClasses = {
    'top-left': '-top-[5px] -left-[5px]',
    'top-right': '-top-[5px] -right-[5px]',
    'bottom-left': '-bottom-[5px] -left-[5px]',
    'bottom-right': '-bottom-[5px] -right-[5px]'
  };
  return (
    <span 
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 w-[9px] h-[9px] flex items-center justify-center select-none ${posClasses[position]}`}
    >
      <span className="absolute w-[9px] h-[1px] bg-[#0D0D0D]/40" />
      <span className="absolute w-[1px] h-[9px] bg-[#0D0D0D]/40" />
    </span>
  );
};

// ============================================================================
// TECHNICAL SVG SCHEMATICS FOR SOURCE INSPECTOR
// ============================================================================
const TechnicalSchematicSVG = ({ type }) => {
  if (type === 'FLANGE_TORQUE') {
    return (
      <svg viewBox="0 0 420 155" className="w-full h-auto bg-[#EFECE6] border border-[#E2E0DC] p-2">
        <defs>
          <pattern id="grid-flange" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" fill="none" stroke="#D8D5CE" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="420" height="155" fill="url(#grid-flange)" />
        {/* Flange Ring */}
        <circle cx="115" cy="78" r="56" fill="none" stroke="#0D0D0D" strokeWidth="1.2" />
        <circle cx="115" cy="78" r="32" fill="none" stroke="#0D0D0D" strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="115" cy="78" r="45" fill="none" stroke="#FF3B00" strokeWidth="0.8" strokeDasharray="2 2" />
        {/* Centerlines */}
        <line x1="48" y1="78" x2="182" y2="78" stroke="#686662" strokeWidth="0.6" strokeDasharray="4 2" />
        <line x1="115" y1="12" x2="115" y2="144" stroke="#686662" strokeWidth="0.6" strokeDasharray="4 2" />
        {/* 8 Bolt Holes with Sequence Callouts */}
        {[
          { angle: -90, seq: '01' },
          { angle: 90, seq: '02' },
          { angle: 0, seq: '03' },
          { angle: 180, seq: '04' },
          { angle: -45, seq: '05' },
          { angle: 135, seq: '06' },
          { angle: 45, seq: '07' },
          { angle: -135, seq: '08' }
        ].map((b, idx) => {
          const rad = (b.angle * Math.PI) / 180;
          const cx = 115 + 45 * Math.cos(rad);
          const cy = 78 + 45 * Math.sin(rad);
          return (
            <g key={idx}>
              <circle cx={cx} cy={cy} r="5.5" fill="#F6F5F2" stroke="#0D0D0D" strokeWidth="1" />
              <text x={cx} y={cy + 2.5} textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill="#FF3B00" fontWeight="bold">
                {b.seq}
              </text>
            </g>
          );
        })}
        {/* Technical Annotations Right Side */}
        <g fontFamily="monospace" fontSize="8.5" fill="#0D0D0D">
          <text x="200" y="28" fontWeight="bold">FIG // FLANGE PATTERN</text>
          <line x1="200" y1="34" x2="398" y2="34" stroke="#0D0D0D" strokeWidth="0.7" />
          <text x="200" y="50" fill="#686662">STUD PATTERN</text>
          <text x="200" y="65" fill="#686662">LUBRICATION CALLOUT</text>
          <rect x="200" y="76" width="195" height="22" fill="#FF3B00" fillOpacity="0.1" stroke="#FF3B00" strokeWidth="0.8" />
          <text x="206" y="90" fill="#FF3B00" fontWeight="bold">TORQUE SEQUENCE</text>
          <text x="200" y="116" fill="#0D0D0D">CROSS-PATTERN PASSES</text>
          <text x="200" y="130" fill="#008A4B">SEQUENCE CHECK</text>
        </g>
      </svg>
    );
  }

  if (type === 'PLC_LADDER_K4') {
    return (
      <svg viewBox="0 0 420 155" className="w-full h-auto bg-[#EFECE6] border border-[#E2E0DC] p-2">
        <defs>
          <pattern id="grid-plc" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" fill="none" stroke="#D8D5CE" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="420" height="155" fill="url(#grid-plc)" />
        {/* Power Rails */}
        <line x1="24" y1="15" x2="24" y2="140" stroke="#0D0D0D" strokeWidth="2" />
        <line x1="396" y1="15" x2="396" y2="140" stroke="#0D0D0D" strokeWidth="2" />
        <text x="30" y="24" fontFamily="monospace" fontSize="8" fill="#686662">SAFETY CHANNEL LOGIC</text>
        {/* Rung 1 */}
        <line x1="24" y1="68" x2="70" y2="68" stroke="#0D0D0D" strokeWidth="1.2" />
        {/* Contact 1: X12:4 Loop OK */}
        <line x1="70" y1="56" x2="70" y2="80" stroke="#0D0D0D" strokeWidth="1.5" />
        <line x1="82" y1="56" x2="82" y2="80" stroke="#0D0D0D" strokeWidth="1.5" />
        <text x="76" y="48" textAnchor="middle" fontFamily="monospace" fontSize="7.5" fill="#008A4B">X12:4_OK</text>
        <line x1="82" y1="68" x2="145" y2="68" stroke="#0D0D0D" strokeWidth="1.2" />
        {/* Contact 2: Rising Edge ACK_REI */}
        <line x1="145" y1="56" x2="145" y2="80" stroke="#FF3B00" strokeWidth="1.5" />
        <line x1="163" y1="56" x2="163" y2="80" stroke="#FF3B00" strokeWidth="1.5" />
        <text x="154" y="71" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#FF3B00" fontWeight="bold">P</text>
        <text x="154" y="48" textAnchor="middle" fontFamily="monospace" fontSize="7.5" fill="#FF3B00">ACK RESET</text>
        <line x1="163" y1="68" x2="220" y2="68" stroke="#0D0D0D" strokeWidth="1.2" />
        {/* F-IO DB Block */}
        <rect x="220" y="42" width="102" height="54" fill="#F6F5F2" stroke="#0D0D0D" strokeWidth="1.2" />
        <text x="271" y="55" textAnchor="middle" fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#0D0D0D">RELAY</text>
        <text x="226" y="69" fontFamily="monospace" fontSize="7" fill="#686662">ACK REQUIRED</text>
        <text x="226" y="81" fontFamily="monospace" fontSize="7" fill="#008A4B">RLO_OUT -&gt; Q0.3</text>
        <line x1="322" y1="68" x2="355" y2="68" stroke="#0D0D0D" strokeWidth="1.2" />
        {/* Output Coil K4 */}
        <text x="366" y="71" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#0D0D0D">( )</text>
        <text x="366" y="52" textAnchor="middle" fontFamily="monospace" fontSize="7.5" fontWeight="bold" fill="#0D0D0D">OUTPUT</text>
        <line x1="376" y1="68" x2="396" y2="68" stroke="#0D0D0D" strokeWidth="1.2" />
        {/* Bottom Diagnostic Note */}
        <rect x="36" y="112" width="348" height="22" fill="#0D0D0D" />
        <text x="44" y="126" fontFamily="monospace" fontSize="8" fill="#F6F5F2">
          BBOX [95.2, 410.0] // MAX LOOP IMPEDANCE: ≤ 1.80 Ω | PULSE: 150–2000ms
        </text>
      </svg>
    );
  }

  // Default: SEAL_PLAN_53B P&ID Schematic
  return (
    <svg viewBox="0 0 420 155" className="w-full h-auto bg-[#EFECE6] border border-[#E2E0DC] p-2">
      <defs>
        <pattern id="grid-pid" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M 14 0 L 0 0 0 14" fill="none" stroke="#D8D5CE" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="420" height="155" fill="url(#grid-pid)" />
      <text x="14" y="18" fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#0D0D0D">
        P&amp;ID EXTRACT // API PLAN 53B PRESSURIZED BARRIER SEAL SYSTEM
      </text>
      {/* Pump Housing & Shaft */}
      <rect x="28" y="65" width="95" height="62" fill="#F6F5F2" stroke="#0D0D0D" strokeWidth="1.3" />
      <text x="75" y="94" textAnchor="middle" fontFamily="monospace" fontSize="8.5" fontWeight="bold" fill="#0D0D0D">SEAL</text>
      <text x="75" y="106" textAnchor="middle" fontFamily="monospace" fontSize="7" fill="#686662">CHAMBER</text>
      {/* Shaft */}
      <line x1="10" y1="96" x2="28" y2="96" stroke="#0D0D0D" strokeWidth="4" />
      {/* Circulation Loop to Accumulator */}
      <polyline points="95,65 95,36 228,36 228,60" fill="none" stroke="#0D0D0D" strokeWidth="1.2" />
      <polyline points="228,118 228,136 95,136 95,127" fill="none" stroke="#0D0D0D" strokeWidth="1.2" />
      {/* Bladder Accumulator */}
      <rect x="206" y="60" width="44" height="58" rx="12" fill="#F6F5F2" stroke="#0D0D0D" strokeWidth="1.3" />
      <path d="M 206 88 Q 228 96 250 88" fill="none" stroke="#0D0D0D" strokeWidth="1" strokeDasharray="2 2" />
      <text x="228" y="78" textAnchor="middle" fontFamily="monospace" fontSize="7.5" fontWeight="bold">N2</text>
      <text x="228" y="106" textAnchor="middle" fontFamily="monospace" fontSize="7">BARRIER</text>
      {/* Instrument Bubble TI-TI */}
      <line x1="145" y1="36" x2="145" y2="58" stroke="#FF3B00" strokeWidth="1" />
      <circle cx="145" cy="72" r="14" fill="#F6F5F2" stroke="#FF3B00" strokeWidth="1.3" />
      <line x1="131" y1="72" x2="159" y2="72" stroke="#FF3B00" strokeWidth="0.8" />
      <text x="145" y="69" textAnchor="middle" fontFamily="monospace" fontSize="6.5" fontWeight="bold" fill="#FF3B00">TI</text>
      <text x="145" y="80" textAnchor="middle" fontFamily="monospace" fontSize="6" fill="#FF3B00">4022B</text>
      {/* Instrument Bubble PDSLL-PDS */}
      <line x1="250" y1="88" x2="282" y2="88" stroke="#FF3B00" strokeWidth="1" />
      <circle cx="298" cy="88" r="15" fill="#F6F5F2" stroke="#FF3B00" strokeWidth="1.3" />
      <line x1="283" y1="88" x2="313" y2="88" stroke="#FF3B00" strokeWidth="0.8" />
      <text x="298" y="85" textAnchor="middle" fontFamily="monospace" fontSize="6" fontWeight="bold" fill="#FF3B00">PDSLL</text>
      <text x="298" y="95" textAnchor="middle" fontFamily="monospace" fontSize="6" fill="#FF3B00">PDS</text>
      {/* Callout Box Right */}
      <rect x="280" y="24" width="128" height="44" fill="#FF3B00" fillOpacity="0.1" stroke="#FF3B00" strokeWidth="0.9" />
      <text x="286" y="37" fontFamily="monospace" fontSize="7.5" fontWeight="bold" fill="#FF3B00">SCHEMATIC</text>
      <text x="286" y="49" fontFamily="monospace" fontSize="7" fill="#0D0D0D">BARRIER LOOP</text>
      <text x="286" y="60" fontFamily="monospace" fontSize="7" fill="#FF3B00">PAGE EXTRACT</text>

      <rect x="280" y="112" width="128" height="28" fill="#F6F5F2" stroke="#0D0D0D" strokeWidth="0.8" />
      <text x="286" y="124" fontFamily="monospace" fontSize="7" fill="#0D0D0D">DIFF. PRESSURE</text>
      <text x="286" y="134" fontFamily="monospace" fontSize="7" fill="#686662">SOURCE PAGE</text>
    </svg>
  );
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  // Navigation & Coordinate Readout State
  const [coords, setCoords] = useState({ x: 412, y: 288 });
  const [utcTime, setUtcTime] = useState('14:02:49 UTC');
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash === 'workbench' || hash === 'verification' || hash === 'architecture' ? hash : 'home';
  });
  const [language, setLanguage] = useState(() => {
    const saved = window.localStorage.getItem('synai-lang');
    return saved === 'ru' || saved === 'kk' ? saved : 'en';
  });
  const t = (key) => UI[language]?.[key] || UI.en[key] || key;

  // Document Corpus & Workbench State
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [contradictionDiffs, setContradictionDiffs] = useState([]);
  const [clauseTraces, setClauseTraces] = useState([]);
  const [revisionAudits, setRevisionAudits] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [uploadNotification, setUploadNotification] = useState(null);

  // Active Source Inspector State (Doc + Clause Key)
  const [activeInspection, setActiveInspection] = useState({
    docId: 'DOC-01',
    clauseKey: 'P.142 · §6.8.2'
  });

  // Section 02: Verification Mode State
  const [verificationMode, setVerificationMode] = useState('CONTRADICTION'); // 'CONTRADICTION' | 'CLAUSE' | 'REVISION'
  const [selectedDiffId, setSelectedDiffId] = useState('DIFF-01');
  const [selectedClaimId, setSelectedClaimId] = useState('CLM-01');

  // Section 03: Architecture Step Inspector State
  const [activeArchStep, setActiveArchStep] = useState(0);

  const fileInputRef = useRef(null);
  const workbenchRef = useRef(null);
  const verificationRef = useRef(null);
  const architectureRef = useRef(null);
  const chatEndRef = useRef(null);

  // Track mouse coordinates for industrial header reticle readout
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Live UTC Engineering Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');
      const ss = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hh}:${mm}:${ss} UTC`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/documents')
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.documents)) setDocuments(data.documents);
        if (Array.isArray(data.conflicts)) setContradictionDiffs(data.conflicts);
      })
      .catch(() => {
        if (!cancelled) setUploadNotification(t('apiOffline'));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSynthesizing]);


  useEffect(() => {
    window.localStorage.setItem('synai-lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const openPage = (next) => {
    setPage(next);
    window.history.replaceState(null, '', next === 'home' ? '#top' : `#${next}`);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Page navigation. Each major section is its own view.
  const scrollToSection = (ref) => {
    if (ref === workbenchRef) openPage('workbench');
    else if (ref === verificationRef) openPage('verification');
    else if (ref === architectureRef) openPage('architecture');
    else openPage('home');
  };

  // Resolve currently inspected document & clause
  const currentDoc = documents.find((d) => d.id === activeInspection.docId) || documents[0] || {
    id: '—',
    code: 'NONE',
    filename: t('noSource'),
    title: t('noSourceTitle'),
    rev: '—',
    hash: '—',
    pages: 0,
    clauses: {}
  };
  const availableClauseKeys = Object.keys(currentDoc.clauses || {});
  const currentClauseKey = currentDoc.clauses?.[activeInspection.clauseKey]
    ? activeInspection.clauseKey
    : availableClauseKeys[0];
  const currentClause = currentDoc.clauses?.[currentClauseKey];

  // Toggle document inclusion in query scope
  const toggleDocumentScope = (docId) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, included: !d.included } : d))
    );
  };

  // Select a document in the Hero Manifest or Left Rail
  const selectDocumentForInspection = (docId) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    const firstKey = Object.keys(doc.clauses || {})[0];
    setActiveInspection({ docId: doc.id, clauseKey: firstKey });
  };

  const applyGroundedResult = (data) => {
    if (data.clauses?.length) {
      setDocuments((prev) => prev.map((doc) => {
        const extra = data.clauses.filter((item) => item.docId === doc.id);
        if (!extra.length) return doc;
        const clauses = { ...(doc.clauses || {}) };
        extra.forEach((item) => {
          clauses[item.clauseKey] = item.clause;
        });
        const flagged = (data.conflicts || []).some((item) => item.leftDocId === doc.id || item.rightDocId === doc.id);
        return { ...doc, clauses, status: flagged ? 'CONFLICT DETECTED' : doc.status };
      }));
    }
    if (Array.isArray(data.conflicts)) {
      setContradictionDiffs(data.conflicts);
      if (data.conflicts[0]) setSelectedDiffId(data.conflicts[0].id);
      const flagged = new Set(data.conflicts.flatMap((item) => [item.leftDocId, item.rightDocId]));
      setDocuments((prev) => prev.map((doc) => (
        flagged.has(doc.id)
          ? { ...doc, status: 'CONFLICT DETECTED' }
          : doc.status === 'CONFLICT DETECTED'
            ? { ...doc, status: 'INDEXED' }
            : doc
      )));
    }
    if (data.traces?.length) {
      setClauseTraces(data.traces);
      setSelectedClaimId(data.traces[0].id);
    }
    if (data.inspection?.docId) setActiveInspection(data.inspection);
    if (Array.isArray(data.revisions)) setRevisionAudits(data.revisions);
  };

  const submitQuery = async (raw) => {
    const trimmed = String(raw || '').trim();
    if (!trimmed || isSynthesizing) return;
    setInputQuery('');
    setIsSynthesizing(true);
    const now = new Date();
    const ts = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;
    const userMsg = { id: `MSG-${Date.now()}-U`, role: 'user', timestamp: ts, query: trimmed };
    const history = [...messages, userMsg].slice(-8).map((msg) => ({
      role: msg.role,
      text: msg.role === 'user' ? msg.query : `${msg.summary || ''} ${(msg.findings || []).map((item) => item.text).join(' ')}`
    }));
    setMessages((prev) => [...prev, userMsg]);
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          documentIds: documents.filter((doc) => doc.included).map((doc) => doc.id),
          history,
          language
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Query failed');
      setMessages((prev) => [...prev, { ...data.message, id: `MSG-${Date.now()}-A`, timestamp: ts }]);
      applyGroundedResult(data);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: `MSG-${Date.now()}-E`,
        role: 'assistant',
        timestamp: ts,
        latency: '0ms',
        status: t('notAnswered'),
        statusType: 'warning',
        summary: error.message || t('queryFailed'),
        findings: [],
        recommendation: t('abstained')
      }]);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Handle File Upload / Drag-and-Drop Ingestion
  const handleFilesIngest = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((file) => file && file.size >= 0);
    for (const file of files) {
      setUploadNotification(`${t('ingesting')} ${file.name.toUpperCase()}...`);
      const form = new FormData();
      form.append('file', file);
      try {
        const response = await fetch('/api/documents', { method: 'POST', body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload failed');
        setDocuments((prev) => [data.document, ...prev.filter((doc) => doc.id !== data.document.id)]);
        const firstKey = Object.keys(data.document.clauses || {})[0];
        if (firstKey) setActiveInspection({ docId: data.document.id, clauseKey: firstKey });
        if (Array.isArray(data.conflicts)) {
          setContradictionDiffs(data.conflicts);
          if (data.conflicts[0]) setSelectedDiffId(data.conflicts[0].id);
        }
        setUploadNotification(data.notification || `INGESTED ${file.name.toUpperCase()}`);
      } catch (error) {
        setUploadNotification(`${t('ingestFailed')}: ${error.message}`);
      }
    }
    setTimeout(() => setUploadNotification(null), 6000);
  };

  const removeUploadedFile = async (docId, event) => {
    event?.stopPropagation();
    event?.preventDefault();
    const doc = documents.find((item) => item.id === docId);
    if (!doc || !window.confirm(t('confirmDelete'))) return;
    try {
      const response = await fetch(`/api/documents/${encodeURIComponent(docId)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Delete failed');
      const remaining = documents.filter((item) => item.id !== docId);
      setDocuments(remaining);
      if (Array.isArray(data.conflicts)) {
        setContradictionDiffs(data.conflicts);
        setSelectedDiffId(data.conflicts[0]?.id || null);
      }
      if (activeInspection.docId === docId) {
        const fallback = remaining[0];
        setActiveInspection(fallback
          ? { docId: fallback.id, clauseKey: Object.keys(fallback.clauses || {})[0] || null }
          : { docId: null, clauseKey: null });
      }
      setUploadNotification(t('deleted'));
    } catch (error) {
      setUploadNotification(`${t('deleteFailed')}: ${error.message}`);
    }
    setTimeout(() => setUploadNotification(null), 4000);
  };

  const runPresetPrompt = (preset) => {
    if (typeof preset === 'string') submitQuery(preset);
    else if (preset.queryKey) submitQuery(t(preset.queryKey));
    else submitQuery(preset.fullQuery);
  };

  const handleCustomQuerySubmit = (event) => {
    event.preventDefault();
    submitQuery(inputQuery);
  };

  const ARCH_STEPS = [
    {
      num: 'STEP 01',
      code: 'VECTOR.PARSE',
      title: 'LAYOUT-AWARE VECTOR PARSING',
      desc: 'Ingests native CAD drawings (DWG/DXF), multi-column ISO standards, and scanned OEM manuals without flattening spatial hierarchy.',
      metrics: [
        { k: 'GEOMETRY EXTRACTION', v: 'P&ID Callouts, Leader Lines, GD&T Frames' },
        { k: 'TABLE RECONSTRUCTION', v: 'Multi-Page Merged Cell Matrix Preservation' },
        { k: 'COORDINATE BINDING', v: 'Sub-Millimeter PDF Bounding Box [X1, Y1, X2, Y2]' }
      ]
    },
    {
      num: 'STEP 02',
      code: 'TREE.INDEX',
      title: 'HIERARCHICAL CLAUSE CHUNKING',
      desc: 'Eliminates arbitrary token splitting. Every paragraph, table row, and footnote retains its parent section tree and safety warning context.',
      metrics: [
        { k: 'SECTION INHERITANCE', v: 'Full Clause Lineage (§6 → §6.8 → §6.8.2)' },
        { k: 'SAFETY INTERLOCK TAGS', v: 'WARNING / CAUTION / DANGER Blocks Pinned' },
        { k: 'NORMATIVE REFERENCES', v: 'Bi-Directional Graph Links Across ASME / ISO / API' }
      ]
    },
    {
      num: 'STEP 03',
      code: 'DIFF.RECONCILE',
      title: 'CROSS-CLAUSE RECONCILIATION',
      desc: 'Continuously compares OEM baseline limits against site-specific Standard Operating Procedures (SOPs) to flag hazardous drift.',
      metrics: [
        { k: 'UNIT NORMALIZATION', v: 'Automatic bar ↔ psi, N·m ↔ lb·ft, °C ↔ °F Conversion' },
        { k: 'CONFLICT DETECTION', v: 'Flags Threshold Overruns Between OEM & Field DCS' },
        { k: 'REVISION AUDIT', v: 'Tracks Deprecated Part Numbers & Torque Shifts' }
      ]
    },
    {
      num: 'STEP 04',
      code: 'SYNTH.ZERO',
      title: 'ZERO-HALLUCINATION SYNTHESIS',
      desc: 'Constrained decoding binds every technical claim and numerical value to a verifiable document hash, page number, and bounding box.',
      metrics: [
        { k: 'ABSTENTION PROTOCOL', v: 'Deterministic Refusal When Evidence Is Absent' },
        { k: 'CITATION GRANULARITY', v: 'Token-Level Link to Exact Clause & Table Cell' },
        { k: 'DEPLOYMENT POSTURE', v: 'Air-Gapped On-Premise / Sovereign VPC Ready' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#0D0D0D] antialiased selection:bg-[#FF3B00] selection:text-[#F6F5F2]" style={language === 'en' ? undefined : { fontFamily: "'Manrope', sans-serif" }}>
      {/* Architectural Font & Precision Styling */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        
        :root {
          --font-sans: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
          --font-mono: 'IBM Plex Mono', monospace;
        }
        
        body {
          font-family: var(--font-sans);
          background-color: #F6F5F2;
          color: #0D0D0D;
          overflow-x: hidden;
        }
        
        .font-mono-tech {
          font-family: var(--font-mono);
          font-feature-settings: "zero" 1, "ss01" 1;
        }

        /* Subtle industrial scrollbar */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: #F6F5F2;
          border-left: 1px solid #E2E0DC;
        }
        ::-webkit-scrollbar-thumb {
          background: #0D0D0D;
        }
      `}</style>

      {/* =====================================================================
          1. TOP ARCHITECTURAL NAVIGATION BAR
      ====================================================================== */}
      <header className="sticky top-0 z-50 bg-[#F6F5F2] border-b border-[#E2E0DC]">
        <div className="max-w-[1600px] mx-auto grid grid-cols-12 items-stretch">
          {/* Left Cell: Brand Wordmark & Live Status */}
          <div className="col-span-6 md:col-span-3 lg:col-span-3 px-4 sm:px-6 py-3.5 border-r border-[#E2E0DC] flex items-center justify-between">
            <a href="#top" className="flex items-center gap-2.5 group">
              <div className="w-3.5 h-3.5 bg-[#0D0D0D] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#F6F5F2]" />
              </div>
              <span className="font-bold tracking-tight text-sm sm:text-base uppercase">
                SYNAI <span className="text-[#686662] font-normal">//</span> PHOSMIND
              </span>
            </a>
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 border border-[#E2E0DC] bg-[#EFECE6]">
                <span className="w-1.5 h-1.5 bg-[#008A4B]" />
                <span className="font-mono-tech text-[10px] tracking-wider text-[#0D0D0D]">{t('sysOnline')}</span>
              </div>
              <div className="flex border border-[#0D0D0D] font-mono-tech text-[10px]">
                {['en', 'ru', 'kk'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    className={`px-1.5 py-0.5 ${language === code ? 'bg-[#0D0D0D] text-[#F6F5F2]' : 'bg-[#F6F5F2] text-[#0D0D0D]'}`}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Cells: Numbered Monospace Section Links */}
          <nav className="hidden lg:grid lg:col-span-5 grid-cols-3 border-r border-[#E2E0DC] font-mono-tech text-xs">
            <button
              onClick={() => scrollToSection(workbenchRef)}
              className="px-4 py-3.5 border-r border-[#E2E0DC] text-left hover:bg-[#0D0D0D] hover:text-[#F6F5F2] transition-colors flex items-center justify-between group"
            >
              <span>{t('navWorkbench')}</span>
              <span className="text-[10px] text-[#686662] group-hover:text-[#FF3B00]">[LIVE]</span>
            </button>
            <button
              onClick={() => scrollToSection(verificationRef)}
              className="px-4 py-3.5 border-r border-[#E2E0DC] text-left hover:bg-[#0D0D0D] hover:text-[#F6F5F2] transition-colors flex items-center justify-between group"
            >
              <span>{t('navVerification')}</span>
              <span className="text-[10px] text-[#FF3B00]">[DIFF]</span>
            </button>
            <button
              onClick={() => scrollToSection(architectureRef)}
              className="px-4 py-3.5 text-left hover:bg-[#0D0D0D] hover:text-[#F6F5F2] transition-colors flex items-center justify-between group"
            >
              <span>{t('navArchitecture')}</span>
              <span className="text-[10px] text-[#686662] group-hover:text-[#F6F5F2]">[SPEC]</span>
            </button>
          </nav>

          {/* Coordinate & Clock Readout Cell */}
          <div className="hidden md:flex md:col-span-4 lg:col-span-2 px-4 py-3.5 border-r border-[#E2E0DC] items-center justify-between font-mono-tech text-[11px] text-[#686662]">
            <div className="flex items-center gap-1.5" title="Viewport Cursor Reticle Coordinates">
              <Crosshair className="w-3 h-3 text-[#FF3B00]" />
              <span>X:{String(coords.x).padStart(4, '0')} Y:{String(coords.y).padStart(4, '0')}</span>
            </div>
            <span className="hidden xl:inline text-[#0D0D0D]">{utcTime}</span>
          </div>

          {/* Right Cell: Sharp Full-Height Action Button */}
          <div className="col-span-6 md:col-span-5 lg:col-span-2 flex items-stretch">
            <button
              onClick={() => scrollToSection(workbenchRef)}
              className="w-full px-4 sm:px-5 py-3.5 bg-[#0D0D0D] text-[#F6F5F2] hover:bg-[#FF3B00] hover:text-[#0D0D0D] transition-colors font-mono-tech text-xs font-medium tracking-wider flex items-center justify-between"
            >
              <span>{t('launch')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-40 border-b border-[#E2E0DC] bg-[#F6F5F2]">
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 sm:grid-cols-4 font-mono-tech text-[11px] sm:text-xs">
          {[
            ['home', t('home')],
            ['workbench', t('navWorkbench')],
            ['verification', t('navVerification')],
            ['architecture', t('navArchitecture')]
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => openPage(id)}
              className={`px-4 py-3 text-left border-r border-b sm:border-b-0 border-[#E2E0DC] transition-colors ${
                page === id ? 'bg-[#0D0D0D] text-[#F6F5F2]' : 'hover:bg-[#EFECE6]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* =====================================================================
          2. ASYMMETRIC EDITORIAL HERO SECTION
      ====================================================================== */}
      {page === 'home' && (
      <section id="top" className="border-b border-[#E2E0DC] relative">
        <div className="max-w-[1600px] mx-auto grid grid-cols-12">
          
          {/* Left 8 Columns: Editorial Positioning & Primary CTA */}
          <div className="col-span-12 lg:col-span-8 border-b lg:border-b-0 lg:border-r border-[#E2E0DC] flex flex-col justify-between relative">
            <CrosshairMarker position="bottom-right" />
            
            {/* Top Sub-Header Strip */}
            <div className="px-6 sm:px-10 py-3 border-b border-[#E2E0DC] flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[11px] text-[#686662]">
              <div className="flex items-center gap-3">
                <span className="text-[#0D0D0D] font-medium">{t('engine')}</span>
                <span>·</span>
                <span>P&amp;ID / ISO / DIN / PLC LOGIC</span>
              </div>
              <span className="text-[#008A4B]">{t('zero')}</span>
            </div>

            {/* Main Oversized Headline & Copy */}
            <div className="px-6 sm:px-10 py-12 sm:py-16 lg:py-20">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-[#0D0D0D] mb-6 font-mono-tech text-[11px] uppercase tracking-wider">
                <span className="w-2 h-2 bg-[#FF3B00]" />
                <span>{t('kicker')}</span>
              </div>

              <h1 className="text-4xl sm:text-6xl xl:text-[68px] font-bold tracking-[-0.035em] leading-[0.98] text-[#0D0D0D] max-w-4xl">
                {t('heroTitle')}
              </h1>

              <p className="mt-8 text-base sm:text-lg text-[#0D0D0D]/80 max-w-2xl leading-relaxed font-normal">
                {t('heroBody')}
              </p>

              {/* Sharp CTA Action Bar */}
              <div className="mt-10 flex flex-wrap items-stretch gap-4">
                <button
                  onClick={() => scrollToSection(workbenchRef)}
                  className="px-7 py-4 bg-[#0D0D0D] text-[#F6F5F2] hover:bg-[#FF3B00] hover:text-[#0D0D0D] transition-colors font-mono-tech text-xs sm:text-sm font-medium tracking-wider uppercase flex items-center gap-3"
                >
                  <span>{t('ctaMatrix')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    scrollToSection(workbenchRef);
                    runPresetPrompt(PRESET_PROMPTS[0]);
                  }}
                  className="px-6 py-4 bg-transparent border border-[#0D0D0D] text-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-[#F6F5F2] transition-colors font-mono-tech text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2"
                >
                  <span>{t('ctaAudit')}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom 3-Cell Technical Spec Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-[#E2E0DC] font-mono-tech text-xs">
              <div className="p-5 sm:px-8 border-b sm:border-b-0 sm:border-r border-[#E2E0DC]">
                <div className="text-[10px] text-[#686662] uppercase mb-1">{t('spec1k')}</div>
                <div className="text-[#0D0D0D] font-medium">{t('spec1t')}</div>
                <div className="text-[11px] text-[#686662] mt-0.5">{t('spec1s')}</div>
              </div>
              <div className="p-5 sm:px-8 border-b sm:border-b-0 sm:border-r border-[#E2E0DC]">
                <div className="text-[10px] text-[#686662] uppercase mb-1">{t('spec2k')}</div>
                <div className="text-[#0D0D0D] font-medium">{t('spec2t')}</div>
                <div className="text-[11px] text-[#686662] mt-0.5">{t('spec2s')}</div>
              </div>
              <div className="p-5 sm:px-8">
                <div className="text-[10px] text-[#686662] uppercase mb-1">{t('spec3k')}</div>
                <div className="text-[#0D0D0D] font-medium">{t('spec3t')}</div>
                <div className="text-[11px] text-[#686662] mt-0.5">{t('spec3s')}</div>
              </div>
            </div>
          </div>

          {/* Right 4 Columns: Live Architectural System Index & Document Manifest */}
          <div className="col-span-12 lg:col-span-4 flex flex-col justify-between bg-[#EFECE6]/50">
            <div>
              {/* Manifest Header */}
              <div className="px-6 py-3 border-b border-[#E2E0DC] flex items-center justify-between font-mono-tech text-[11px]">
                <span className="font-semibold text-[#0D0D0D] uppercase tracking-wider">
                  {t('manifest')} ({documents.length})
                </span>
                <span className="text-[#686662]">{t('verified')}</span>
              </div>

              {/* Interactive Document Rows */}
              <div className="divide-y divide-[#E2E0DC]">
                {documents.length === 0 && (
                  <div className="p-5 font-mono-tech text-xs text-[#686662]">
                    {t('emptyDocs')}
                  </div>
                )}
                {documents.map((doc, idx) => {
                  const isSelected = activeInspection.docId === doc.id;
                  const isConflict = doc.status === 'CONFLICT DETECTED';
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        selectDocumentForInspection(doc.id);
                        scrollToSection(workbenchRef);
                      }}
                      className={`p-5 cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-[#0D0D0D] text-[#F6F5F2]'
                          : 'hover:bg-[#E8E5DE] text-[#0D0D0D]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono-tech text-[11px] mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={isSelected ? 'text-[#FF3B00]' : 'text-[#686662]'}>
                            0{idx + 1} // {doc.id}
                          </span>
                          <span className={`px-1.5 py-0.2 border text-[10px] ${
                            isSelected
                              ? 'border-[#F6F5F2]/30 text-[#F6F5F2]'
                              : 'border-[#E2E0DC] text-[#686662]'
                          }`}>
                            {doc.rev}
                          </span>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] font-medium ${
                          isConflict
                            ? 'text-[#FF3B00]'
                            : isSelected
                            ? 'text-[#008A4B]'
                            : 'text-[#008A4B]'
                        }`}>
                          <span className={`w-1.5 h-1.5 ${isConflict ? 'bg-[#FF3B00]' : 'bg-[#008A4B]'}`} />
                          {doc.status}
                        </span>
                      </div>

                      <div className="font-mono-tech text-xs sm:text-sm font-semibold tracking-tight flex items-center justify-between">
                        <span>{doc.filename}</span>
                        <ArrowUpRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                          isSelected ? 'text-[#FF3B00]' : 'text-[#686662]'
                        }`} />
                      </div>

                      <p className={`text-xs mt-1 line-clamp-1 ${
                        isSelected ? 'text-[#F6F5F2]/75' : 'text-[#686662]'
                      }`}>
                        {doc.title}
                      </p>

                      <div className={`mt-3 pt-2.5 border-t flex items-center justify-between gap-2 font-mono-tech text-[10px] ${
                        isSelected ? 'border-[#F6F5F2]/15 text-[#F6F5F2]/60' : 'border-[#E2E0DC] text-[#686662]'
                      }`}>
                        <span>PAGES: {doc.pages}</span>
                        <span>HASH: {doc.hash}</span>
                        <button
                          type="button"
                          title={t('removeTitle')}
                          onClick={(event) => removeUploadedFile(doc.id, event)}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 border ${
                            isSelected
                              ? 'border-[#FF3B00] text-[#FF3B00] hover:bg-[#FF3B00] hover:text-[#F6F5F2]'
                              : 'border-[#FF3B00]/40 text-[#FF3B00] hover:bg-[#FF3B00] hover:text-[#F6F5F2]'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                          {t('remove')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Telemetry Box inside Right Rail */}
            <div className="p-6 border-t border-[#E2E0DC] bg-[#F6F5F2]">
              <div className="flex items-center justify-between font-mono-tech text-[11px] text-[#686662] mb-2">
                <span>INDEX TELEMETRY</span>
                <span className="text-[#0D0D0D]">LATENCY: {messages.filter((msg) => msg.latency).slice(-1)[0]?.latency || '—'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono-tech text-xs">
                <div className="p-3 border border-[#E2E0DC] bg-[#EFECE6]/60">
                  <div className="text-[10px] text-[#686662]">INDEXED CLAUSES</div>
                  <div className="text-base font-semibold text-[#0D0D0D] mt-0.5">{documents.reduce((count, doc) => count + Object.keys(doc.clauses || {}).length, 0)} BLOCKS</div>
                </div>
                <div className="p-3 border border-[#E2E0DC] bg-[#EFECE6]/60">
                  <div className="text-[10px] text-[#686662]">ACTIVE CONFLICTS</div>
                  <div className="text-base font-semibold text-[#FF3B00] mt-0.5">{String(contradictionDiffs.filter((item) => item.severity !== 'ALIGNED').length).padStart(2, '0')} {t('flagged')}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
      )}

      {/* =====================================================================
          3. INTERACTIVE DOCUMENT-CHAT & CITATION WORKBENCH (01 / WORKBENCH)
      ====================================================================== */}
      {page === 'workbench' && (
      <section ref={workbenchRef} className="border-b border-[#E2E0DC]">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Section Header Bar */}
          <div className="grid grid-cols-12 border-b border-[#E2E0DC] bg-[#EFECE6]">
            <div className="col-span-12 md:col-span-4 px-6 py-4 border-b md:border-b-0 md:border-r border-[#E2E0DC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono-tech text-xs px-2 py-0.5 bg-[#0D0D0D] text-[#F6F5F2]">01</span>
                <h2 className="font-mono-tech text-xs sm:text-sm font-semibold tracking-wider uppercase">
                  DETERMINISTIC QUERY &amp; INSPECTION WORKBENCH
                </h2>
              </div>
              <span className="font-mono-tech text-[11px] text-[#008A4B] hidden sm:inline">● SYNCED</span>
            </div>
            <div className="col-span-12 md:col-span-8 px-6 py-4 flex flex-wrap items-center justify-between gap-2 font-mono-tech text-xs text-[#686662]">
              <span>CLICK ANY CITATION BADGE [DOC-XX · P.XX] TO LOCK SOURCE BOUNDING BOX IN RIGHT PANE</span>
              <span className="text-[#0D0D0D]">MODE: STRICT EVIDENCE BINDING</span>
            </div>
          </div>

          {/* Upload Notification Banner (if file recently ingested) */}
          {uploadNotification && (
            <div className="px-6 py-2.5 bg-[#008A4B] text-[#F6F5F2] font-mono-tech text-xs flex items-center justify-between border-b border-[#E2E0DC]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{uploadNotification}</span>
              </div>
              <button onClick={() => setUploadNotification(null)} className="underline text-[11px]">
                DISMISS
              </button>
            </div>
          )}

          {/* 3-Pane Industrial Terminal Grid */}
          <div className="grid grid-cols-12 min-h-[700px]">
            
            {/* ---------------------------------------------------------------
                LEFT PANE (3 Cols): CORPUS & DRAG-AND-DROP INGESTION
            ---------------------------------------------------------------- */}
            <div className="col-span-12 lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[#E2E0DC] flex flex-col justify-between bg-[#F6F5F2]">
              <div>
                {/* Pane Subheader */}
                <div className="px-5 py-3 border-b border-[#E2E0DC] flex items-center justify-between font-mono-tech text-[11px] text-[#686662]">
                  <span>{t('paneA')}</span>
                  <span>{documents.filter((d) => d.included).length} / {documents.length} {t('activeOf')}</span>
                </div>

                {/* Drag-and-Drop Ingestion Box */}
                <div className="p-4 border-b border-[#E2E0DC]">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.dwg,.dxf,.txt,.doc,.docx" multiple
                    className="hidden"
                    onChange={(e) => handleFilesIngest(e.target.files)}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFilesIngest(e.dataTransfer.files);
                    }}
                    className={`p-4 border border-dashed cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-[#FF3B00] bg-[#FF3B00]/10'
                        : 'border-[#0D0D0D] bg-[#EFECE6]/60 hover:bg-[#EFECE6]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono-tech text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#0D0D0D] text-[#F6F5F2]">
                        {t('ingest')}
                      </span>
                      <Upload className="w-3.5 h-3.5 text-[#0D0D0D]" />
                    </div>
                    <p className="font-mono-tech text-xs font-medium text-[#0D0D0D]">
                      {t('drop')}
                    </p>
                    <p className="font-mono-tech text-[10px] text-[#686662] mt-1">
                      {t('dropHint')}
                    </p>
                  </div>
                </div>

                {/* Document Scope Checkboxes & Selector */}
                <div className="divide-y divide-[#E2E0DC]">
                  {documents.map((doc) => {
                    const isInspected = activeInspection.docId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        className={`p-4 transition-colors ${
                          isInspected ? 'bg-[#EFECE6]' : 'bg-[#F6F5F2] hover:bg-[#EFECE6]/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Scope Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleDocumentScope(doc.id)}
                            title={t('scopeTitle')}
                            className={`mt-0.5 w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${
                              doc.included
                                ? 'bg-[#0D0D0D] border-[#0D0D0D] text-[#F6F5F2]'
                                : 'bg-transparent border-[#686662]'
                            }`}
                          >
                            {doc.included && <Check className="w-3 h-3" />}
                          </button>

                          {/* Doc Metadata Clickable to Inspect */}
                          <div
                            onClick={() => selectDocumentForInspection(doc.id)}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between font-mono-tech text-[10px]">
                              <span className="font-semibold text-[#0D0D0D]">{doc.id} · {doc.rev}</span>
                              {doc.status === 'CONFLICT DETECTED' ? (
                                <span className="text-[#FF3B00] font-medium">{t('conflict')}</span>
                              ) : (
                                <span className="text-[#008A4B]">{t('indexed')}</span>
                              )}
                            </div>
                            <div className="font-mono-tech text-xs font-semibold text-[#0D0D0D] mt-0.5 break-all flex items-start justify-between gap-2">
                              <span>{doc.filename}</span>
                              <button
                                type="button"
                                title={t('removeTitle')}
                                onClick={(event) => removeUploadedFile(doc.id, event)}
                                className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 border border-[#FF3B00]/50 text-[#FF3B00] hover:bg-[#FF3B00] hover:text-[#F6F5F2]"
                              >
                                <Trash2 className="w-3 h-3" />
                                {t('remove')}
                              </button>
                            </div>
                            <div className="text-[11px] text-[#686662] mt-0.5 line-clamp-1">
                              {doc.title}
                            </div>

                            {/* Quick Section Pills */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {Object.keys(doc.clauses || {}).map((cKey) => {
                                const activePill = isInspected && currentClauseKey === cKey;
                                return (
                                  <button
                                    key={cKey}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveInspection({ docId: doc.id, clauseKey: cKey });
                                    }}
                                    className={`font-mono-tech text-[10px] px-1.5 py-0.5 border transition-colors ${
                                      activePill
                                        ? 'bg-[#FF3B00] text-[#F6F5F2] border-[#FF3B00]'
                                        : 'bg-[#F6F5F2] text-[#0D0D0D] border-[#E2E0DC] hover:border-[#0D0D0D]'
                                    }`}
                                  >
                                    {cKey}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Left Pane Footer Metadata */}
              <div className="p-4 border-t border-[#E2E0DC] font-mono-tech text-[10px] text-[#686662] space-y-1">
                <div className="flex justify-between">
                  <span>PARSER ENGINE:</span>
                  <span className="text-[#0D0D0D]">SYNAI-LAYOUT-V4</span>
                </div>
                <div className="flex justify-between">
                  <span>HALLUCINATION GUARD:</span>
                  <span className="text-[#008A4B]">STRICT (TEMP = 0.0)</span>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------------------
                CENTER PANE (5 Cols): DETERMINISTIC TECHNICAL CHAT
            ---------------------------------------------------------------- */}
            <div className="col-span-12 lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#E2E0DC] flex flex-col justify-between bg-[#F6F5F2]">
              
              {/* Pane Subheader */}
              <div className="px-5 py-3 border-b border-[#E2E0DC] flex items-center justify-between font-mono-tech text-[11px] text-[#686662]">
                <span>{t('paneB')}</span>
                <span>{t('citationLock')}</span>
              </div>

              {/* Conversation Message Stream */}
              <div className="p-5 space-y-6 overflow-y-auto max-h-[540px] flex-1">
                {messages.length === 0 && (
                  <div className="border border-[#E2E0DC] p-4 font-mono-tech text-xs text-[#686662]">
                    {t('emptyChat')}
                  </div>
                )}
                {messages.map((msg) => {
                  if (msg.role === 'user') {
                    return (
                      <div key={msg.id} className="border border-[#0D0D0D] bg-[#EFECE6] p-4">
                        <div className="flex items-center justify-between font-mono-tech text-[10px] text-[#686662] mb-1.5">
                          <span className="font-semibold text-[#0D0D0D]">{t('engineer')}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="text-sm font-medium text-[#0D0D0D] leading-snug">
                          {msg.query}
                        </p>
                      </div>
                    );
                  }

                  const isWarning = msg.statusType === 'warning';
                  return (
                    <div key={msg.id} className="border border-[#E2E0DC] bg-[#F6F5F2] p-5 relative">
                      {/* Top Status Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E2E0DC] font-mono-tech text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 font-semibold ${
                            isWarning
                              ? 'bg-[#FF3B00] text-[#F6F5F2]'
                              : 'bg-[#008A4B] text-[#F6F5F2]'
                          }`}>
                            {msg.status}
                          </span>
                        </div>
                        <span className="text-[#686662]">SYNTHESIS: {msg.latency} · {msg.timestamp}</span>
                      </div>

                      {/* Summary Lead */}
                      <p className="text-xs sm:text-sm text-[#0D0D0D] leading-relaxed mb-4">
                        {msg.summary}
                      </p>

                      {/* Structured Findings with Clickable Citations */}
                      <div className="space-y-3">
                        {(msg.findings || []).map((f, i) => {
                          const isCit1Active =
                            f.citation1 &&
                            activeInspection.docId === f.citation1.docId &&
                            activeInspection.clauseKey === f.citation1.clauseKey;
                          const isCit2Active =
                            f.citation2 &&
                            activeInspection.docId === f.citation2.docId &&
                            activeInspection.clauseKey === f.citation2.clauseKey;

                          return (
                            <div key={i} className="p-3.5 border border-[#E2E0DC] bg-[#EFECE6]/40">
                              <div className="font-mono-tech text-[11px] font-semibold text-[#0D0D0D] mb-1">
                                {f.label}
                              </div>
                              <p className="text-xs sm:text-[13px] text-[#0D0D0D]/90 leading-relaxed">
                                {f.text}{' '}
                                {f.citation1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveInspection({
                                        docId: f.citation1.docId,
                                        clauseKey: f.citation1.clauseKey
                                      })
                                    }
                                    className={`inline-flex items-center gap-1 font-mono-tech text-[11px] px-1.5 py-0.5 border transition-colors mx-0.5 ${
                                      isCit1Active
                                        ? 'bg-[#FF3B00] text-[#F6F5F2] border-[#FF3B00]'
                                        : 'bg-[#0D0D0D] text-[#F6F5F2] border-[#0D0D0D] hover:bg-[#FF3B00] hover:border-[#FF3B00]'
                                    }`}
                                  >
                                    <span>[{f.citation1.label}]</span>
                                  </button>
                                )}
                                {f.textCont}{' '}
                                {f.citation2 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveInspection({
                                        docId: f.citation2.docId,
                                        clauseKey: f.citation2.clauseKey
                                      })
                                    }
                                    className={`inline-flex items-center gap-1 font-mono-tech text-[11px] px-1.5 py-0.5 border transition-colors mx-0.5 ${
                                      isCit2Active
                                        ? 'bg-[#FF3B00] text-[#F6F5F2] border-[#FF3B00]'
                                        : 'bg-[#0D0D0D] text-[#F6F5F2] border-[#0D0D0D] hover:bg-[#FF3B00] hover:border-[#FF3B00]'
                                    }`}
                                  >
                                    <span>[{f.citation2.label}]</span>
                                  </button>
                                )}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Engineering Action / Resolution Footer */}
                      <div className={`mt-4 p-3 border-l-2 font-mono-tech text-[11px] ${
                        isWarning
                          ? 'border-[#FF3B00] bg-[#FF3B00]/5 text-[#0D0D0D]'
                          : 'border-[#008A4B] bg-[#008A4B]/5 text-[#0D0D0D]'
                      }`}>
                        {msg.recommendation}
                      </div>
                    </div>
                  );
                })}

                {isSynthesizing && (
                  <div className="p-4 border border-[#0D0D0D] bg-[#EFECE6] font-mono-tech text-xs flex items-center justify-between">
                    <span>{t('scanning')}</span>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF3B00]" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Bottom Prompt Chips & Custom Query Input */}
              <div className="border-t border-[#E2E0DC] bg-[#EFECE6]/60 p-4">
                <div className="font-mono-tech text-[10px] text-[#686662] uppercase mb-2">
                  {t('presets')}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {PRESET_PROMPTS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => runPresetPrompt(preset)}
                      className="font-mono-tech text-[11px] px-2.5 py-1 bg-[#F6F5F2] border border-[#E2E0DC] hover:border-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-[#F6F5F2] transition-colors text-left"
                    >
                      {t(preset.labelKey)} →
                    </button>
                  ))}
                </div>

                {/* Custom Input Form */}
                <form onSubmit={handleCustomQuerySubmit} className="flex items-stretch border border-[#0D0D0D] bg-[#F6F5F2]">
                  <div className="px-3 flex items-center font-mono-tech text-xs text-[#FF3B00] select-none">
                    &gt;_
                  </div>
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder={t('placeholder')}
                    className="w-full py-3 pr-3 bg-transparent text-xs sm:text-sm text-[#0D0D0D] placeholder-[#686662] focus:outline-none font-mono-tech"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-[#0D0D0D] text-[#F6F5F2] hover:bg-[#FF3B00] hover:text-[#0D0D0D] transition-colors font-mono-tech text-xs font-medium uppercase flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>{t('execute')}</span>
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* ---------------------------------------------------------------
                RIGHT PANE (4 Cols): SYNCHRONIZED SOURCE & CLAUSE INSPECTOR
            ---------------------------------------------------------------- */}
            <div className="col-span-12 lg:col-span-4 flex flex-col justify-between bg-[#EFECE6]/40">
              <div>
                {/* Pane Subheader */}
                <div className="px-5 py-3 border-b border-[#E2E0DC] flex items-center justify-between font-mono-tech text-[11px]">
                  <span className="text-[#686662]">{t('paneC')}</span>
                  <span className="px-1.5 py-0.5 bg-[#FF3B00] text-[#F6F5F2] text-[10px]">
                    BBOX LOCKED
                  </span>
                </div>

                {/* Document Metadata Header */}
                <div className="p-5 border-b border-[#E2E0DC] bg-[#F6F5F2]">
                  <div className="flex items-center justify-between font-mono-tech text-[11px] text-[#686662] mb-1">
                    <span>SOURCE ID: {currentDoc.id} // {currentDoc.code}</span>
                    <span>REV: {currentDoc.rev}</span>
                  </div>
                  <h3 className="font-mono-tech text-sm font-bold text-[#0D0D0D]">
                    {currentDoc.filename}
                  </h3>
                  <p className="text-xs text-[#686662] mt-0.5">
                    {currentDoc.title}
                  </p>

                  {/* Clause Switcher Tabs within Current Doc */}
                  <div className="mt-3 pt-3 border-t border-[#E2E0DC] flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono-tech text-[10px] text-[#686662]">INSPECTING CLAUSE:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableClauseKeys.map((cKey) => (
                        <button
                          key={cKey}
                          type="button"
                          onClick={() => setActiveInspection({ docId: currentDoc.id, clauseKey: cKey })}
                          className={`font-mono-tech text-[11px] px-2 py-0.5 border ${
                            currentClauseKey === cKey
                              ? 'bg-[#0D0D0D] text-[#F6F5F2] border-[#0D0D0D]'
                              : 'bg-[#F6F5F2] text-[#0D0D0D] border-[#E2E0DC]'
                          }`}
                        >
                          {cKey}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extracted Schematic / Vector Diagram */}
                {currentClause && (
                  <div className="p-5 border-b border-[#E2E0DC]">
                    <div className="flex items-center justify-between font-mono-tech text-[10px] text-[#686662] mb-2">
                      <span>VECTOR SCHEMATIC EXTRACT // PAGE {currentClause.page}</span>
                      <span className="text-[#0D0D0D]">BBOX: {currentClause.bbox}</span>
                    </div>
                    <TechnicalSchematicSVG type={currentClause.schematicType} />
                  </div>
                )}

                {/* Highlighted Verbatim Passage with Bounding Box Frame */}
                {currentClause && (
                  <div className="p-5 border-b border-[#E2E0DC]">
                    <div className="flex items-center justify-between font-mono-tech text-[10px] mb-2">
                      <span className="font-semibold text-[#0D0D0D] uppercase">
                        {currentClause.section}
                      </span>
                      <span className="text-[#008A4B]">VERBATIM EXTRACT</span>
                    </div>

                    <div className="p-4 border-2 border-[#FF3B00] bg-[#F6F5F2] relative">
                      <span className="absolute -top-2.5 right-2 px-1.5 bg-[#FF3B00] text-[#F6F5F2] font-mono-tech text-[9px]">
                        BBOX {currentClause.bbox}
                      </span>
                      <p className="font-mono-tech text-xs text-[#0D0D0D] leading-relaxed">
                        "{currentClause.verbatim}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Extracted Normative Parameter Table */}
                {currentClause?.tableData && (
                  <div className="p-5">
                    <div className="font-mono-tech text-[10px] text-[#686662] uppercase mb-2">
                      PARSED PARAMETER SCHEDULE // STRUCTURED CELLS
                    </div>
                    <div className="border border-[#E2E0DC] bg-[#F6F5F2] divide-y divide-[#E2E0DC] font-mono-tech text-[11px]">
                      {currentClause.tableData.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-12 p-2.5 items-center">
                          <span className="col-span-5 text-[#686662] pr-2">{row.param}</span>
                          <span className="col-span-4 font-semibold text-[#0D0D0D]">{row.spec}</span>
                          <span className="col-span-3 text-right text-[10px] text-[#008A4B]">{row.tolerance}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inspector Footer */}
              <div className="p-4 border-t border-[#E2E0DC] bg-[#F6F5F2] font-mono-tech text-[10px] text-[#686662] flex items-center justify-between">
                <span>SHA-256: {currentDoc.hash}</span>
                <span className="text-[#0D0D0D]">ZERO INTERPOLATION</span>
              </div>
            </div>

          </div>
        </div>
      </section>
      )}

      {/* =====================================================================
          4. VERIFICATION & CONTRADICTION DETECTION MATRIX (02 / VERIFICATION)
      ====================================================================== */}
      {page === 'verification' && (
      <section ref={verificationRef} className="border-b border-[#E2E0DC] relative">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Section Header & 3-Mode Switcher */}
          <div className="grid grid-cols-12 border-b border-[#E2E0DC]">
            <div className="col-span-12 lg:col-span-5 p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#E2E0DC]">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="font-mono-tech text-xs px-2 py-0.5 bg-[#0D0D0D] text-[#F6F5F2]">02</span>
                <span className="font-mono-tech text-xs text-[#686662] uppercase tracking-wider">
                  {t('section02')}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0D0D0D]">
                {t('section02title')}
              </h2>
              <p className="mt-3 text-sm text-[#686662] leading-relaxed">
                {t('section02body')}
              </p>
            </div>

            {/* 3-Mode Interactive Switcher Tabs */}
            <div className="col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E0DC]">
              {[
                {
                  id: 'CONTRADICTION',
                  num: '[01]',
                  title: t('tabConflict'),
                  sub: 'OEM Spec vs. Plant Field SOP Diff',
                  badge: `${contradictionDiffs.filter((item) => item.severity !== 'ALIGNED').length} CONFLICTS`
                },
                {
                  id: 'CLAUSE',
                  num: '[02]',
                  title: t('tabClause'),
                  sub: 'Claim-to-Bounding-Box Audit',
                  badge: clauseTraces.length ? `${clauseTraces.length} TRACED` : 'NONE'
                },
                {
                  id: 'REVISION',
                  num: '[03]',
                  title: t('tabRevision'),
                  sub: '2021-REV-A vs. 2026-REV-C Delta',
                  badge: revisionAudits.length ? `${revisionAudits.length} RECORDED` : 'NONE'
                }
              ].map((tab) => {
                const isActive = verificationMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVerificationMode(tab.id)}
                    className={`p-6 sm:p-8 text-left flex flex-col justify-between transition-colors ${
                      isActive
                        ? 'bg-[#0D0D0D] text-[#F6F5F2]'
                        : 'bg-[#F6F5F2] text-[#0D0D0D] hover:bg-[#EFECE6]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono-tech text-xs mb-4">
                        <span className={isActive ? 'text-[#FF3B00]' : 'text-[#686662]'}>{tab.num}</span>
                        <span className={`px-2 py-0.5 text-[10px] ${
                          isActive
                            ? 'bg-[#FF3B00] text-[#F6F5F2]'
                            : 'bg-[#EFECE6] text-[#0D0D0D]'
                        }`}>
                          {tab.badge}
                        </span>
                      </div>
                      <div className="font-mono-tech text-sm font-bold tracking-tight">
                        {tab.title}
                      </div>
                      <p className={`text-xs mt-1.5 ${isActive ? 'text-[#F6F5F2]/70' : 'text-[#686662]'}`}>
                        {tab.sub}
                      </p>
                    </div>
                    <div className="mt-6 pt-3 border-t border-current/15 font-mono-tech text-[10px] flex items-center justify-between">
                      <span>{isActive ? 'ACTIVE MATRIX VIEW' : 'SELECT VIEW'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODE 01: CROSS-DOCUMENT CONTRADICTION VIEW */}
          {verificationMode === 'CONTRADICTION' && (
            <div className="grid grid-cols-12">
              {/* Left 7 Cols: Parameter Diff Table */}
              <div className="col-span-12 lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#E2E0DC] divide-y divide-[#E2E0DC]">
                <div className="px-6 py-3 bg-[#EFECE6] font-mono-tech text-[11px] text-[#686662] flex items-center justify-between">
                  <span>{t('tableHead')}</span>
                  <span>SELECT ROW TO INSPECT RESOLUTION</span>
                </div>

                {contradictionDiffs.map((diff) => {
                  const isSelected = selectedDiffId === diff.id;
                  const isAligned = diff.severity === 'ALIGNED';
                  return (
                    <div
                      key={diff.id}
                      onClick={() => setSelectedDiffId(diff.id)}
                      className={`p-6 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#EFECE6]' : 'bg-[#F6F5F2] hover:bg-[#EFECE6]/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tech text-xs mb-3">
                        <span className="font-bold text-[#0D0D0D]">
                          {diff.id} // {diff.parameter}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold ${
                          isAligned
                            ? 'bg-[#008A4B] text-[#F6F5F2]'
                            : 'bg-[#FF3B00] text-[#F6F5F2]'
                        }`}>
                          {diff.delta} · {diff.severity}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono-tech text-xs">
                        <div className="p-3 border border-[#E2E0DC] bg-[#F6F5F2]">
                          <div className="text-[10px] text-[#686662]">{diff.oemDoc}</div>
                          <div className="text-sm font-bold text-[#0D0D0D] mt-1">{diff.oemValue}</div>
                        </div>
                        <div className={`p-3 border ${
                          isAligned ? 'border-[#008A4B]/40 bg-[#F6F5F2]' : 'border-[#FF3B00] bg-[#FF3B00]/5'
                        }`}>
                          <div className="text-[10px] text-[#686662]">{diff.siteDoc}</div>
                          <div className={`text-sm font-bold mt-1 ${
                            isAligned ? 'text-[#008A4B]' : 'text-[#FF3B00]'
                          }`}>
                            {diff.siteValue}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right 5 Cols: Side-by-Side Conflict Resolution Inspector */}
              <div className="col-span-12 lg:col-span-5 p-6 sm:p-8 bg-[#EFECE6]/50 flex flex-col justify-between">
                {(() => {
                  const activeDiff = contradictionDiffs.find((d) => d.id === selectedDiffId) || contradictionDiffs[0];
                  if (!activeDiff) {
                    return (
                      <div className="font-mono-tech text-xs text-[#686662]">
                        {t('noConflicts')}
                      </div>
                    );
                  }
                  const isAligned = activeDiff.severity === 'ALIGNED';
                  return (
                    <>
                      <div>
                        <div className="flex items-center justify-between font-mono-tech text-xs pb-4 border-b border-[#E2E0DC]">
                          <span className="text-[#686662]">CONFLICT RESOLUTION DOSSIER</span>
                          <span className={isAligned ? 'text-[#008A4B]' : 'text-[#FF3B00]'}>
                            [{activeDiff.id}]
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-[#0D0D0D] mt-5">
                          {activeDiff.parameter}
                        </h3>
                        <p className="font-mono-tech text-xs text-[#686662] mt-1">
                          MEASUREMENT UNIT: {activeDiff.unit}
                        </p>

                        <div className="mt-6 space-y-4">
                          <div className="p-4 border border-[#0D0D0D] bg-[#F6F5F2]">
                            <div className="font-mono-tech text-[10px] text-[#686662] uppercase">
                              BASELINE NORMATIVE AUTHORITY (OEM / API)
                            </div>
                            <div className="font-mono-tech text-base font-bold text-[#0D0D0D] mt-1">
                              {activeDiff.oemValue}
                            </div>
                            <div className="font-mono-tech text-[11px] text-[#686662] mt-0.5">
                              Source: {activeDiff.oemDoc}
                            </div>
                          </div>

                          <div className={`p-4 border-2 ${
                            isAligned ? 'border-[#008A4B] bg-[#F6F5F2]' : 'border-[#FF3B00] bg-[#FF3B00]/10'
                          }`}>
                            <div className="font-mono-tech text-[10px] text-[#0D0D0D] uppercase">
                              FIELD OPERATING PROCEDURE SETPOINT (SOP)
                            </div>
                            <div className={`font-mono-tech text-base font-bold mt-1 ${
                              isAligned ? 'text-[#008A4B]' : 'text-[#FF3B00]'
                            }`}>
                              {activeDiff.siteValue}
                            </div>
                            <div className="font-mono-tech text-[11px] text-[#0D0D0D]/80 mt-0.5">
                              Source: {activeDiff.siteDoc}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-[#0D0D0D] text-[#F6F5F2]">
                          <div className="font-mono-tech text-[10px] text-[#FF3B00] uppercase mb-1">
                            DETERMINISTIC ENGINEERING directive
                          </div>
                          <p className="font-mono-tech text-xs leading-relaxed">
                            {activeDiff.resolution}
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 pt-4 border-t border-[#E2E0DC] flex items-center justify-between">
                        <span className="font-mono-tech text-[11px] text-[#686662]">
                          EXPORTABLE TO PLANT MOC (MANAGEMENT OF CHANGE)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeDiff.leftDocId && activeDiff.leftClauseKey) {
                              setActiveInspection({ docId: activeDiff.leftDocId, clauseKey: activeDiff.leftClauseKey });
                            }
                            scrollToSection(workbenchRef);
                          }}
                          className="font-mono-tech text-xs underline text-[#0D0D0D] hover:text-[#FF3B00]"
                        >
                          OPEN IN WORKBENCH →
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* MODE 02: CLAUSE VERIFICATION TRACE VIEW */}
          {verificationMode === 'CLAUSE' && (
            <div className="divide-y divide-[#E2E0DC]">
              <div className="px-6 py-3 bg-[#EFECE6] font-mono-tech text-[11px] text-[#686662] flex items-center justify-between">
                <span>{t('claimLog')}</span>
                <span className="text-[#008A4B]">CONFIDENCE: DETERMINISTIC BOUND</span>
              </div>
              {clauseTraces.length === 0 && (
                <div className="p-6 font-mono-tech text-xs text-[#686662]">{t('noTraces')}</div>
              )}
              {clauseTraces.map((item) => {
                const isSelected = selectedClaimId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedClaimId(item.id)}
                    className={`p-6 sm:px-10 cursor-pointer transition-colors grid grid-cols-12 gap-6 items-center ${
                      isSelected ? 'bg-[#EFECE6]' : 'bg-[#F6F5F2] hover:bg-[#EFECE6]/40'
                    }`}
                  >
                    <div className="col-span-12 lg:col-span-5">
                      <div className="flex items-center gap-2 font-mono-tech text-[11px] mb-1.5">
                        <span className="px-1.5 py-0.5 bg-[#0D0D0D] text-[#F6F5F2]">{item.id}</span>
                        <span className="text-[#008A4B] font-semibold">● {item.status}</span>
                      </div>
                      <p className="text-sm sm:text-base font-medium text-[#0D0D0D]">
                        {item.claim}
                      </p>
                    </div>

                    <div className="col-span-12 lg:col-span-7 border-l-2 border-[#0D0D0D] pl-5">
                      <div className="flex flex-wrap items-center justify-between font-mono-tech text-[11px] text-[#686662] mb-1">
                        <span className="text-[#0D0D0D] font-semibold">{item.sourceDoc} · {item.location}</span>
                        <span>BBOX: {item.bbox}</span>
                      </div>
                      <p className="font-mono-tech text-xs text-[#0D0D0D]/90 bg-[#F6F5F2] p-3 border border-[#E2E0DC]">
                        {item.rawExcerpt}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODE 03: REVISION DRIFT AUDIT VIEW */}
          {verificationMode === 'REVISION' && (
            <div className="divide-y divide-[#E2E0DC]">
              <div className="px-6 py-3 bg-[#EFECE6] font-mono-tech text-[11px] text-[#686662] flex items-center justify-between">
                <span>{t('revisionHead')}</span>
                <span className="text-[#FF3B00]">{String(revisionAudits.length).padStart(2, '0')} RECORDED</span>
              </div>
              {revisionAudits.length === 0 && (
                <div className="p-6 font-mono-tech text-xs text-[#686662]">{t('noRevisions')}</div>
              )}
              {revisionAudits.map((rev) => (
                <div key={rev.id} className="p-6 sm:px-10 grid grid-cols-12 gap-6 items-start bg-[#F6F5F2]">
                  <div className="col-span-12 lg:col-span-4">
                    <span className="font-mono-tech text-[10px] px-2 py-0.5 bg-[#FF3B00] text-[#F6F5F2]">
                      {rev.changeType}
                    </span>
                    <h4 className="font-mono-tech text-sm font-bold text-[#0D0D0D] mt-2">
                      {rev.section}
                    </h4>
                    <p className="text-xs text-[#686662] mt-1">
                      {rev.impact}
                    </p>
                  </div>

                  <div className="col-span-12 sm:col-span-6 lg:col-span-4 p-4 border border-[#E2E0DC] bg-[#EFECE6]/50 font-mono-tech">
                    <div className="text-[10px] text-[#686662]">LEGACY BASELINE // {rev.revOld}</div>
                    <div className="text-xs text-[#686662] line-through mt-1">{rev.oldVal}</div>
                  </div>

                  <div className="col-span-12 sm:col-span-6 lg:col-span-4 p-4 border border-[#0D0D0D] bg-[#F6F5F2] font-mono-tech">
                    <div className="text-[10px] text-[#008A4B]">CURRENT ACTIVE // {rev.revNew}</div>
                    <div className="text-xs font-bold text-[#0D0D0D] mt-1">{rev.newVal}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>
      )}

      {/* =====================================================================
          5. DETERMINISTIC INGESTION & SYNTHESIS WORKFLOW (03 / ARCHITECTURE)
      ====================================================================== */}
      {page === 'architecture' && (
      <section ref={architectureRef} className="border-b border-[#E2E0DC]">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Section Header */}
          <div className="p-6 sm:p-10 border-b border-[#E2E0DC] flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="font-mono-tech text-xs px-2 py-0.5 bg-[#0D0D0D] text-[#F6F5F2]">03</span>
                <span className="font-mono-tech text-xs text-[#686662] uppercase tracking-wider">
                  SYSTEM PIPELINE SCHEMATIC
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0D0D0D]">
                Deterministic ingestion &amp; synthesis architecture.
              </h2>
            </div>
            <p className="font-mono-tech text-xs text-[#686662] max-w-md">
              Built specifically for high-consequence industrial environments where generative approximation is unacceptable.
            </p>
          </div>

          {/* 4-Column Horizontal Architectural Schematic */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E2E0DC]">
            {ARCH_STEPS.map((step, idx) => {
              const isSelected = activeArchStep === idx;
              return (
                <div
                  key={step.num}
                  onClick={() => setActiveArchStep(idx)}
                  className={`p-6 sm:p-8 cursor-pointer transition-colors flex flex-col justify-between relative ${
                    isSelected ? 'bg-[#EFECE6]' : 'bg-[#F6F5F2] hover:bg-[#EFECE6]/50'
                  }`}
                >
                  <div>
                    {/* Step Top Meta */}
                    <div className="flex items-center justify-between font-mono-tech text-xs pb-4 mb-5 border-b border-[#E2E0DC]">
                      <span className="font-bold text-[#0D0D0D]">{step.num}</span>
                      <span className="px-2 py-0.5 bg-[#0D0D0D] text-[#F6F5F2] text-[10px]">
                        {step.code}
                      </span>
                    </div>

                    <h3 className="font-mono-tech text-sm sm:text-base font-bold text-[#0D0D0D] tracking-tight">
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#686662] mt-3 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {/* Technical Sub-Specs */}
                  <div className="mt-8 pt-4 border-t border-[#E2E0DC] space-y-2.5 font-mono-tech">
                    {step.metrics.map((m, mIdx) => (
                      <div key={mIdx} className="text-[11px]">
                        <div className="text-[10px] text-[#686662]">{m.k}</div>
                        <div className="text-[#0D0D0D] font-medium">{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
      )}

      {/* =====================================================================
          6. RESTRAINED ARCHITECTURAL FOOTER
      ====================================================================== */}
      <footer className="bg-[#0D0D0D] text-[#F6F5F2]">
        <div className="max-w-[1600px] mx-auto grid grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#F6F5F2]/15">
          
          {/* Col 1: Brand & System Identifier */}
          <div className="col-span-12 lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 bg-[#FF3B00]" />
                <span className="font-bold tracking-tight text-base uppercase">
                  SYNAI // PHOSMIND INDUSTRIAL SYSTEMS
                </span>
              </div>
              <p className="mt-4 text-xs sm:text-sm text-[#F6F5F2]/70 max-w-md leading-relaxed">
                Deterministic technical document intelligence for refining, power generation, automated manufacturing, and safety-critical control engineering.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#F6F5F2]/15 font-mono-tech text-[11px] text-[#F6F5F2]/60 flex flex-wrap items-center justify-between gap-2">
              <span>BUILD // SYNAI-CORE-4.18.0-PROD</span>
              <span>© {new Date().getFullYear()} PHOSMIND INDUSTRIAL</span>
            </div>
          </div>

          {/* Col 2: Deployment & Security Posture */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 p-8 sm:p-10 font-mono-tech text-xs space-y-4">
            <div className="text-[11px] text-[#FF3B00] uppercase tracking-wider">
              DEPLOYMENT &amp; SOVEREIGNTY POSTURE
            </div>
            <div className="space-y-2.5 text-[11px]">
              <div className="flex justify-between py-1.5 border-b border-[#F6F5F2]/10">
                <span className="text-[#F6F5F2]/60">AIR-GAPPED ON-PREMISE</span>
                <span className="text-[#008A4B]">SUPPORTED (K8S / BARE METAL)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F6F5F2]/10">
                <span className="text-[#F6F5F2]/60">CUSTOMER CORPUS TRAINING</span>
                <span>ZERO RETENTION / ISOLATED</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F6F5F2]/10">
                <span className="text-[#F6F5F2]/60">SUPPORTED FORMATS</span>
                <span>PDF, DWG, DXF, XML, STEP</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#F6F5F2]/60">CITATION VERIFICATION</span>
                <span>SHA-256 + BBOX COORDINATES</span>
              </div>
            </div>
          </div>

          {/* Col 3: Quick Navigation & Terminal Return */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-8 sm:p-10 flex flex-col justify-between font-mono-tech text-xs">
            <div>
              <div className="text-[11px] text-[#F6F5F2]/60 uppercase tracking-wider mb-4">
                SYSTEM INDEX
              </div>
              <ul className="space-y-2.5">
                <li>
                  <button
                    onClick={() => scrollToSection(workbenchRef)}
                    className="hover:text-[#FF3B00] transition-colors"
                  >
                    01 / INTERACTIVE WORKBENCH →
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(verificationRef)}
                    className="hover:text-[#FF3B00] transition-colors"
                  >
                    02 / CONTRADICTION MATRIX →
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(architectureRef)}
                    className="hover:text-[#FF3B00] transition-colors"
                  >
                    03 / PIPELINE ARCHITECTURE →
                  </button>
                </li>
              </ul>
            </div>

            <a
              href="#top"
              className="mt-8 px-4 py-3 border border-[#F6F5F2]/30 hover:bg-[#F6F5F2] hover:text-[#0D0D0D] transition-colors flex items-center justify-between text-[11px]"
            >
              <span>RETURN TO TOP RETICLE</span>
              <span>↑</span>
            </a>
          </div>

        </div>
      </footer>
    </div>
  );
}