
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { AISummaryReport } from '@/services/studentProgressService';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AIStudentReportProps {
  report: AISummaryReport | null;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

const AIStudentReport: React.FC<AIStudentReportProps> = ({ report, isExpanded, toggleExpanded }) => {
  const { language } = useLanguage();

  if (!report) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {language === 'id' 
          ? 'Laporan AI tidak tersedia saat ini.' 
          : 'AI report not available at this time.'}
      </div>
    );
  }

  // Helper to format date for chart
  const formatDateForChart = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString; // fallback to original if parsing fails
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic Summary Section - Always Visible */}
      <div>
        <h4 className="font-semibold mb-2 text-gray-800">{language === 'id' ? 'Ringkasan Umum' : 'Overall Summary'}</h4>
        <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
          {report.overallSummary}
        </p>
      </div>

      {/* Student Info - Basic Details */}
      {report.studentName && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <div>
            <h4 className="font-semibold text-gray-800">{language === 'id' ? 'Siswa' : 'Student'}</h4>
            <p className="text-gray-700">{report.studentName}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{language === 'id' ? 'Tingkat Kelas' : 'Grade Level'}</h4>
            <p className="text-gray-700">{report.gradeLevel}</p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <div className="text-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleExpanded}
          className="text-primary hover:text-primary/80 flex items-center gap-2"
        >
          {isExpanded 
            ? <><ChevronUp className="h-4 w-4" /> {language === 'id' ? 'Tampilkan Lebih Sedikit' : 'Show Less'}</> 
            : <><ChevronDown className="h-4 w-4" /> {language === 'id' ? 'Tampilkan Laporan Lengkap' : 'Show Full Report'}</>
          }
        </Button>
      </div>

      {/* Expanded Content - Only Visible when Expanded */}
      {isExpanded && (
        <div className="pt-2 space-y-4 border-t">
          <div>
            <h4 className="font-semibold mb-1 text-gray-800">{language === 'id' ? 'Kekuatan Utama' : 'Key Strengths'}</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              {report.strengths?.map((strength, i) => <li key={i}>{strength}</li>)}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-1 text-gray-800">{language === 'id' ? 'Area Peningkatan' : 'Areas for Improvement'}</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              {report.areasForImprovement?.map((area, i) => <li key={i}>{area}</li>)}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-1 text-gray-800">{language === 'id' ? 'Analisis Aktivitas' : 'Activity Analysis'}</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{report.activityAnalysis}</p>
          </div>

          {/* Knowledge Growth Chart */}
          {report.knowledgeGrowthChartData && report.knowledgeGrowthChartData.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-gray-800">
                {language === 'id' ? 'Grafik Pertumbuhan Pengetahuan' : 'Knowledge Growth Chart'}
              </h4>
              <div style={{ width: '100%', height: 250 }} className="bg-white p-2 rounded shadow">
                <ResponsiveContainer>
                  <LineChart data={report.knowledgeGrowthChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateForChart} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, language === 'id' ? 'Skor' : 'Score']}
                      labelFormatter={(label: string) => formatDateForChart(label)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                      name={language === 'id' ? 'Skor Rata-rata' : 'Average Score'} 
                      unit="%" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report Generation Timestamp */}
      {report.generatedAt && (
        <p className="text-xs text-muted-foreground text-right mt-2">
          {language === 'id' ? 'Laporan terakhir dibuat pada: ' : 'Report last generated: '}
          {new Date(report.generatedAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { 
            dateStyle: 'medium', 
            timeStyle: 'short'
          })}
        </p>
      )}
    </div>
  );
};

export default AIStudentReport;
