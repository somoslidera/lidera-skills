import React, { useRef, useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { exportToPDF, exportDashboardToExcel } from '../../utils/reportExporter';
import { toast } from '../../utils/toast';
import { useAuditLogger } from '../../utils/auditLogger';

interface ReportExporterProps {
  title: string;
  contentRef?: React.RefObject<HTMLElement>;
  generalMetrics?: any;
  competenceMetrics?: any;
  comparativeMetrics?: any;
  companyName?: string;
  exportType?: 'dashboard' | 'custom';
}

export const ReportExporter: React.FC<ReportExporterProps> = ({
  title,
  contentRef,
  generalMetrics,
  competenceMetrics,
  comparativeMetrics,
  companyName = 'Empresa',
  exportType = 'custom'
}) => {
  const { logAction } = useAuditLogger();
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const contentElementRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (exportType === 'dashboard' && !generalMetrics) {
      toast.error('Dados do dashboard não disponíveis');
      return;
    }

    setExportingPDF(true);
    try {
      const element = contentRef?.current || contentElementRef.current;
      if (!element) {
        toast.error('Conteúdo não encontrado para exportação');
        return;
      }

      const filename = `relatorio_${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      await exportToPDF(title, element, filename);
      
      // Log de auditoria
      await logAction('export', 'report', 'pdf', {
        entityName: filename,
        metadata: { type: 'PDF', reportType: exportType }
      });
      
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (exportType === 'dashboard') {
      if (!generalMetrics || !competenceMetrics || !comparativeMetrics) {
        toast.error('Dados do dashboard não disponíveis');
        return;
      }

      setExportingExcel(true);
      try {
        const filename = exportDashboardToExcel(
          generalMetrics,
          competenceMetrics,
          comparativeMetrics,
          companyName
        );
        
        // Log de auditoria
        await logAction('export', 'report', 'excel', {
          entityName: filename || 'dashboard_report',
          metadata: { type: 'Excel', reportType: 'dashboard' }
        });
        
        toast.success('Relatório Excel exportado com sucesso!');
      } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        toast.error('Erro ao exportar Excel. Tente novamente.');
      } finally {
        setExportingExcel(false);
      }
    } else {
      toast.warning('Exportação Excel disponível apenas para dashboard completo');
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportPDF}
        disabled={exportingPDF}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exportingPDF ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>Exportar PDF</span>
          </>
        )}
      </button>

      {exportType === 'dashboard' && (
        <button
          onClick={handleExportExcel}
          disabled={exportingExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportingExcel ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Exportando...</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
