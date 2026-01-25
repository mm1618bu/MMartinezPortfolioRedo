import React, { useState } from 'react';
import { Demand } from '../../services/demandService';
import {
  downloadCSV,
  copyCSVToClipboard,
  generateSummaryCSV,
  generateImportTemplate,
  CSVExportOptions,
} from '../../utils/csvExport';
import './CSVExportModal.css';

interface CSVExportModalProps {
  demands: Demand[];
  isOpen: boolean;
  onClose: () => void;
}

export const CSVExportModal: React.FC<CSVExportModalProps> = ({ demands, isOpen, onClose }) => {
  const [dateFormat, setDateFormat] = useState<'ISO' | 'US' | 'EU'>('ISO');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exportType, setExportType] = useState<'full' | 'summary' | 'template'>('full');
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const options: CSVExportOptions = {
      dateFormat,
      includeMetadata,
    };

    let filename = `demands-${new Date().toISOString().split('T')[0]}.csv`;
    let content = '';

    switch (exportType) {
      case 'summary':
        content = generateSummaryCSV(demands);
        filename = `demands-summary-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'template':
        content = generateImportTemplate();
        filename = 'demands-import-template.csv';
        break;
      case 'full':
      default:
        downloadCSV(demands, filename, options);
        onClose();
        return;
    }

    // For summary and template, create blob and download
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    onClose();
  };

  const handleCopyToClipboard = async () => {
    try {
      const options: CSVExportOptions = {
        dateFormat,
        includeMetadata,
      };
      await copyCSVToClipboard(demands, options);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content csv-export-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Demands as CSV</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {demands.length === 0 ? (
            <div className="empty-message">
              <p>No demands to export</p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Export Type</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="exportType"
                      value="full"
                      checked={exportType === 'full'}
                      onChange={e => setExportType(e.target.value as any)}
                    />
                    Full Data ({demands.length} records)
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="exportType"
                      value="summary"
                      checked={exportType === 'summary'}
                      onChange={e => setExportType(e.target.value as any)}
                    />
                    Summary Report
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="exportType"
                      value="template"
                      checked={exportType === 'template'}
                      onChange={e => setExportType(e.target.value as any)}
                    />
                    Import Template
                  </label>
                </div>
              </div>

              {exportType === 'full' && (
                <>
                  <div className="form-group">
                    <label htmlFor="dateFormat">Date Format</label>
                    <select
                      id="dateFormat"
                      value={dateFormat}
                      onChange={e => setDateFormat(e.target.value as any)}
                      className="form-input"
                    >
                      <option value="ISO">ISO (YYYY-MM-DD)</option>
                      <option value="US">US (MM/DD/YYYY)</option>
                      <option value="EU">EU (DD/MM/YYYY)</option>
                    </select>
                  </div>

                  <div className="form-group checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={includeMetadata}
                        onChange={e => setIncludeMetadata(e.target.checked)}
                      />
                      Include metadata (summary comments)
                    </label>
                  </div>

                  <div className="info-box">
                    <strong>CSV Export Includes:</strong>
                    <ul>
                      <li>Demand ID and dates</li>
                      <li>Shift type and times</li>
                      <li>Employee requirements</li>
                      <li>Required skills</li>
                      <li>Priority level</li>
                      <li>Department assignment</li>
                      <li>Notes and metadata</li>
                    </ul>
                  </div>
                </>
              )}

              {exportType === 'summary' && (
                <div className="info-box">
                  <strong>Summary Report Includes:</strong>
                  <ul>
                    <li>Total demand count</li>
                    <li>Total and average employees</li>
                    <li>Priority breakdown (Low/Medium/High)</li>
                    <li>Shift type distribution</li>
                    <li>Department breakdown</li>
                    <li>Top 10 required skills</li>
                  </ul>
                </div>
              )}

              {exportType === 'template' && (
                <div className="info-box">
                  <strong>Import Template Includes:</strong>
                  <ul>
                    <li>Column headers with descriptions</li>
                    <li>Example data row</li>
                    <li>Use this to prepare bulk import files</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>

          {exportType === 'full' && (
            <button
              className="btn btn-outline"
              onClick={handleCopyToClipboard}
              title="Copy CSV content to clipboard"
            >
              {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
            </button>
          )}

          <button className="btn btn-primary" onClick={handleDownload} disabled={demands.length === 0}>
            ⬇️ Download CSV
          </button>
        </div>
      </div>
    </div>
  );
};
