import React, { useState, useRef } from 'react';
import { getAllUsers } from '../../services/users';
import { parseVcfRaw, prepareContactsForImport, VcfAnalysisResult, PreparedVcfContact } from '../../services/vcfParser';
import { importVcfContactsBatch, ImportProgress, ImportSummary } from '../../services/vcfImporter';
import { useAuth } from '../../context/AuthContext';
import { Gender } from '../../types';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Users,
  Copy,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  X,
  Search,
  Check,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface AdminVcfImportProps {
  onNavigate?: (path: string) => void;
  onSuccess?: () => void;
}

export const AdminVcfImport: React.FC<AdminVcfImportProps> = ({ onNavigate, onSuccess }) => {
  const { addToast } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [analysis, setAnalysis] = useState<VcfAnalysisResult | null>(null);

  // Configuration options
  const [defaultGender, setDefaultGender] = useState<Gender>('male');
  const [updateExisting, setUpdateExisting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'ready' | 'already_in_db' | 'duplicate_in_file' | 'invalid'>('ready');

  // Import execution state
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [resultSummary, setResultSummary] = useState<ImportSummary | null>(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);

  // Handle file reading
  const processFile = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.vcf') && !selectedFile.name.toLowerCase().endsWith('.vcard')) {
      addToast('Veuillez sélectionner un fichier au format .vcf ou .vcard.', 'error');
      return;
    }

    setFile(selectedFile);
    setLoadingFile(true);
    setResultSummary(null);
    setProgress(null);

    try {
      // Read file content
      const text = await selectedFile.text();

      // 1. Fetch current users to detect duplicates in DB
      const existingUsers = await getAllUsers();
      const existingPhoneMap = new Map<string, { id: string; displayName: string; createdAt?: string }>();
      existingUsers.forEach((u) => {
        if (u.phoneNormalized) existingPhoneMap.set(u.phoneNormalized, { id: u.id, displayName: u.displayName || u.firstName, createdAt: u.createdAt });
        if (u.phone) existingPhoneMap.set(u.phone, { id: u.id, displayName: u.displayName || u.firstName, createdAt: u.createdAt });
      });

      // 2. Parse raw VCF
      const rawCards = parseVcfRaw(text);
      if (rawCards.length === 0) {
        addToast('Aucune fiche vCard valide détectée dans le fichier.', 'error');
        setAnalysis(null);
        setLoadingFile(false);
        return;
      }

      // 3. Prepare and analyze contacts
      const preparedResult = prepareContactsForImport(rawCards, existingPhoneMap, {
        defaultGender,
        defaultCountry: 'Haïti (+509)',
      });

      setAnalysis(preparedResult);
      addToast(`${preparedResult.totalDetected} contacts analysés avec succès !`, 'success');
    } catch (err: any) {
      console.error('Error processing VCF:', err);
      addToast('Erreur lors de la lecture du fichier VCF.', 'error');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  // Re-run analysis if default gender changes
  const handleGenderToggle = async (newGender: Gender) => {
    setDefaultGender(newGender);
    if (!file) return;

    try {
      const text = await file.text();
      const existingUsers = await getAllUsers();
      const existingPhoneMap = new Map<string, { id: string; displayName: string; createdAt?: string }>();
      existingUsers.forEach((u) => {
        if (u.phoneNormalized) existingPhoneMap.set(u.phoneNormalized, { id: u.id, displayName: u.displayName || u.firstName, createdAt: u.createdAt });
        if (u.phone) existingPhoneMap.set(u.phone, { id: u.id, displayName: u.displayName || u.firstName, createdAt: u.createdAt });
      });
      const rawCards = parseVcfRaw(text);
      const updated = prepareContactsForImport(rawCards, existingPhoneMap, {
        defaultGender: newGender,
        defaultCountry: 'Haïti (+509)',
      });
      setAnalysis(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Execute batch import
  const handleStartImport = async () => {
    if (!analysis || analysis.contacts.length === 0) return;

    setImporting(true);
    setProgress({
      processed: 0,
      total: updateExisting ? analysis.readyCount + analysis.alreadyInDbCount : analysis.readyCount,
      percent: 0,
      currentBatch: 1,
      totalBatches: Math.ceil((updateExisting ? analysis.readyCount + analysis.alreadyInDbCount : analysis.readyCount) / 200) || 1,
      statusText: 'Initialisation de l\'importation...',
    });

    try {
      const summary = await importVcfContactsBatch(analysis.contacts, {
        updateExisting,
        onProgress: (p) => setProgress(p),
      });

      setResultSummary(summary);
      addToast(`Importation terminée : ${summary.importedCount} contact(s) ajouté(s) à la base !`, 'success');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Import failed:', err);
      addToast('Une erreur est survenue pendant l\'importation.', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Filter preview contacts
  const filteredContacts = (analysis?.contacts || []).filter((c) => {
    const matchesTab = tabFilter === 'all' || c.status === tabFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      c.displayName.toLowerCase().includes(q) ||
      c.originalName.toLowerCase().includes(q) ||
      c.phoneNormalized.includes(q) ||
      c.rawPhone.includes(q);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#0c140f] via-[#101b14] to-[#0a110c] border border-emerald-500/30 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              MODULE ADMINISTRATEUR VCF
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase mt-1">
            IMPORTATION AUTOMATIQUE VCF
          </h1>
          <p className="text-xs text-zinc-400 max-w-xl mt-1">
            Importez en quelques secondes votre répertoire téléphonique (.vcf) avec attribution automatique du badge officiel BZK et élimination rigoureuse des doublons.
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('/admin')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 transition self-start sm:self-auto cursor-pointer"
          >
            Retour aux Contacts
          </button>
        )}
      </div>

      {/* RESULT STATE SUCCESS */}
      {resultSummary && (
        <div className="p-8 rounded-3xl bg-gradient-to-b from-emerald-950/60 to-[#09120c] border border-emerald-500/40 shadow-2xl space-y-6 text-center animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">IMPORTATION RÉUSSIE !</h2>
            <p className="text-sm text-zinc-300 max-w-md mx-auto">
              Tous les contacts valides ont été enregistrés de manière permanente dans la base de données BZK FOLDER.
            </p>
          </div>

          {/* SUMMARY STATS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30">
              <div className="text-2xl font-black text-emerald-400">{resultSummary.importedCount}</div>
              <div className="text-[11px] text-zinc-400 font-bold uppercase mt-1">Nouveaux Importés</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
              <div className="text-2xl font-black text-cyan-300">{resultSummary.updatedCount}</div>
              <div className="text-[11px] text-zinc-400 font-bold uppercase mt-1">Mis à Jour</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
              <div className="text-2xl font-black text-amber-300">{resultSummary.skippedCount}</div>
              <div className="text-[11px] text-zinc-400 font-bold uppercase mt-1">Doublons Ignorés</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
              <div className="text-2xl font-black text-rose-400">{resultSummary.errorCount}</div>
              <div className="text-[11px] text-zinc-400 font-bold uppercase mt-1">Erreurs</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {onNavigate && (
              <button
                onClick={() => onNavigate('/admin')}
                className="px-6 py-3.5 rounded-2xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl transition flex items-center gap-2 cursor-pointer"
              >
                <span>VOIR LA LISTE COMPLÈTE DES CONTACTS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                setFile(null);
                setAnalysis(null);
                setResultSummary(null);
                setProgress(null);
              }}
              className="px-6 py-3.5 rounded-2xl text-xs font-bold text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/15 transition cursor-pointer"
            >
              Importer un autre fichier .vcf
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: UPLOAD ZONE (WHEN NO ANALYSIS OR NOT IMPORTING) */}
      {!resultSummary && !analysis && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`p-10 sm:p-14 rounded-3xl border-2 border-dashed transition text-center space-y-6 ${
            isDragging
              ? 'border-emerald-400 bg-emerald-950/20 shadow-2xl shadow-emerald-950/50'
              : 'border-emerald-500/30 bg-[#080e0a] hover:border-emerald-500/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".vcf,.vcard,text/vcard,text/x-vcard"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-cyan-500 p-0.5 shadow-xl shadow-emerald-600/30">
            <div className="w-full h-full bg-[#0a140d] rounded-[22px] flex items-center justify-center">
              <Upload className="w-10 h-10 text-emerald-400" />
            </div>
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              SÉLECTIONNEZ VOTRE FICHIER .VCF
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Glissez-déposez votre carnet d'adresses ou cliquez ci-dessous pour choisir le fichier depuis votre téléphone Android ou votre ordinateur.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loadingFile}
              className="px-8 py-4 rounded-2xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-900/40 border border-emerald-400/30 transition transform active:scale-95 flex items-center gap-2.5 cursor-pointer"
            >
              {loadingFile ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyse du fichier en cours...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>PARCOURIR LES FICHIERS (.VCF)</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-500 font-mono">
            <span>✓ Prise en charge vCard 2.1, 3.0 & 4.0</span>
            <span>•</span>
            <span>✓ Caractères accentués & UTF-8</span>
            <span>•</span>
            <span>✓ Détection automatique des doublons</span>
          </div>
        </div>
      )}

      {/* STEP 2: PREVIEW & IMPORT CONTROLS */}
      {!resultSummary && analysis && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* FILE SUMMARY BAR */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#09120c] border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-black text-white">{file?.name}</div>
                <div className="text-xs text-zinc-400 font-mono">
                  {((file?.size || 0) / 1024).toFixed(1)} Ko • {analysis.totalDetected} contact(s) détecté(s)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFile(null);
                  setAnalysis(null);
                  setProgress(null);
                }}
                disabled={importing}
                className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Changer de fichier</span>
              </button>
            </div>
          </div>

          {/* ANALYSIS METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* PRÊTS À IMPORTER */}
            <div
              onClick={() => setTabFilter('ready')}
              className={`p-5 rounded-2xl border transition cursor-pointer ${
                tabFilter === 'ready'
                  ? 'bg-emerald-950/40 border-emerald-400 shadow-lg shadow-emerald-950/50'
                  : 'bg-[#080e0a] border-emerald-500/20 hover:border-emerald-500/40'
              }`}
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                <span>Prêts à Importer</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-300 mt-2">{analysis.readyCount}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Nouveaux contacts valides</div>
            </div>

            {/* DÉJÀ PRÉSENTS DANS LA BASE */}
            <div
              onClick={() => setTabFilter('already_in_db')}
              className={`p-5 rounded-2xl border transition cursor-pointer ${
                tabFilter === 'already_in_db'
                  ? 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-950/50'
                  : 'bg-[#080e0a] border-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                <span>Déjà en Base</span>
                <Copy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-300 mt-2">{analysis.alreadyInDbCount}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Numéros déjà enregistrés</div>
            </div>

            {/* DOUBLONS DANS LE FICHIER */}
            <div
              onClick={() => setTabFilter('duplicate_in_file')}
              className={`p-5 rounded-2xl border transition cursor-pointer ${
                tabFilter === 'duplicate_in_file'
                  ? 'bg-purple-950/40 border-purple-400 shadow-lg'
                  : 'bg-[#080e0a] border-purple-500/20 hover:border-purple-500/40'
              }`}
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
                <span>Doublons Fichier</span>
                <Filter className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-purple-300 mt-2">{analysis.duplicateInFileCount}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Répétitions internes</div>
            </div>

            {/* INVALIDES */}
            <div
              onClick={() => setTabFilter('invalid')}
              className={`p-5 rounded-2xl border transition cursor-pointer ${
                tabFilter === 'invalid'
                  ? 'bg-rose-950/40 border-rose-400 shadow-lg'
                  : 'bg-[#080e0a] border-rose-500/20 hover:border-rose-500/40'
              }`}
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
                <span>Invalides</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-black text-rose-300 mt-2">{analysis.invalidCount}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Sans numéro valide</div>
            </div>

          </div>

          {/* OPTIONS AND CONTROLS */}
          <div className="p-6 rounded-3xl bg-[#09120c] border border-emerald-500/20 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Paramètres d'attribution BZK
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* DEFAULT GENDER CHOICE */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <label className="block text-xs font-bold text-white">
                  Badge par défaut (si non spécifié) :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenderToggle('male')}
                    disabled={importing}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      defaultGender === 'male'
                        ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>🥷 GARÇON</span>
                    <span className="text-[10px] font-mono text-emerald-300">🥷 𝑩𝒁𝑲 🌪️</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenderToggle('female')}
                    disabled={importing}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      defaultGender === 'female'
                        ? 'bg-pink-500/25 border-pink-400 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>🌸 FILLE</span>
                    <span className="text-[10px] font-mono text-pink-300">🌸 𝑩𝒁𝑲 🌪️</span>
                  </button>
                </div>
              </div>

              {/* DUPLICATE HANDLING CHECKBOX */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">
                    Gestion des doublons existants
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {updateExisting
                      ? 'Les doublons seront mis à jour avec les nouvelles infos du fichier.'
                      : 'Les doublons déjà dans la base seront ignorés (aucun doublon créé).'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    disabled={importing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

            </div>

            {/* PROGRESS BAR IF IMPORTING */}
            {importing && progress && (
              <div className="p-5 rounded-2xl bg-black/60 border border-emerald-500/40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-300 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    {progress.statusText}
                  </span>
                  <span className="font-mono text-white text-sm">{progress.percent}%</span>
                </div>

                <div className="w-full h-3.5 rounded-full bg-white/10 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-300 shadow-lg shadow-emerald-500/50"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>

                <div className="text-[11px] font-mono text-zinc-400 flex justify-between">
                  <span>Lot {progress.currentBatch} sur {progress.totalBatches}</span>
                  <span>{progress.processed} / {progress.total} contacts traités</span>
                </div>
              </div>
            )}

            {/* ACTION BUTTON */}
            {!importing && (
              <div className="pt-2">
                <button
                  onClick={handleStartImport}
                  disabled={analysis.readyCount === 0 && (!updateExisting || analysis.alreadyInDbCount === 0)}
                  className="w-full py-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-xl shadow-emerald-950/50 border border-emerald-400/40 transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-5 h-5" />
                  <span>
                    IMPORTER LES CONTACTS ({updateExisting ? analysis.readyCount + analysis.alreadyInDbCount : analysis.readyCount})
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

          </div>

          {/* STEP 3: PREVIEW TABLE */}
          <div className="rounded-3xl bg-[#09120c] border border-emerald-500/20 overflow-hidden shadow-2xl space-y-4 p-5">
            
            {/* SEARCH AND FILTER BAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setTabFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    tabFilter === 'all' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tous ({analysis.totalDetected})
                </button>
                <button
                  onClick={() => setTabFilter('ready')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    tabFilter === 'ready' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Prêts ({analysis.readyCount})
                </button>
                <button
                  onClick={() => setTabFilter('already_in_db')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    tabFilter === 'already_in_db' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Déjà en base ({analysis.alreadyInDbCount})
                </button>
                <button
                  onClick={() => setTabFilter('duplicate_in_file')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    tabFilter === 'duplicate_in_file' ? 'bg-purple-500/25 text-purple-300 border border-purple-500/30' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Doublons fichier ({analysis.duplicateInFileCount})
                </button>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher nom ou numéro..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>
            </div>

            {/* CONTACTS TABLE */}
            <div className="overflow-x-auto max-h-[460px] border border-white/5 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 text-zinc-400 font-mono uppercase text-[11px] sticky top-0 border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Nom VCF</th>
                    <th className="py-3 px-4">Identité BZK Générée</th>
                    <th className="py-3 px-4">Numéro Normalisé</th>
                    <th className="py-3 px-4">Pays</th>
                    <th className="py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-zinc-500">
                        Aucun contact correspondant à ce filtre.
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.slice(0, 100).map((contact) => (
                      <tr key={contact.id} className="hover:bg-white/[0.02] transition">
                        
                        {/* ORIGINAL NAME */}
                        <td className="py-3 px-4 text-zinc-300 font-medium truncate max-w-[180px]">
                          {contact.originalName}
                        </td>

                        {/* DISPLAY NAME */}
                        <td className="py-3 px-4 font-bold text-white truncate max-w-[220px]">
                          {contact.displayName}
                        </td>

                        {/* PHONE */}
                        <td className="py-3 px-4 font-mono font-bold text-emerald-300 whitespace-nowrap">
                          {contact.phoneNormalized || contact.rawPhone}
                        </td>

                        {/* COUNTRY */}
                        <td className="py-3 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                          {contact.country}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {contact.status === 'ready' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3" /> Prêt
                            </span>
                          )}

                          {contact.status === 'already_in_db' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit" title={contact.reason}>
                              <Copy className="w-3 h-3" /> En Base
                            </span>
                          )}

                          {contact.status === 'duplicate_in_file' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 w-fit" title={contact.reason}>
                              Doublon VCF
                            </span>
                          )}

                          {contact.status === 'invalid' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 w-fit" title={contact.reason}>
                              Invalide
                            </span>
                          )}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredContacts.length > 100 && (
              <div className="text-[11px] text-zinc-500 font-mono text-center pt-1">
                Affichage des 100 premiers contacts sur {filteredContacts.length}.
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
