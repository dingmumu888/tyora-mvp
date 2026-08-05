export type PublicImagePreparationErrors = {
  read?: string;
  unsupported?: string;
  prepare?: string;
  tooLarge?: string;
};

export type PublicImagePreparationOptions = {
  maxDimension?: number;
  quality?: number;
  maxFileSize?: number;
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

function loadHtmlImage(src: string, message: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(message));
    image.src = src;
  });
}

async function decodeBrowserImage(file: File, src: string, message: string) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap as CanvasImageSource, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Older browsers fall back to the HTML image decoder, which also honors EXIF orientation in current engines.
    }
  }
  const image = await loadHtmlImage(src, message);
  return { source: image as CanvasImageSource, width: image.naturalWidth, height: image.naturalHeight, close: undefined };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/webp", quality: number, message: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(message));
    }, type, quality);
  });
}

function normalizedName(name: string, type: "image/png" | "image/webp") {
  const base = name.replace(/\.[^.]+$/, "").trim() || "image";
  return `${base}.${type === "image/png" ? "png" : "webp"}`;
}

function hasTransparency(context: CanvasRenderingContext2D, width: number, height: number) {
  const pixels = context.getImageData(0, 0, width, height).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 255) return true;
  }
  return false;
}

export async function preparePublicImage(
  file: File,
  options: PublicImagePreparationOptions = {}
): Promise<PreparedPublicImage> {
  const {
    maxDimension: initialMaxDimension = 2048,
    quality: initialQuality = 0.82,
    maxFileSize = 1_500_000,
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
  const image = await decodeBrowserImage(file, source, unsupportedError);
  let maxDimension = initialMaxDimension;
  let quality = initialQuality;
  let prepared: PreparedPublicImage | null = null;

  try {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const scale = Math.min(1, maxDimension / image.width, maxDimension / image.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error(prepareError);

      const preserveAlpha = file.type === "image/png";
      if (!preserveAlpha) {
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image.source, 0, 0, canvas.width, canvas.height);

      const outputType = preserveAlpha && hasTransparency(context, canvas.width, canvas.height)
        ? "image/png"
        : "image/webp";
      const blob = await canvasToBlob(canvas, outputType, quality, prepareError);
      const normalizedFile = new File([blob], normalizedName(file.name, outputType), {
        type: outputType,
        lastModified: file.lastModified
      });
      const dataUrl = await readFileAsDataUrl(normalizedFile, readError);
      prepared = { dataUrl, file: normalizedFile };

      if (blob.size <= maxFileSize && (!maxDataUrlLength || dataUrl.length <= maxDataUrlLength)) return prepared;
      maxDimension = Math.max(minimumDimension, Math.round(maxDimension * 0.82));
      quality = Math.max(0.52, quality - 0.06);
    }

    if (!prepared || prepared.file.size > maxFileSize || (maxDataUrlLength && prepared.dataUrl.length > maxDataUrlLength)) {
      throw new Error(tooLargeError);
    }
    return prepared;
  } finally {
    image.close?.();
  }
}
