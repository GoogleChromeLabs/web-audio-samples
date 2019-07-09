
const btn = document.getElementById('toggle-iframe');
const iframe = document.getElementById('demo-iframe');

export const initIframeHandler = () => {
  btn.addEventListener('click', () => {
    if (!iframe.classList.contains('show')) {
      iframe.classList.add('show');
      iframe.classList.remove('hide')
    } else {
      iframe.classList.add('hide')
      iframe.classList.remove('show');
    }
  })
}
