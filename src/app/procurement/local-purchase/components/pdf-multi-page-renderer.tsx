
'use client';

import React, { useState, useEffect } from 'react';
import type { OrganizationSettings } from '@/app/settings/page';
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
// @ts-ignore
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfMultiPageRendererProps {
    file: string;
    label: string;
    orgSettings: OrganizationSettings;
}

/**
 * PdfMultiPageRenderer - Browser-only component for high-fidelity PDF decomposition.
 * Configured to run only in the browser to prevent build-time canvas errors.
 */
const PdfMultiPageRenderer: React.FC<PdfMultiPageRendererProps> = ({ file, label, orgSettings }) => {
    const [pages, setPages] = useState<string[]>([]);

    useEffect(() => {
        const renderPdf = async () => {
            if (typeof window === 'undefined') return;
            try {
                const loadingTask = pdfjsLib.getDocument(file);
                const pdf = await loadingTask.promise;
                const pageImages: string[] = [];
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 }); // High-density scaling
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    
                    if (context) {
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        await page.render({ canvasContext: context, viewport }).promise;
                        pageImages.push(canvas.toDataURL('image/jpeg', 0.8));
                    }
                }
                setPages(pageImages);
            } catch (err) {
                console.error("Critical PDF Rendering Failure:", err);
            }
        };
        renderPdf();
    }, [file]);

    if (pages.length === 0) return null;

    return (
        <>
            {pages.map((imgData, index) => (
                <div key={index} className="page-break bg-white p-8 w-[21cm] h-[29.7cm] flex flex-col border-2 border-black mx-auto overflow-hidden">
                    <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center shrink-0">
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter">{orgSettings.name}</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Secure Evidence Vault</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-lg font-black uppercase text-primary italic underline underline-offset-4">{label} - Page {index + 1}</h2>
                        </div>
                    </div>
                    
                    <div className="flex-grow flex items-center justify-center relative bg-gray-50/50 border-4 border-dashed border-gray-200 rounded-2xl overflow-hidden p-4">
                        <img 
                            src={imgData} 
                            alt={`${label} page ${index + 1}`} 
                            className="max-w-full max-h-full object-contain shadow-2xl" 
                        />
                    </div>

                    <div className="mt-6 pt-4 border-t border-black/10 text-center shrink-0">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">YKK ERP Solution • Organizational Full-Set Bundle</p>
                    </div>
                </div>
            ))}
        </>
    );
};

export default PdfMultiPageRenderer;
