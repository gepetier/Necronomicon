import { seedData } from "../data.js";
import {
  escapeAttribute,
  escapeHtml,
  formatShortDate,
  paletteStyle,
  readString,
  renderChronicleMedia,
  renderChronicleRichText,
  renderEditorActions,
  renderEditorCard,
  renderEditorWorkspaceHeader,
  renderInputField,
  renderModuleActionIcon,
  renderRichTextareaField,
  renderStatusPills,
} from "./utils.js";

export function renderChroniclesModule({
  state,
  rootEl,
  getSelectedChronicle,
  renderPlayerNotesPanel,
  renderPlayerNotesFab,
  canEditChronicle = () => true,
  canCreateChronicle = true,
  canDeleteChronicle = true,
}) {
  const current = getSelectedChronicle();
  const primaryImage = current?.imageAssets?.[0] || "";
  const showLanding = state.ui.showChronicleLanding && !state.ui.editModes.chronicles;
  const isEditingCurrent = state.ui.editModes.chronicles && canEditChronicle(current);

  rootEl.innerHTML = `
    <section class="book-shell ${showLanding ? "chronicle-landing-shell" : ""} ${state.ui.notesPanelOpen ? "notes-open" : ""} ${isEditingCurrent ? "chronicles-editing" : ""}">
      ${showLanding
        ? renderChronicleLanding(state, { canCreateChronicle })
        : `
          <div class="book-layout">
            ${renderChronicleIndexPanel(state, current, { variant: "inline", canEditChronicle, canCreateChronicle })}
            ${isEditingCurrent
              ? renderChronicleEditingStage(current, state, { canDeleteChronicle })
              : renderChronicleReadSpread(current, primaryImage, renderPlayerNotesPanel, renderPlayerNotesFab, state, { canEditChronicle })}
          </div>
        `}
    </section>
  `;
}

export function renderChronicleSidebarPanel(state, current, permissions = {}) {
  return renderChronicleIndexPanel(state, current, { variant: "sidebar", ...permissions });
}

