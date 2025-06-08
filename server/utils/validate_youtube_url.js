const isValidYouTubeUrl = (url) => {
  const pattern =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
  return pattern.test(url);
};

module.exports = isValidYouTubeUrl;
