"use client";

import * as tus from "tus-js-client";

export type SignedOrderUpload = {
  apiKey: string;
  uploadId: string;
  bucket: string;
  objectPath: string;
  token: string;
  endpoint: string;
  expiresAt: string;
};

export function uploadWithSignedTus(file: File, signed: SignedOrderUpload, onProgress?: (percentage: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: signed.endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { "x-signature": signed.token, apikey: signed.apiKey },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: signed.bucket,
        objectName: signed.objectPath,
        contentType: file.type,
        cacheControl: "0",
      },
      onError: reject,
      onProgress: (uploaded, total) => onProgress?.(total ? Math.round((uploaded / total) * 100) : 0),
      onSuccess: () => resolve(),
    });
    upload.start();
  });
}
