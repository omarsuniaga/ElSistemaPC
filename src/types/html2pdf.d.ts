declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type: string; quality: number };
    html2canvas?: { 
      scale: number; 
      useCORS: boolean;
      letterRendering?: boolean;
      logging?: boolean;
      allowTaint?: boolean;
      scrollY?: number;
    };
    jsPDF?: { 
      unit: string; 
      format: string; 
      orientation: string 
    };
    pagebreak?: {
      mode: string[];
      before?: string;
      after?: string;
      avoid?: string;
    };
  }

  interface Html2PdfInstance {
    from(element: HTMLElement): Html2PdfInstance;
    set(options: Html2PdfOptions): Html2PdfInstance;
    save(): Promise<void>;
    toPdf(): Html2PdfInstance;
    get(type: string): any;
    outputPdf(type: 'blob'): Promise<Blob>;
  }

  function html2pdf(): Html2PdfInstance;
  export default html2pdf;
}