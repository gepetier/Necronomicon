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

export function characterTabLabel(tab) {
  return {
    lore: "Lore",
    sheet: "Fitxa",
    inventory: "Inventari",
    history: "Història personal",
  }[tab];
}

export function renderTextCard(title, text, options = { rich: false }) {
  const content = options.rich ? renderChronicleRichText(text) : escapeHtml(text);
  return `
    <article class="section-card">
      <p class="eyebrow">${escapeHtml(title)}</p>
      <p>${content}</p>
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
      <small class="field-help">Escriu un nom del glossari i selecciona la suggerència per inserir una referència clicable.</small>
    </label>
  `;
}

export function renderEditorWorkspaceHeader(eyebrow, title, description, badges = []) {
  return `
    <div class="editor-workspace-header">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p class="editor-summary">${escapeHtml(description)}</p>
      </div>
      <div class="editor-badge-row">
        ${badges.map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("")}
      </div>
    </div>
  `;
}

export function renderEditorCard(title, description, content) {
  return `
    <section class="editor-card">
      <div class="editor-card-header">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(description)}</p>
      </div>
      ${content}
    </section>
  `;
}

export function renderEditorActions(primaryLabel, secondaryButtons = "") {
  return `
    <div class="editor-actions">
      <button type="submit">${escapeHtml(primaryLabel)}</button>
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
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${replaceGlossaryReferences(line)}</p>`)
    .join("") || "<p>Sense contingut.</p>";
}

export function replaceGlossaryReferences(value) {
  return escapeHtml(value).replaceAll(
    /\[\[([a-zA-Z0-9-_]+)\|([^\]]+)\]\]/g,
    (_full, id, label) =>
      `<button type="button" class="glossary-inline-link" data-glossary-jump="${id}">${escapeHtml(label)}</button>`,
  );
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
