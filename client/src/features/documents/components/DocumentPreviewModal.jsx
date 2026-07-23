/**
 * DocumentPreviewModal — previews a document's current version inline.
 *
 * The file is fetched as an authenticated Blob (see documents.api) and shown
 * from an object URL: PDFs in an <iframe>, images in an <img>. Formats the
 * browser can't render inline (Word/Excel) show a download prompt instead.
 * The object URL is revoked when the modal closes to avoid leaking memory.
 */
import { useEffect, useState } from 'react';
import { fetchFileBlob, downloadDocumentFile } from '../documents.api.js';
import { currentVersion } from '../documents.schema.js';
import { apiMessage } from '../../../lib/utils.js';
import Modal from '../../../components/ui/Modal.jsx';
import Button from '../../../components/ui/Button.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';

export default function DocumentPreviewModal({ doc, open, onClose }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);
  const version = doc ? currentVersion(doc) : null;

  useEffect(() => {
    if (!open || !doc) return undefined;
    let objectUrl;
    let cancelled = false;
    setUrl(null);
    setError(null);
    fetchFileBlob(doc._id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((e) => !cancelled && setError(apiMessage(e, 'Could not load the file.')));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, doc]);

  if (!open || !doc) return null;

  const isPdf = version.mimeType === 'application/pdf';
  const isImage = version.mimeType.startsWith('image/');

  return (
    <Modal open={open} onClose={onClose} title={doc.title}>
      <div className="space-y-3">
        <div className="grid min-h-[16rem] place-items-center overflow-hidden rounded-lg border border-border bg-bg">
          {error ? (
            <p className="p-6 text-sm text-danger">{error}</p>
          ) : !url ? (
            <Spinner className="h-6 w-6 text-primary" />
          ) : isPdf ? (
            <iframe title={doc.title} src={url} className="h-[60vh] w-full" />
          ) : isImage ? (
            <img src={url} alt={doc.title} className="max-h-[60vh] w-auto object-contain" />
          ) : (
            <p className="p-6 text-center text-sm text-muted">
              This file type can’t be previewed in the browser.
              <br />
              Download it to view.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">
            Version {version.version} · {version.originalName}
          </span>
          <Button
            variant="secondary"
            onClick={() => downloadDocumentFile(doc._id, version.version, version.originalName)}
          >
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}
