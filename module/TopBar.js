import { html } from './Base.js';

export default (context) => {
  let content = html`
    <li>
      <a href="/">HOME</a>
    </li>
  `;

  return html`
    <div class="row was-top-bar">
      <div class="column">
        <ul>
          <li>
            <a href="/">HOME</a>
          </li>
      ${context.pathData.map((path) => html`
          <li class="was-top-bar-divider">|</li>
          <li>
            ${path.url
                ? html`<a href="${path.url}">${path.title}</a>`
                : html`${path.title}`
            }
          </li>
      `)}
        </ul>
      </div>
    </div>
  `;
};