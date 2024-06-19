export default (...arrays) => {
  // Calculate the total length of the new Float32Array
  const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);

  // Create a new Float32Array with the total length
  const result = new Float32Array(totalLength);

  // Copy elements from each input array into the new array
  let offset = 0;
  arrays.forEach((array) => {
    result.set(array, offset);
    offset += array.length;
  });

  return result;
};
