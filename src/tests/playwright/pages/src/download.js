export default (blob) => {
  const download = document.createElement('a');
  download.href = URL.createObjectURL(blob);
  download.download = 'out.wav';
  download.click();
};
