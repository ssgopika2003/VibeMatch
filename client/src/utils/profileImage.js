const getServerOrigin = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  return `${window.location.protocol}//${window.location.hostname}:5000`;
};

export const resolveProfileImageUrl = (photo) => {
  if (!photo) return '';
  if (/^(blob:|data:|https?:\/\/)/i.test(photo)) return photo;
  if (photo.startsWith('/')) return `${getServerOrigin()}${photo}`;
  return `${getServerOrigin()}/${photo}`;
};
