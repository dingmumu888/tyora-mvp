export type PublicImagePreparationErrors = {
  read?: string;
  unsupported?: string;
  prepare?: string;
  tooLarge?: string;
};

export type PublicImagePreparationOptions = {
  maxDimension?: number;
  quality?: number;
  maxDataUrlLength?: number;
  minimumDimension?: number;
  background?: string;
  errors?: PublicImagePreparationErrors;
};

export type PreparedPublicImage = {
  dataUrl: string;
  file: File;
};

function readFileAsDataUrl(file: Blob, message: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(message));
    reader.readAsDataURL(file);
  });
}

function loadBrowserImage(src: string, message: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(message));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number, message: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(message));
    }, "image/jpeg", quality);
  });
}

function jpegName(name: string) {
  const base = name.replace(/\.[^.]+$/, "").trim() || "image";
  return `${base}.jpg`;
}

export async function preparePublicImage(
  file: File,
  options: PublicImagePreparationOptions = {}
): Promise<PreparedPublicImage> {
  const {
    maxDimension: initialMaxDimension = 1600,
    quality: initialQuality = 0.86,
    maxDataUrlLength,
    minimumDimension = 600,
    background = "#f8fafc",
    errors = {}
  } = options;
  const readError = errors.read || "Unable to read this image.";
  const unsupportedError = errors.unsupported || "This image format is not supported by your browser.";
  const prepareError = errors.prepare || "Unable to prepare this image.";
  const tooLargeError = errors.tooLarge || `Image ${file.name || "file"} is too large to prepare. Please choose a smaller image.`;
  const source = await readFileAsDataUrl(file, readError);
  const image = await loadBrowserImage(source, unsupportedError);
  let maxDimension = initialMaxDimension;
  let quality = initialQuality;
  let prepared: PreparedPublicImage | null = null;

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const scale = Math.min(1, maxDimension / image.naturalWidth, maxDimension / image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error(prepareError);

    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas, quality, prepareError);
    const normalizedFile = new File([blob], jpegName(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified
    });
    const dataUrl = await readFileAsDataUrl(normalizedFile, readError);
    prepared = { dataUrl, file: normalizedFile };

    if (!maxDataUrlLength || dataUrl.length <= maxDataUrlLength) return prepared;
    maxDimension = Math.max(minimumDimension, Math.round(maxDimension * 0.82));
    quality = Math.max(0.52, quality - 0.06);
  }

  if (!prepared || (maxDataUrlLength && prepared.dataUrl.length > maxDataUrlLength)) {
    throw new Error(tooLargeError);
  }
  return prepared;
}