export function saveChronicle(formData, { getSelectedChronicle, showSaveNotice }) {
  const chronicle = getSelectedChronicle();
  if (!chronicle) {
    return;
  }

  chronicle.chapter = readString(formData, "chapter");
  chronicle.title = readString(formData, "title");
  chronicle.date = readString(formData, "date");
  chronicle.summary = readString(formData, "summary");
  chronicle.content = readString(formData, "content");
  chronicle.highlights = readString(formData, "highlights");

  if (formData.has("imageNote")) {
    chronicle.imageNote = readString(formData, "imageNote");
  }

  if (formData.has("imageAssets")) {
    chronicle.imageAssets = readString(formData, "imageAssets")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (formData.has("voiceNotes")) {
    chronicle.voiceNotes = readString(formData, "voiceNotes")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (formData.has("characterIds")) {
    chronicle.characterIds = formData.getAll("characterIds").map(String);
  }
  chronicle.editableByUserEmails = readString(formData, "editableByUserEmails")
    .split(/[\n,]/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  showSaveNotice("Cronica desada");
}

export function createChronicle(state) {
  const newChronicle = {
    id: `s${Date.now()}`,
    chapter: `Sessio ${state.chronicles.length + 1}`,
    title: "Nova cronica",
    date: "",
    summary: "",
    content: "",
    highlights: "",
    imageNote: "",
    imageAssets: [],
    playerNotes: [],
    voiceNotes: [],
    characterIds: [],
    editableByUserEmails: [],
    palette: ["#64483d", "#c8a86d"],
  };
  state.chronicles.push(newChronicle);
  state.ui.selectedChronicleId = newChronicle.id;
}

export function deleteChronicle(state) {
  if (state.chronicles.length <= 1) {
    return;
  }

  state.chronicles = state.chronicles.filter((chronicle) => chronicle.id !== state.ui.selectedChronicleId);
  state.ui.selectedChronicleId = state.chronicles[0].id;
}

function renderChronicleIndexEntry(chronicle, state, canEditChronicle = () => true) {
  const isActive = chronicle.id === state.ui.selectedChronicleId;
  const dateLabel = formatShortDate(chronicle.date) || chronicle.date || "Sense data";

  return `
    <article
      class="chapter-entry index-entry ${isActive ? "active" : ""}"
      data-chronicle-id="${chronicle.id}"
      tabindex="0"
      role="option"
      aria-selected="${isActive ? "true" : "false"}"
      aria-label="${escapeAttribute(`Obre ${chronicle.chapter}: ${chronicle.title}`)}"
    >
      ${renderStatusPills(getChronicleStatusPills(chronicle, state))}
      <div class="chapter-entry-head">
        <div class="chapter-entry-copy">
          <p class="chapter-entry-kicker">${escapeHtml(chronicle.chapter)}</p>
          <strong>${escapeHtml(chronicle.title)}</strong>
          <small>${escapeHtml(dateLabel)}</small>
        </div>
        ${isActive && canEditChronicle(chronicle)
          ? `
            <button
              type="button"
              class="secondary chronicle-inline-edit"
              data-toggle-edit="chronicles"
              aria-pressed="${state.ui.editModes.chronicles ? "true" : "false"}"
              aria-label="${escapeAttribute(state.ui.editModes.chronicles ? "Tanca edicio de cronica" : "Edita cronica")}"
              title="${escapeAttribute(state.ui.editModes.chronicles ? "Tanca edicio" : "Edita cronica")}"
            >
              <span class="module-action-icon">${renderModuleActionIcon("chronicles")}</span>
            </button>
          `
          : ""}
      </div>
    </article>
  `;
}

function renderChronicleReadSpread(current, primaryImage, renderPlayerNotesPanel, renderPlayerNotesFab, state, permissions = {}) {
  const canEditChronicle = permissions.canEditChronicle || (() => true);
  const linkedContent = autoLinkChronicleReferences(current?.content || "", state);
  const bodyParts = splitChronicleBody(linkedContent);
  const openingBody = bodyParts.opening || "Encara no hi ha cos de capitol.";
  const continuationBody = bodyParts.continuation;

  return `
    <div class="book-spread">
      <article class="book-page left-page">
        <div class="page-header">
          <div class="page-header-main">
            <p class="eyebrow">${escapeHtml(current?.chapter || "Sessio")}</p>
            <h3>${escapeHtml(current?.title || "Sense cronica")}</h3>
            <span>${escapeHtml(current?.date || "")}</span>
          </div>
          ${canEditChronicle(current) ? `<button
            type="button"
            class="secondary module-edit-button chronicle-page-edit"
            data-toggle-edit="chronicles"
            aria-label="Edita cronica"
            title="Edita cronica"
          >
            <span class="module-action-icon">${renderModuleActionIcon("chronicles")}</span>
            <span>Edita cronica</span>
          </button>` : ""}
        </div>
        <figure class="book-image-frame">
          ${primaryImage
            ? `<img class="book-image-media" src="${escapeAttribute(primaryImage)}" alt="${escapeAttribute(current?.title || "Imatge de cronica")}" loading="lazy" />`
            : renderChronicleCoverPlate(current)}
        </figure>
        <div class="chapter-body chapter-opening rich-text">${renderChronicleRichText(openingBody)}</div>
        <div class="page-footer">
          <span class="page-number">Pagina esquerra</span>
          <span>${escapeHtml(formatShortDate(current?.date) || current?.date || "")}</span>
        </div>
      </article>
      <article class="book-page right-page">
        <div class="book-controls">
          <button type="button" class="secondary" data-chronicle-nav="prev">Pagina anterior</button>
          <button type="button" data-chronicle-nav="next">Pagina seguent</button>
        </div>
        <div class="chapter-body rich-text">${renderChronicleRichText(continuationBody || openingBody)}</div>
        ${renderChronicleMedia(current)}
        <div class="link-list">
          ${renderPlayerNotesPanel()}
        </div>
        ${renderPlayerNotesFab({ inline: true })}
      </article>
    </div>
  `;
}

function splitChronicleBody(content) {
  const normalizedContent = String(content || "").trim();
  if (!normalizedContent) {
    return { opening: "", continuation: "" };
  }

  if (normalizedContent.length < 1200) {
    return { opening: shortChronicleText(normalizedContent, 420), continuation: normalizedContent };
  }

  const preferredMin = 1700;
  const preferredMax = 2200;
  const preferredSlice = normalizedContent.slice(preferredMin, preferredMax);
  const sentenceBreak = preferredSlice.search(/[.!?…](\s+|$)/);

  if (sentenceBreak >= 0) {
    const splitIndex = preferredMin + sentenceBreak + 1;
    return {
      opening: normalizedContent.slice(0, splitIndex).trim(),
      continuation: normalizedContent.slice(splitIndex).trim(),
    };
  }

  const fallbackBreak = normalizedContent.lastIndexOf(" ", preferredMax);
  const splitIndex = fallbackBreak > preferredMin ? fallbackBreak : preferredMax;

  return {
    opening: normalizedContent.slice(0, splitIndex).trim(),
    continuation: normalizedContent.slice(splitIndex).trim(),
  };
}

function autoLinkChronicleReferences(content, state) {
  const text = String(content || "");
  if (!text.trim()) {
    return text;
  }

  const candidates = buildChronicleReferenceCandidates(state);
  const linkedIds = new Set();
  return candidates.reduce((nextText, candidate) => {
    if (linkedIds.has(candidate.id)) {
      return nextText;
    }

    const replacedText = replaceFirstReferenceCandidate(nextText, candidate);
    if (replacedText !== nextText) {
      linkedIds.add(candidate.id);
    }
    return replacedText;
  }, text);
}

function buildChronicleReferenceCandidates(state) {
  const aliasesById = new Map();
  const addAlias = (id, alias) => {
    const cleanAlias = String(alias || "").trim();
    if (!id || cleanAlias.length < 3) {
      return;
    }
    const currentAliases = aliasesById.get(id) || new Set();
    currentAliases.add(cleanAlias);
    aliasesById.set(id, currentAliases);
  };

  (state.characters || []).forEach((character) => {
    addAlias(character.id, character.name);
    if (character.id === "damakos") {
      addAlias(character.id, "Damakos");
    }
  });

  (state.glossary || []).forEach((entry) => {
    addAlias(entry.id, entry.name);
    addAlias(entry.id, String(entry.name || "").split(",")[0]);
  });

  Object.entries(CHRONICLE_REFERENCE_ALIASES).forEach(([id, aliases]) => {
    aliases.forEach((alias) => addAlias(id, alias));
  });

  return [...aliasesById.entries()]
    .flatMap(([id, aliases]) => [...aliases].map((alias) => ({ id, alias })))
    .sort((left, right) => right.alias.length - left.alias.length || left.alias.localeCompare(right.alias, "ca"));
}

function replaceFirstReferenceCandidate(text, candidate) {
  const tokenPattern = /(\[\[[^\]]+\]\]|\{\{media:[^{}]+\}\})/g;
  const parts = String(text).split(tokenPattern);
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escapeRegExp(candidate.alias)})(?=$|[^\\p{L}\\p{N}_])`, "iu");

  let replaced = false;
  const nextParts = parts.map((part) => {
    if (replaced || tokenPattern.test(part)) {
      tokenPattern.lastIndex = 0;
      return part;
    }

    const nextPart = part.replace(pattern, (fullMatch, prefix, label) => {
      replaced = true;
      return `${prefix}[[${candidate.id}|${label}]]`;
    });
    tokenPattern.lastIndex = 0;
    return nextPart;
  });

  return replaced ? nextParts.join("") : text;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const CHRONICLE_REFERENCE_ALIASES = {
  "abominacions-del-sagnatori": ["abominacions"],
  "acantilado-del-silencio": ["Acantilado del Silencio", "Acantilado"],
  "ancora-de-submissio": ["àncora de cadena", "àncora de submissió"],
  andoras: ["Andoras"],
  "avatar-de-nishaar": ["gat negre"],
  "canviaformes-del-plaer": ["dimonis canviaformes", "canviaformes"],
  "catedral-del-silencio": ["Catedral"],
  "concilio-del-silencio": ["Concilio del Silencio"],
  "criatura-mineral-encadenada": ["criatura mineral"],
  "cuina-del-sagnatori": ["cuina"],
  dren: ["Dren"],
  elyse: ["Elyse"],
  "espasa-viva-de-nelthan": ["espasa viva"],
  "fossa-ritual": ["Fossa ritual", "Fossa"],
  "gran-hierofante": ["Gran Hierofante", "Hierofante"],
  "hermana-seraphe": ["Hermana Seraphe", "Seraphe"],
  "insignies-de-voluntari": ["insígnies de voluntari", "insígnies", "insignia"],
  "ish-nael": ["Ish'Nael", "Ish’Nael"],
  kaelor: ["Kaelor"],
  "marca-de-nishaar": ["marca de Nisha'ar", "marca de Nisha’ar"],
  "mar-de-sang": ["mar de sang", "marea de sang"],
  mijo: ["Mijo"],
  nishaar: ["Nisha'ar", "Nisha’ar"],
  "pedra-vermella-del-receptori": ["pedra vermella"],
  "piscina-central": ["Piscina Central"],
  "portadores-del-velo": ["Portadores del Velo"],
  "quarto-de-manteniment": ["quarto de manteniment"],
  receptori: ["Receptori"],
  "reina-elisabeth": ["Reina Elisabeth", "Elisabeth"],
  "sagnatori": ["Sagnatori"],
  "sala-dels-plaers": ["Sala dels Plaers"],
  uric: ["Uric"],
  "varron-thayne": ["Varron Thayne", "Varron"],
  "voluntaris-del-sagnatori": ["voluntaris"],
  "voz-de-kaelor": ["Voz de Kaelor", "Voz"],
  "zaher-ar-kal": ["Zaher-Ar'Kal", "Zaher-Ar’Kal"],
};

function renderChronicleCoverPlate(current) {
  return `
    <div class="book-cover-plate" style="${paletteStyle(current?.palette || seedData.chronicles[0].palette)}">
      <span>${escapeHtml(current?.chapter || "Sessio")}</span>
      <strong>${escapeHtml(formatShortDate(current?.date) || current?.date || "Crònica")}</strong>
    </div>
  `;
}

function renderChronicleLanding(state, permissions = {}) {
  const canCreateChronicle = permissions.canCreateChronicle !== false;
  const featuredChronicle = state.chronicles[0] || null;
  const latestChronicle = state.chronicles.at(-1) || featuredChronicle;
  const featuredImage = featuredChronicle?.imageAssets?.[0] || latestChronicle?.imageAssets?.[0] || "";
  const totalChapters = state.chronicles.length;

  return `
    <div class="chronicle-landing">
      <section class="chronicle-landing-hero">
        <div class="chronicle-landing-hero-media" style="${paletteStyle(featuredChronicle?.palette || seedData.chronicles[0].palette)}">
          ${featuredImage
            ? `<img src="${escapeAttribute(featuredImage)}" alt="${escapeAttribute(featuredChronicle?.title || "Portada de croniques")}" loading="lazy" />`
            : `
              <div class="chronicle-landing-sigil" aria-hidden="true">
                <span>III</span>
                <strong>Cròniques</strong>
              </div>
            `}
        </div>
        <div class="chronicle-landing-hero-copy">
          <p class="eyebrow">Arxiu de campanya</p>
          <h3>Cròniques de Meledar</h3>
          <p>Una taula de sessions, rastres i decisions. Obre qualsevol entrada per tornar al llibre de lectura.</p>
          <div class="chronicle-landing-stats" aria-label="Estat de les croniques">
            <span><strong>${escapeHtml(String(totalChapters))}</strong> sessions</span>
            <span><strong>${escapeHtml(latestChronicle?.chapter || "Sense")}</strong> darrera entrada</span>
            <span><strong>${escapeHtml(formatShortDate(latestChronicle?.date) || latestChronicle?.date || "Sense data")}</strong> calendari</span>
          </div>
        </div>
      </section>

      <section class="chronicle-atlas">
        <div class="chronicle-atlas-head">
          <div>
            <p class="eyebrow">Index complet</p>
            <h3>Totes les entrades</h3>
          </div>
          ${canCreateChronicle ? `<button type="button" class="chapter-create-button" data-create-chronicle>
            <span class="module-action-icon">${renderModuleActionIcon("create")}</span>
            <span>Nova cronica</span>
          </button>` : ""}
        </div>
        <div class="chronicle-atlas-grid" role="list" aria-label="Totes les croniques">
          ${state.chronicles.map((chronicle, index) => renderChronicleLandingCard(chronicle, index)).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderChronicleLandingCard(chronicle, index) {
  const image = chronicle.imageAssets?.[0] || "";
  const dateLabel = formatShortDate(chronicle.date) || chronicle.date || "Sense data";
  const summaryText = plainChronicleText(chronicle.content || "");

  return `
    <article
      class="chronicle-atlas-card"
      data-chronicle-id="${escapeAttribute(chronicle.id)}"
      role="listitem"
      tabindex="0"
      aria-label="${escapeAttribute(`Obre ${chronicle.chapter}: ${chronicle.title}`)}"
      style="${paletteStyle(chronicle.palette || seedData.chronicles[index % seedData.chronicles.length]?.palette || seedData.chronicles[0].palette)}"
    >
      <div class="chronicle-atlas-card-media">
        ${image
          ? `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(chronicle.title)}" loading="lazy" />`
          : `<span>${escapeHtml(String(index + 1).padStart(2, "0"))}</span>`}
      </div>
      <div class="chronicle-atlas-card-copy">
        <p class="eyebrow">${escapeHtml(chronicle.chapter)}</p>
        <h4>${escapeHtml(chronicle.title)}</h4>
        <p>${escapeHtml(shortChronicleText(summaryText, 170))}</p>
      </div>
      <div class="chronicle-atlas-card-foot">
        <span>${escapeHtml(dateLabel)}</span>
        <span>Obre</span>
      </div>
    </article>
  `;
}

function renderChronicleIndexPanel(state, current, { variant, canEditChronicle = () => true, canCreateChronicle = true }) {
  const chronicleSearch = state.ui.chronicleIndexSearch?.trim().toLowerCase() || "";
  const visibleChronicles = state.chronicles.filter((chronicle) => chronicleMatchesSearch(chronicle, chronicleSearch));
  const totalChronicles = state.chronicles.length;
  const searchMeta = chronicleSearch
    ? `${visibleChronicles.length} de ${totalChronicles} capitols`
    : `${totalChronicles} capitols`;
  const selectedOutsideFilter = chronicleSearch && current && !chronicleMatchesSearch(current, chronicleSearch);
  const panelClass = variant === "sidebar"
    ? "book-index book-index-sidebar"
    : "book-index book-index-inline";

  return `
    <aside class="${panelClass}">
      <div class="module-section-header compact book-index-header">
        <div class="module-section-copy">
          <p class="eyebrow">Index</p>
          <h3>Capitols de campanya</h3>
          <p class="chapter-index-meta">${escapeHtml(searchMeta)}</p>
        </div>
      </div>
      <div class="chapter-index-toolbar">
        <input
          type="search"
          name="chronicleIndexSearch"
          value="${escapeAttribute(state.ui.chronicleIndexSearch || "")}"
          placeholder="Filtra sessions"
          aria-label="Filtra les sessions de campanya"
        />
        ${chronicleSearch
          ? `
            <button type="button" class="secondary chapter-search-clear" data-clear-chronicle-search>
              Neteja
            </button>
          `
          : ""}
      </div>
      ${selectedOutsideFilter
        ? `<p class="chapter-index-hint">La cronica oberta queda fora del filtre actual.</p>`
        : ""}
      <div class="chapter-list-shell">
        <div class="chapter-list" role="listbox" aria-label="Capitols de campanya">
          ${visibleChronicles.length
            ? visibleChronicles.map((chronicle) => renderChronicleIndexEntry(chronicle, state, canEditChronicle)).join("")
            : `
              <div class="chapter-list-empty">
                <p class="eyebrow">Sense coincidencies</p>
                <p>Ajusta el filtre o crea una nova cronica per continuar.</p>
              </div>
            `}
        </div>
      </div>
      ${canCreateChronicle ? `<div class="chapter-index-actions">
        <button type="button" class="chapter-create-button" data-create-chronicle>
          <span class="module-action-icon">${renderModuleActionIcon("create")}</span>
          <span>Nova cronica</span>
        </button>
      </div>` : ""}
    </aside>
  `;
}

function renderChronicleEditingStage(current, state, permissions = {}) {
  return `
    <div class="chronicle-edit-stage ${state.ui.notesPanelOpen ? "notes-open" : ""}">
      <div class="chronicle-edit-main">
        ${renderChronicleEditor(current, state, permissions)}
      </div>
    </div>
  `;
}

function renderChronicleEditor(chronicle, state, permissions = {}) {
  const draft = state.ui.drafts.chronicles[chronicle?.id || ""] || {};
  const hasPendingDraft = Object.keys(draft).length > 0;
  const editorStatus = renderEditorStatus(state, "chronicles", chronicle?.id || "", hasPendingDraft);

  return `
    <section class="module-surface editor-workspace editor-workspace-chronicle">
      ${renderEditorWorkspaceHeader(
        "Edicio de cronica",
        chronicle?.title || "Nova cronica",
        "Aquest espai es centra en el relat de la sessio. Els recursos vinculats es mouran al glossari en una fase posterior.",
        [
          chronicle?.chapter || "Sense capitol",
          chronicle?.date ? formatShortDate(chronicle.date) : "Sense data",
        ],
      )}
      ${editorStatus}
      <form data-form="chronicle" class="editor-form">
        <input type="hidden" name="id" value="${escapeAttribute(chronicle?.id || "")}" />
        <div class="editor-layout editor-layout-chronicle">
          ${renderEditorCard(
            "Portada i relat",
            "El text llarg viu separat del context operatiu per poder escriure amb mes claredat.",
            `
              <div class="editor-grid">
                ${renderInputField("chapter", "Capitol", readDraftValue(draft.chapter, chronicle?.chapter || ""))}
                ${renderInputField("title", "Titol", readDraftValue(draft.title, chronicle?.title || ""))}
                ${renderInputField("date", "Data", readDraftValue(draft.date, chronicle?.date || ""))}
                ${renderRichTextareaField("summary", "Resum principal", readDraftValue(draft.summary, chronicle?.summary || ""), 5)}
                ${renderRichTextareaField("content", "Cos del capitol", readDraftValue(draft.content, chronicle?.content || ""), 10)}
                ${renderRichTextareaField("highlights", "Fites clau", readDraftValue(draft.highlights, chronicle?.highlights || ""), 6)}
                <label class="field span-2">
                  <span>Editors jugadors</span>
                  <textarea name="editableByUserEmails" rows="3" placeholder="correu@exemple.com">${escapeHtml(readDraftValue(draft.editableByUserEmails, (chronicle?.editableByUserEmails || []).join("\n")))}</textarea>
                  <small class="field-help">Correus separats per comes o salts de linia. Els GM i superadmin no necessiten estar aqui.</small>
                </label>
              </div>
            `,
          )}
        </div>
        ${renderEditorActions(
          "Desa cronica",
          `
            <button type="button" class="secondary" data-discard-chronicle-edit>Descarta canvis</button>
            ${permissions.canDeleteChronicle !== false ? '<button type="button" class="secondary" data-delete-chronicle>Esborra cronica</button>' : ""}
          `,
        )}
      </form>
    </section>
  `;
}

function getChronicleStatusPills(chronicle, state) {
  const statusPills = [];
  const hasPendingDraft = Object.keys(state.ui.drafts.chronicles[chronicle.id] || {}).length > 0;

  if (hasPendingDraft) {
    statusPills.push({ label: "Esborrany", tone: "draft" });
  }

  if (state.ui.editModes.chronicles && state.ui.selectedChronicleId === chronicle.id) {
    statusPills.push({ label: "En edicio", tone: "editing" });
  }

  return statusPills;
}

function readDraftValue(draftValue, fallback) {
  return draftValue !== undefined ? draftValue : fallback;
}

function renderEditorStatus(state, module, itemId, hasPendingDraft) {
  if (hasPendingDraft) {
    return `<p class="editor-save-state pending">Canvis no desats guardats localment fins que els confirmis.</p>`;
  }

  if (state.ui.lastSaved?.module === module && state.ui.lastSaved?.itemId === itemId && state.ui.lastSaved?.at) {
    return `<p class="editor-save-state">Darrer desat: ${escapeHtml(formatRelativeTime(state.ui.lastSaved.at))}</p>`;
  }

  return "";
}

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "fa un moment";
  }

  const diff = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diff < 10) {
    return "fa uns segons";
  }
  if (diff < 60) {
    return `fa ${diff}s`;
  }

  const minutes = Math.round(diff / 60);
  if (minutes < 60) {
    return `fa ${minutes} min`;
  }

  return date.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" });
}

function chronicleMatchesSearch(chronicle, search) {
  if (!search) {
    return true;
  }

  return [chronicle.chapter, chronicle.title, chronicle.date, chronicle.summary, chronicle.highlights]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(search));
}

function plainChronicleText(value) {
  return String(value || "")
    .replaceAll(/\[\[[^\]|]+\|([^\]]+)\]\]/g, "$1")
    .replaceAll(/\[\[([^\]]+)\]\]/g, "$1")
    .replaceAll(/\{\{media:[^}]+\}\}/g, "")
    .replaceAll(/[#*_`>~-]/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function shortChronicleText(value, maxLength) {
  const text = plainChronicleText(value);
  if (text.length <= maxLength) {
    return text || "Entrada pendent de relat.";
  }

  return `${text.slice(0, maxLength - 1).trim()}...`;
}
