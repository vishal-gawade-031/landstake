import { jsPDF } from 'jspdf';

/**
 * Bulletproof cross-browser PDF downloader and viewer.
 * Supports jsPDF native save, blob anchor download, and window.open preview.
 */
export function saveOrOpenPdf(
  doc: jsPDF,
  filename: string,
  openInNewTab = false
): { success: boolean; url: string; filename: string } {
  let blobUrl = '';
  try {
    const rawBlob = doc.output('blob');
    const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
    blobUrl = URL.createObjectURL(pdfBlob);
  } catch (e) {
    console.warn('Failed to create blob URL:', e);
  }

  if (openInNewTab && blobUrl) {
    try {
      const win = window.open(blobUrl, '_blank');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        // Browser popup blocker stopped the tab, fallback to direct download
        triggerDownload(blobUrl, filename);
      }
      return { success: true, url: blobUrl, filename };
    } catch {
      try {
        doc.save(filename);
      } catch {}
      return { success: true, url: blobUrl, filename };
    }
  }

  // Direct download mode:
  try {
    // 1. Try DOM anchor with blob URL first (gives best file naming in Chrome/Edge)
    if (blobUrl) {
      triggerDownload(blobUrl, filename);
    } else {
      doc.save(filename);
    }
    return { success: true, url: blobUrl, filename };
  } catch (err) {
    console.warn('Anchor download failed, falling back to doc.save():', err);
    try {
      doc.save(filename);
      return { success: true, url: blobUrl, filename };
    } catch (saveErr) {
      console.error('All PDF download mechanisms failed:', saveErr);
      return { success: false, url: blobUrl, filename };
    }
  }
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch {}
  }, 1000);
}

