import { html } from './Base.js';

function generatePathList(pathData) {
  return html`
    ${pathData.map((path) => html`
      <li class="was-top-bar-divider">|</li>
      <li>
        ${path.url
            ? html`<a href="${path.url}">${path.title}</a>`
            : html`${path.title}`
        }
      </li>
    `)}
  `;
}

export default (context) => {
    return html`
    <div class="row was-top-bar">
      <div class="column">
        <ul>
          <li>
            <a href="/">HOME</a>
          </li>
          ${ context && context.pathData
              ? generatePathList(context.pathData)
              : html``
          }
        </ul>
      </div>
    </div>
  `;
};