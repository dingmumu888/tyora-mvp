export type StorageEnvironment = Record<string, string | undefined>;

export type StorageUploadInput = {
  objectPath: string;
  bytes: ArrayBuffer;
  contentType: string;
};

export type PublicStorageUpload = {
  publicUrl: string;
};

export interface StorageProvider {
  readonly kind: string;
  uploadPublicObject(input: StorageUploadInput): Promise<PublicStorageUpload>;
  uploadPrivateObject(input: StorageUploadInput): Promise<void>;
  createPrivateSignedUrl(objectPath: string, expiresInSeconds: number): Promise<string>;
}
