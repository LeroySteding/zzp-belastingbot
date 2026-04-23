'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReceiptUploadProps {
  onUpload: (file: File) => void
  onClear?: () => void
  currentReceipt?: string | null
  loading?: boolean
}

export function ReceiptUpload({ onUpload, onClear, currentReceipt, loading }: ReceiptUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentReceipt || null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Call parent handler
      onUpload(file)
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: loading,
  })

  const handleClear = () => {
    setPreview(null)
    if (onClear) onClear()
  }

  const isPDF = preview?.startsWith('data:application/pdf')

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-border hover:border-muted-foreground'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">Verwerken...</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  {isDragActive ? 'Laat de bon hier los...' : 'Sleep een bon hierheen of klik om te uploaden'}
                </p>
                <p className="text-xs text-muted-foreground">JPG, PNG of PDF (max 10MB)</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative border-2 border-border rounded-lg p-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={handleClear}
            disabled={loading}
            aria-label="Bon verwijderen"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>

          <div className="flex items-center gap-4">
            {isPDF ? (
              <div className="flex-shrink-0 w-24 h-24 bg-muted rounded flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            ) : (
              <img
                src={preview}
                alt="Voorbeeld van geupload bon"
                className="w-24 h-24 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {isPDF ? 'PDF Bon' : 'Afbeelding'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Klik op het kruisje om een andere bon te uploaden
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
