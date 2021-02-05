export const deCaseDeSpace = (string) => {
  const spaces = /\s/g;
  return string.toLowerCase().replace(spaces, '');
};

/**
 * Return an id property of the passed in item, commonly used in array.map function
 */
export const toId = (item) => item.id;
