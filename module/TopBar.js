export default (targetDivId, context) => {
  let content = `
    <li>
      <a href="/">HOME</a>
    </li>
  `;

  context.pathData.forEach((path) => {
    const linkElement = path.url
        ? `<a href="${path.url}">${path.title}</a>`
        : path.title;
    content += `
        <li class="was-top-bar-divider">|</li>
        <li>${linkElement}</li>
      `;
  }),

  document.getElementById(targetDivId).innerHTML = `
      <div class="column">
        <ul>
          ${content}
        </ul>
      </div>
    `;
};