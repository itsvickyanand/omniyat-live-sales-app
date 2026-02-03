const slugify = (text) => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces to hyphen
    .replace(/-+/g, "-"); // remove duplicate hyphens
};

module.exports = slugify;
