import { html } from './Base.js';

const Emojis = ['🎹', '🎙️', '🎧', '🎚️', '🎛️'];

function getColumn(entry) {
  return html`
    <div class="column">
      ${entry
          ? html`
              <div class="was-list-entry">
                <a href="${entry.url}">
                  <h3 class="was-list-entry-title">${entry.title}</h3>
                </a>
                <p class="was-list-endtry-description">${entry.description}</p>
              </div>
            `
          : html``
      }
    </div>
  `;
}

export default (context) => {
  const emoji = Emojis[Math.ceil(Math.random() * (Emojis.length - 1))];

  const rows = [];
  const numberOfColumns = 2;
  for (let i = 0; i < context.listData.length; i += numberOfColumns) {
    const row = {};
    row.left = context.listData[i];
    if (i+1 < context.listData.length) {
      row.right = context.listData[i+1];
    }
    rows.push(row);
  }

  return html`
    ${context.listTitle
      ? html`
          <div class="row was-list-view">
            <div class="column was-list-title">
              <h2>${emoji} ${context.listTitle}</h2>
            </div>
          </div>`
      : html``
    }

    ${rows.map((columns, index, data) => html`
      <div class="row was-list-view">
        ${getColumn(columns.left)}
        ${getColumn(columns.right)}
      </div>
    `)}
  `;
};