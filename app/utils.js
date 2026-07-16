import { isAssetToken } from "./assets.js";
import { sanitizeMediaSource } from "./media-source.js";

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

export function readString(formData, key) {
  return formData.get(key)?.toString().trim() || "";
}

export function readOptionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function shortText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

export function plainTextFromRichText(value) {
  return String(value || "")
    .replaceAll(/\{\{media:(image|audio|video|file)\|([^|{}]+)\|([^{}]+)\}\}/g, "$2")
    .replaceAll(/\[\[([a-zA-Z0-9-_]+)\|([^\]]+)\]\]/g, "$2")
    .replaceAll(/^#{1,3}\s+/gm, "")
    .replaceAll(/^>\s+/gm, "")
    .replaceAll(/^[-*]\s+/gm, "")
    .replaceAll(/^\d+\.\s+/gm, "")
    .replaceAll(/\*\*([^*\n]+)\*\*/g, "$1")
    .replaceAll(/\*([^*\n]+)\*/g, "$1")
    .replaceAll(/`([^`\n]+)`/g, "$1")
    .replaceAll(/^---+$/gm, "")
    .replaceAll(/\s+/g, " ")
    .trim();
}

export function formatShortDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ca-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function splitLines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function splitTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function paletteStyle(palette) {
  return `--portrait-a: ${palette[0]}; --portrait-b: ${palette[1]};`;
}

export function getGlossaryCategoryTheme(category) {
  return {
    Totes: "all",
    "Llocs": "locations",
    "Religió": "faith",
    "Faccions": "factions",
    "Altres": "npcs",
    "Antagonistes": "antagonists",
    "Entitats": "entities",
    "Esdeveniments": "events",
    "Objectes": "objects",
    "Monstres": "monsters",
    "Races": "races",
    "Personatge": "heroes",
  }[category] || "neutral";
}

export function characterTabLabel(tab) {
  return {
    sheet: "Fitxa",
    inventory: "Inventari",
    history: "Història personal",
  }[tab];
}

export function renderTextCard(title, text, options = { rich: false }) {
  const content = options.rich
    ? `<div class="rich-text">${renderRichText(text)}</div>`
    : `<p>${escapeHtml(text)}</p>`;
  return `
    <article class="section-card">
      <p class="eyebrow">${escapeHtml(title)}</p>
      ${content}
    </article>
  `;
}

export function renderInputField(name, label, value) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input name="${escapeAttribute(name)}" value="${escapeAttribute(value)}" />
    </label>
  `;
}

