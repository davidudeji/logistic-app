const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImageUpload(file) {
  if (!file) {
    return 'Image file is required for proof of delivery.';
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return `Invalid mime type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `Image file exceeds maximum allowable size of 10 MB.`;
  }

  return null;
}
