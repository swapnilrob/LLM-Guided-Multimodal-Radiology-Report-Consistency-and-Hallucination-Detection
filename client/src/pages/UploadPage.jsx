import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CloudUpload,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createAnalysis } from '../api/analysisApi';
import Layout from '../components/layout/Layout';
import SectionHeader from '../components/common/SectionHeader';

export default function UploadPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // ── Image upload state ──
  const [imageFile, setImageFile] = useState(null);        // the actual File object
  const [imagePreview, setImagePreview] = useState(null);  // base64 preview URL
  const [imageDragOver, setImageDragOver] = useState(false);

  // ── Report text state ──
  const [reportText, setReportText] = useState('');

  // ── UI state ──
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Ref for the hidden file input ──
  const fileInputRef = useRef(null);

  // ── Allowed image types ──
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
  const MAX_SIZE_MB = 10;

  // ── Validate an image file ──
  const validateImage = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPEG and PNG images are accepted.';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File size must be under ${MAX_SIZE_MB}MB.`;
    }
    return null; // no error
  };

  // ── Handle image selection (from file picker or drop) ──
  const handleImageSelect = (file) => {
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setImageFile(file);

    // Create a preview URL so we can show a thumbnail
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ── Drag-and-drop handlers ──
  const handleDragOver = (e) => {
    e.preventDefault();   // required to allow dropping
    setImageDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setImageDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setImageDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  // ── File picker click handler ──
  const handleFilePickerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  // ── Remove selected image ──
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Reset the file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ── Submit handler ──
  const handleSubmit = async () => {
    // Validate that both inputs are provided
    if (!imageFile) {
      setError('Please upload a chest X-ray image.');
      return;
    }
    if (!reportText.trim()) {
      setError('Please enter the radiology report text.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Build FormData — this is how files are sent to the backend
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('reportText', reportText.trim());

      // Call the backend
      const data = await createAnalysis(token, formData);

      // Get the analysis ID from the response
      const analysisId = data.analysis?._id || data.analysisId || data._id;

      if (analysisId) {
        // Redirect to the results page for this analysis
        navigate(`/results/${analysisId}`);
      } else {
        // If no ID returned, go back to dashboard
        navigate('/');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      const message =
        err.response?.data?.message || 'Upload failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* ── Page Header ── */}
        <div>
          <h1 className="text-xl font-bold text-text-dark">New Analysis</h1>
          <p className="text-sm text-text-medium mt-0.5">
            Upload a chest X-ray image and its radiology report for verification
          </p>
        </div>

        {/* ── Error Message ── */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-status-hallucinated text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Panel 1: Image Upload ── */}
        <div className="bg-panel rounded border border-border-light overflow-hidden">
          <SectionHeader number="1" title="CHEST X-RAY IMAGE" />

          <div className="p-4">
            {/* If no image selected yet, show the drop zone */}
            {!imagePreview ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFilePickerClick}
                className={`border-2 border-dashed rounded-sm p-10 flex flex-col items-center justify-center cursor-pointer transition-colors
                           ${
                             imageDragOver
                               ? 'border-border-focus bg-row-selected'
                               : 'border-border-light bg-input-bg hover:border-accent-teal-light'
                           }`}
              >
                <CloudUpload
                  className={`w-10 h-10 mb-3 ${
                    imageDragOver ? 'text-accent-teal' : 'text-text-light'
                  }`}
                />
                <p className="text-sm font-medium text-text-dark">
                  Drag and drop your chest X-ray image here
                </p>
                <p className="text-xs text-text-medium mt-1">
                  or click to browse — JPEG and PNG only, max {MAX_SIZE_MB}MB
                </p>
              </div>
            ) : (
              /* If image is selected, show the preview */
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="relative w-48 h-48 rounded border border-border-light overflow-hidden bg-black shrink-0">
                  <img
                    src={imagePreview}
                    alt="Chest X-ray preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* File info and remove button */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ImageIcon className="w-4 h-4 text-accent-teal shrink-0" />
                    <span className="text-sm font-medium text-text-dark truncate">
                      {imageFile.name}
                    </span>
                  </div>
                  <p className="text-xs text-text-medium">
                    {(imageFile.size / (1024 * 1024)).toFixed(2)} MB — {imageFile.type}
                  </p>
                  <button
                    onClick={removeImage}
                    className="mt-3 flex items-center gap-1 text-xs text-status-hallucinated hover:underline"
                  >
                    <X className="w-3 h-3" />
                    Remove image
                  </button>
                </div>
              </div>
            )}

            {/* Hidden file input — triggered by the drop zone click */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>

        {/* ── Panel 2: Report Text ── */}
        <div className="bg-panel rounded border border-border-light overflow-hidden">
          <SectionHeader number="2" title="RADIOLOGY REPORT TEXT" />

          <div className="p-4">
            <p className="text-xs text-text-medium mb-2">
              Paste the AI-generated or manually written radiology report below.
              Include both Findings and Impression sections for consistency analysis.
            </p>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder={`Findings: The lungs are clear bilaterally. There is no pleural effusion or pneumothorax. Heart size is normal. The mediastinal contours are unremarkable.\n\nImpression: No acute cardiopulmonary abnormality.`}
              rows={10}
              className="w-full bg-input-bg border border-border-light rounded-sm px-3 py-2.5 text-text-dark text-sm
                         placeholder:text-text-light
                         focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none
                         transition-colors resize-y"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-text-light">
                {reportText.length > 0
                  ? `${reportText.trim().split(/\s+/).filter(Boolean).length} words`
                  : 'No text entered'}
              </p>
              {reportText.length > 0 && (
                <button
                  onClick={() => setReportText('')}
                  className="text-xs text-text-medium hover:text-status-hallucinated transition-colors"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Submit Section ── */}
        <div className="bg-panel rounded border border-border-light p-4">
          <div className="flex items-center justify-between">
            {/* Readiness checklist */}
            <div className="flex items-center gap-4 text-xs">
              <span className={`flex items-center gap-1 ${imageFile ? 'text-status-verified' : 'text-text-light'}`}>
                <span className={`w-2 h-2 rounded-full ${imageFile ? 'bg-status-verified' : 'bg-border-light'}`} />
                Image uploaded
              </span>
              <span className={`flex items-center gap-1 ${reportText.trim() ? 'text-status-verified' : 'text-text-light'}`}>
                <span className={`w-2 h-2 rounded-full ${reportText.trim() ? 'bg-status-verified' : 'bg-border-light'}`} />
                Report entered
              </span>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !imageFile || !reportText.trim()}
              className="flex items-center gap-2 bg-chrome-section text-white px-6 py-2.5 rounded font-semibold text-sm uppercase tracking-wider
                         hover:bg-chrome-section-alt transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Run Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}  