export function renderTextareaField(name, label, value, rows = 3) {
  return `
    <label class="field ${rows > 3 ? "span-2" : ""}">
      <span>${escapeHtml(label)}</span>
      <textarea name="${escapeAttribute(name)}" rows="${rows}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

export function renderReferenceTextareaField(name, label, value, rows = 3) {
  const inputId = `${name}-field`;
  return `
    <label class="field span-2">
      <span>${escapeHtml(label)}</span>
      <textarea
        id="${inputId}"
        name="${name}"
        rows="${rows}"
        data-ref-input="glossary"
        data-suggestion-target="${inputId}-suggestions"
      >${escapeHtml(value)}</textarea>
      <div id="${inputId}-suggestions" class="reference-suggestions"></div>
      <small class="field-help">Escriu un terme del glossari o un personatge principal i selecciona la suggerència per inserir una referència clicable. Si selecciones text, també pots afegir multimedia.</small>
    </label>
  `;
}

export function renderRichTextareaField(name, label, value, rows = 4, options = {}) {
  const inputId = `${name}-field`;
  const previewId = `${inputId}-preview`;
  const enableReferences = options.enableReferences !== false;
  const help = options.help
    || "Admet subtítols (##), negreta (**text**), cursiva (*text*), llistes (-), cites (>), separadors (---) i codi (`text`).";

  return `
    <label class="field ${rows > 3 ? "span-2" : ""}">
      <span>${escapeHtml(label)}</span>
      <div class="rich-editor">
        <div class="rich-toolbar" role="toolbar" aria-label="Format de ${escapeAttribute(label)}">
          ${renderRichToolbarButton(inputId, "heading", "H", "Subtítol")}
          ${renderRichToolbarButton(inputId, "bold", "B", "Negreta")}
          ${renderRichToolbarButton(inputId, "italic", "I", "Cursiva")}
          ${renderRichToolbarButton(inputId, "list", "•", "Llista")}
          ${renderRichToolbarButton(inputId, "quote", "❝", "Cita")}
          ${renderRichToolbarButton(inputId, "divider", "—", "Separador")}
        </div>
        <textarea
          id="${inputId}"
          name="${escapeAttribute(name)}"
          rows="${rows}"
          data-rich-input="true"
          data-rich-preview-target="${previewId}"
          ${enableReferences ? `data-ref-input="glossary" data-suggestion-target="${inputId}-suggestions"` : ""}
        >${escapeHtml(value)}</textarea>
        ${enableReferences ? `<div id="${inputId}-suggestions" class="reference-suggestions"></div>` : ""}
        <small class="field-help">${escapeHtml(help)}${enableReferences ? " Escriu un terme del glossari o un personatge principal per veure suggerències de referència. Si selecciones text, també pots afegir multimedia." : ""}</small>
          <div class="rich-preview-frame">
            <div class="rich-preview-label">Previsualitzacio</div>
            <div id="${previewId}" class="rich-preview rich-text">${renderRichText(value)}</div>
          </div>
        </div>
      </label>
  `;
}

export function renderEditorWorkspaceHeader(eyebrow, title, description, badges = []) {
  return `
    <div class="editor-header">
      <div class="editor-title-block">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p class="editor-summary">${escapeHtml(description)}</p>
      </div>
      <div class="editor-meta">
        ${badges.map((badge) => `<span class="badge editor-badge">${escapeHtml(badge)}</span>`).join("")}
      </div>
    </div>
  `;
}

export function renderModuleActionIcon(type) {
  const icons = {
    characters: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3.5a4.25 4.25 0 1 1 0 8.5a4.25 4.25 0 0 1 0-8.5Zm0 10.75c4.14 0 7.5 2.63 7.5 5.88c0 .2-.16.37-.37.37H4.87a.37.37 0 0 1-.37-.37c0-3.25 3.36-5.88 7.5-5.88Z" fill="currentColor"/>
      </svg>`,
    chronicles: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6.75 4.25h8.6a2.4 2.4 0 0 1 2.4 2.4v12.1H8.65a1.9 1.9 0 0 0-1.9 1.9V6.15a1.9 1.9 0 0 1 1.9-1.9Zm2 3.1h6.9v1.5h-6.9Zm0 3.25h6.9v1.5h-6.9Zm0 3.25h4.8v1.5h-4.8ZM5.25 5.4v14.1a2.25 2.25 0 0 0 2.25 2.25h10.25v-1.5H7.5a.75.75 0 0 1-.75-.75V5.4Z" fill="currentColor"/>
      </svg>`,
    glossary: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6 4.25h10.15a2.6 2.6 0 0 1 2.6 2.6V19a.75.75 0 0 1-1.18.61l-1.92-1.33l-1.92 1.33a.75.75 0 0 1-.86 0l-1.92-1.33l-1.92 1.33A.75.75 0 0 1 8.25 19V6.85A2.6 2.6 0 0 0 6 4.25Zm0 1.5A1.1 1.1 0 0 1 7.1 6.85v10.72l1.17-.82a.75.75 0 0 1 .86 0l1.92 1.33l1.92-1.33a.75.75 0 0 1 .86 0l1.92 1.33V6.85a1.1 1.1 0 0 0-1.1-1.1Zm3.35 2.6h5.9v1.5h-5.9Zm0 3.15h5.9V13h-5.9Z" fill="currentColor"/>
      </svg>`,
      create: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M11.25 5.25h1.5v5.25H18v1.5h-5.25v5.25h-1.5V12H6v-1.5h5.25Z" fill="currentColor"/>
        </svg>`,
      download: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M11.25 4.5h1.5v8.38l3.05-3.05l1.06 1.06L12 15.75l-4.86-4.86L8.2 9.83l3.05 3.05Zm-5.5 12.75h12.5v1.5H5.75Z" fill="currentColor"/>
        </svg>`,
      upload: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 4.25l4.86 4.86l-1.06 1.06l-3.05-3.05v8.38h-1.5V7.12L8.2 10.17L7.14 9.11Zm-6.25 13h12.5v1.5H5.75Z" fill="currentColor"/>
        </svg>`,
    };

  return icons[type] || icons.create;
}

export function renderStatusPills(items) {
  if (!items.length) {
    return "";
  }

  return `
    <div class="entry-state-pills">
      ${items
        .map(
          (item) => `
            <span class="status-pill ${item.tone ? `status-pill-${escapeAttribute(item.tone)}` : ""}">
              ${escapeHtml(item.label)}
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

export function renderEditorCard(title, description, content) {
  return `
    <section class="editor-panel">
      <div class="editor-panel-header">
        <h3>${escapeHtml(title)}</h3>
        <p class="editor-panel-copy">${escapeHtml(description)}</p>
      </div>
      ${content}
    </section>
  `;
}

export function renderEditorActions(primaryLabel, secondaryButtons = "", options = {}) {
  const disabled = options.disabled === true;
  return `
    <div class="editor-actions">
      <button type="submit" ${disabled ? 'disabled aria-disabled="true"' : ""}>${escapeHtml(primaryLabel)}</button>
      ${secondaryButtons}
    </div>
  `;
}

export function renderChoiceGrid(name, items, selectedValues, getValue, getTitle, getMeta = null) {
  return `
    <div class="choice-grid">
      ${items
        .map((item) => {
          const value = getValue(item);
          const title = getTitle(item);
          const meta = getMeta ? getMeta(item) : "";
          return `
            <label class="choice-chip">
              <input
                type="checkbox"
                name="${escapeAttribute(name)}"
                value="${escapeAttribute(value)}"
                ${selectedValues.has(value) ? "checked" : ""}
              />
              <span class="choice-chip-title">${escapeHtml(title)}</span>
              ${meta ? `<span class="choice-chip-meta">${escapeHtml(meta)}</span>` : ""}
            </label>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderChronicleRichText(text) {
  return renderRichText(text);
}

export function renderRichText(text) {
  const normalized = String(text || "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    return "<p>Sense contingut.</p>";
  }

  const lines = normalized.split("\n");
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push('<hr class="rich-divider" />');
      continue;
    }

    const mediaBlock = parseRichMediaToken(trimmed);
    if (mediaBlock) {
      blocks.push(renderRichMediaBlock(mediaBlock));
      continue;
    }

    if (/^###\s+/.test(trimmed)) {
      blocks.push(`<h5>${renderRichInline(trimmed.replace(/^###\s+/, ""))}</h5>`);
      continue;
    }

    if (/^##\s+/.test(trimmed)) {
      blocks.push(`<h4>${renderRichInline(trimmed.replace(/^##\s+/, ""))}</h4>`);
      continue;
    }

    if (/^#\s+/.test(trimmed)) {
      blocks.push(`<h3>${renderRichInline(trimmed.replace(/^#\s+/, ""))}</h3>`);
      continue;
    }

    if (/^>\s+/.test(trimmed)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s+/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s+/, ""));
        index += 1;
      }
      index -= 1;
      blocks.push(`<blockquote><p>${quoteLines.map((item) => renderRichInline(item)).join("<br />")}</p></blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      index -= 1;
      blocks.push(`<ul>${items.map((item) => `<li>${renderRichInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      index -= 1;
      blocks.push(`<ol>${items.map((item) => `<li>${renderRichInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    const paragraphLines = [trimmed];
    while (index + 1 < lines.length) {
      const nextLine = lines[index + 1].trim();
      if (
        !nextLine
        || /^---+$/.test(nextLine)
        || /^(#{1,3}|> |[-*] |\d+\.\s+)/.test(nextLine)
      ) {
        break;
      }
      paragraphLines.push(nextLine);
      index += 1;
    }

    blocks.push(`<p>${paragraphLines.map((item) => renderRichInline(item)).join("<br />")}</p>`);
  }

  return blocks.join("") || "<p>Sense contingut.</p>";
}

export function replaceGlossaryReferences(value) {
  return escapeHtml(value).replaceAll(
    /\[\[([a-zA-Z0-9-_]+)\|([^\]]+)\]\]/g,
    (_full, id, label) =>
      `<button type="button" class="glossary-inline-link" data-reference-jump="${id}">${escapeHtml(label)}</button>`,
  );
}

function renderRichInline(value) {
  const placeholders = [];
  const stash = (markup) => {
    const token = `@@RICH${placeholders.length}@@`;
    placeholders.push(markup);
    return token;
  };

  let html = escapeHtml(value);
  html = html.replace(
    /\{\{media:(image|audio|video|file)\|([^|{}]+)\|([^{}]+)\}\}/g,
    (_full, mediaKind, label, source) =>
      stash(`<a class="rich-media-inline-link" ${renderAssetAttribute("href", source)} target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`),
  );
  html = html.replace(
    /\[\[([a-zA-Z0-9-_]+)\|([^\]]+)\]\]/g,
    (_full, id, label) =>
      stash(`<button type="button" class="glossary-inline-link" data-reference-jump="${id}">${escapeHtml(label)}</button>`),
  );
  html = html.replace(/`([^`\n]+)`/g, (_full, content) => stash(`<code>${content}</code>`));
  html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  return html.replace(/@@RICH(\d+)@@/g, (_full, index) => placeholders[Number(index)] || "");
}

function renderRichToolbarButton(inputId, action, label, title) {
  return `
    <button
      type="button"
      class="secondary rich-tool-button"
      data-rich-action="${action}"
      data-input-id="${escapeAttribute(inputId)}"
      aria-label="${escapeAttribute(title)}"
      title="${escapeAttribute(title)}"
    >
      ${escapeHtml(label)}
    </button>
  `;
}

function parseRichMediaToken(value) {
  const match = String(value || "").match(/^\{\{media:(image|audio|video|file)\|([^|{}]+)\|([^{}]+)\}\}$/);
  if (!match) {
    return null;
  }

  return {
    kind: match[1],
    label: match[2],
    source: match[3],
  };
}

function renderRichMediaBlock(media) {
  if (media.kind === "image") {
    return `
      <figure class="rich-media-block rich-media-image">
        <img ${renderAssetAttribute("src", media.source)} alt="${escapeAttribute(media.label)}" loading="lazy" />
        <figcaption>${escapeHtml(media.label)}</figcaption>
      </figure>
    `;
  }

  if (media.kind === "audio") {
    return `
      <figure class="rich-media-block rich-media-audio">
        <audio controls preload="none" ${renderAssetAttribute("src", media.source)}></audio>
        <figcaption>${escapeHtml(media.label)}</figcaption>
      </figure>
    `;
  }

  if (media.kind === "video") {
    return `
      <figure class="rich-media-block rich-media-video">
        <video controls preload="metadata" ${renderAssetAttribute("src", media.source)}></video>
        <figcaption>${escapeHtml(media.label)}</figcaption>
      </figure>
    `;
  }

  return `
    <p class="rich-media-block rich-media-file">
      <a ${renderAssetAttribute("href", media.source)} target="_blank" rel="noreferrer">${escapeHtml(media.label)}</a>
    </p>
  `;
}

export function renderChronicleMedia(chronicle) {
  const images = (chronicle?.imageAssets || []).filter(Boolean);
  const notes = (chronicle?.voiceNotes || []).filter(Boolean);
  if (!images.length && !notes.length) {
    return renderTextCard("Recursos", "Sense imatges ni notes de veu vinculades encara.");
  }

  return `
    <article class="section-card chronicle-media-card">
      <p class="eyebrow">Recursos vinculats</p>
      ${images.length
        ? `<div class="chronicle-image-grid">
            ${images
              .map(
                (source, index) => `
                  <figure>
                    <img src="${escapeAttribute(source)}" alt="Imatge de crònica ${index + 1}" loading="lazy" />
                    <figcaption>${escapeHtml(source)}</figcaption>
                  </figure>
                `,
              )
              .join("")}
          </div>`
        : ""}
      ${notes.length
        ? `<ul class="voice-note-list">
            ${notes
              .map(
                (source) => `
                  <li>
                    <audio controls preload="none" src="${escapeAttribute(source)}"></audio>
                    <span>${escapeHtml(source)}</span>
                  </li>
                `,
              )
              .join("")}
          </ul>`
        : ""}
    </article>
  `;
}

export function sanitizePlayerNotes(notes) {
  return Array.isArray(notes)
    ? notes
        .map((note, index) => ({
          id: typeof note?.id === "string" && note.id ? note.id : `pn-import-${index}`,
          author: readOptionalString(note?.author) || "Sense nom",
          createdAt: readOptionalString(note?.createdAt),
          text: readOptionalString(note?.text),
        }))
        .filter((note) => note.text)
    : [];
}

function renderAssetAttribute(attribute, source) {
  if (isAssetToken(source)) {
    return `data-asset-${attribute}="${escapeAttribute(source)}"`;
  }

  const kind = attribute === "href" ? "file" : inferRenderedMediaKind(source);
  const safeSource = sanitizeMediaSource(source, kind);
  return safeSource
    ? `${attribute}="${escapeAttribute(safeSource)}"`
    : 'data-invalid-media-source="true"';
}

function inferRenderedMediaKind(source) {
  const value = String(source || "").toLowerCase();
  if (/\.(?:mp3|m4a|ogg|wav)(?:[?#]|$)/.test(value) || value.startsWith("data:audio/")) return "audio";
  if (/\.(?:mp4|mov|ogv|webm)(?:[?#]|$)/.test(value) || value.startsWith("data:video/")) return "video";
  return "image";
}

function renderAssetLabel(source, fallback) {
  return isAssetToken(source) ? fallback : source;
}
