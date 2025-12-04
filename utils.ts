export const isImageFile = (file: File): boolean => {
  // If browser detects image mime type, trust it
  if (file.type.startsWith('image/')) return true;
  
  // Fallback: check extension if mime type is missing/empty (common with folder uploads)
  const name = file.name.toLowerCase();
  return /\.(jpg|jpeg|png|webp|heic|bmp|gif)$/.test(name);
};

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      
      // Determine mimeType (fallback if file.type is empty)
      let mimeType = file.type;
      if (!mimeType || mimeType === "") {
        if (file.name.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else if (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (file.name.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';
        else if (file.name.toLowerCase().endsWith('.heic')) mimeType = 'image/heic';
        else mimeType = 'image/png'; // Default fallback
      }

      resolve({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export const formatTimestamp = (ts: number): string => {
  if (ts === 0) return 'N/A';
  return new Date(ts).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};