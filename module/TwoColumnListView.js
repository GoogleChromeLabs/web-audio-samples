const Emojis = ['🎹', '🎙️', '🎧', '🎚️', '🎛️'];

export default (targetDivId, context) => {
  let content = '';

  if (context.listTitle) {
    const emoji = Emojis[Math.ceil(Math.random() * (Emojis.length - 1))];
    content += `
      <div class="column column-100 was-list-title">
        <h2>${emoji} ${context.listTitle}</h2>
      </div>
    `;
  }

  context.listData.forEach((project) => {
    content += `
      <div class="column column-50">
        <div class="was-project-entry">
          <a href="${project.url}">
            <h3 class="was-project-title">${project.title}</h3>
          </a>
          <p class="was-project-description">${project.description}</p>
        </div>
      </div>
    `;
  });

  document.getElementById(targetDivId).innerHTML = content;
};