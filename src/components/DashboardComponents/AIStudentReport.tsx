
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { AISummaryReport } from '@/services/studentProgressService';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChevronDown, ChevronUp, AlertCircle, CalendarDays } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AIStudentReportProps {
  report: AISummaryReport | null;
  isExpanded: boolean;
  toggleExpanded: () => void;
  isLoading: boolean;
}

type ChartDataPoint = { date: string; score: number };
type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Helper functions for date aggregation
const getWeek = (date: Date): string => {
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return `${year}-W${String(Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)).padStart(2, '0')}`;
};

const getMonth = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
};

const getYear = (date: Date): string => {
  return String(date.getFullYear()); // YYYY
};

const AIStudentReport: React.FC<AIStudentReportProps> = ({ report, isExpanded, toggleExpanded, isLoading }) => {
  const { language } = useLanguage();
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  if (isLoading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {language === 'id' 
          ? 'Memuat laporan AI...' 
          : 'Loading AI report...'}
      </div>
    );
  }

  if (!report) {
    return (
      <Alert variant="default" className="my-4 border-yellow-400 bg-yellow-50 text-yellow-800">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {language === 'id' 
            ? 'Data tidak cukup untuk menampilkan laporan. Lakukan lebih banyak aktivitas belajar untuk mendapatkan laporan lengkap.' 
            : 'Not enough data to display a report. Complete more learning activities to get a full report.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Check if there's enough meaningful data in the report
  const hasMinimalData = report?.overallSummary && 
                        (report.strengths?.length > 0 || 
                         report.areasForImprovement?.length > 0 || 
                         (report.knowledgeGrowthChartData && report.knowledgeGrowthChartData.length > 0) 
                        );

  if (!hasMinimalData) {
    return (
      <Alert variant="default" className="my-4 border-yellow-400 bg-yellow-50 text-yellow-800">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {language === 'id' 
            ? 'Belum cukup data untuk membuat laporan yang bermakna. Lanjutkan aktivitas belajar untuk mendapatkan wawasan yang lebih baik.' 
            : 'Not enough meaningful data to create a report yet. Continue learning activities to gain better insights.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Helper to format date for chart based on granularity
  const formatDateForChart = (dateString?: string, currentGranularity: Granularity = granularity) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Invalid date

      switch (currentGranularity) {
        case 'daily':
          return format(date, 'MMM d');
        case 'weekly':
          // For weekly, dateString might be 'YYYY-WW'. We need to parse or display as is.
          // If it's a full date string, format to week.
          if (dateString.includes('-W')) return dateString; // Already formatted as YYYY-WW
          return `Week of ${format(date, 'MMM d')}`;
        case 'monthly':
          return format(date, 'MMM yyyy');
        case 'yearly':
          return format(date, 'yyyy');
        default:
          return format(date, 'MMM d');
      }
    } catch (e) {
      return dateString; // fallback to original if parsing fails
    }
  };

  const processedChartData = useMemo(() => {
    if (!report?.knowledgeGrowthChartData || !Array.isArray(report.knowledgeGrowthChartData)) return [];

    // Filter data based on date range
    const filteredData = report.knowledgeGrowthChartData.filter((item: ChartDataPoint) => {
      if (!item.date) return false;
      
      const itemDate = new Date(item.date);
      if (isNaN(itemDate.getTime())) return false;
      if (dateRange.from && itemDate < dateRange.from) return false;
      if (dateRange.to && itemDate > new Date(dateRange.to.getTime() + 86399999)) return false; // Include the whole 'to' day
      return true;
    });

    // Process data based on granularity
    const aggregatedData: Record<string, { sum: number; count: number; date: Date }> = {};

    filteredData.forEach((item: ChartDataPoint) => {
      if (!item.date) return;
      
      const date = new Date(item.date);
      if (isNaN(date.getTime())) return;

      let key = '';
      let groupDate = date;

      switch (granularity) {
        case 'daily':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          groupDate = date;
          break;
        case 'weekly':
          key = getWeek(date);
          const dayOfWeek = date.getDay();
          const firstDayOfWeek = new Date(date);
          firstDayOfWeek.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
          groupDate = firstDayOfWeek;
          break;
        case 'monthly':
          key = getMonth(date);
          groupDate = new Date(date.getFullYear(), date.getMonth(), 1);
          break;
        case 'yearly':
          key = getYear(date);
          groupDate = new Date(date.getFullYear(), 0, 1);
          break;
      }

      if (!aggregatedData[key]) {
        aggregatedData[key] = { sum: 0, count: 0, date: groupDate };
      }
      aggregatedData[key].sum += item.score;
      aggregatedData[key].count += 1;
    });

    // Convert aggregated data to chart format
    return Object.keys(aggregatedData)
      .map(key => ({
        date: aggregatedData[key].date.toISOString(),
        score: Math.round(aggregatedData[key].sum / aggregatedData[key].count),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [report?.knowledgeGrowthChartData, granularity, dateRange]);

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
          {report.strengths && report.strengths.length > 0 ? (
            <div>
              <h4 className="font-semibold mb-1 text-gray-800">{language === 'id' ? 'Kekuatan Utama' : 'Key Strengths'}</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                {report.strengths?.map((strength, i) => <li key={i}>{strength}</li>)}
              </ul>
            </div>
          ) : null}

          {report.areasForImprovement && report.areasForImprovement.length > 0 ? (
            <div>
              <h4 className="font-semibold mb-1 text-gray-800">{language === 'id' ? 'Area Peningkatan' : 'Areas for Improvement'}</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                {report.areasForImprovement?.map((area, i) => <li key={i}>{area}</li>)}
              </ul>
            </div>
          ) : null}

          {report.activityAnalysis ? (
            <div>
              <h4 className="font-semibold mb-1 text-gray-800">{language === 'id' ? 'Analisis Aktivitas' : 'Activity Analysis'}</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{report.activityAnalysis}</p>
            </div>
          ) : null}

          {/* Knowledge Growth Chart */}
          {report.knowledgeGrowthChartData && Array.isArray(report.knowledgeGrowthChartData) && report.knowledgeGrowthChartData.length > 0 ? (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-gray-800">
                {language === 'id' ? 'Grafik Pertumbuhan Pengetahuan' : 'Knowledge Growth Chart'}
              </h4>

              {/* Granularity and Date Range Filters */}
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <Select value={granularity} onValueChange={(value: Granularity) => setGranularity(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder={language === 'id' ? 'Granularitas' : 'Granularity'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{language === 'id' ? 'Harian' : 'Daily'}</SelectItem>
                    <SelectItem value="weekly">{language === 'id' ? 'Mingguan' : 'Weekly'}</SelectItem>
                    <SelectItem value="monthly">{language === 'id' ? 'Bulanan' : 'Monthly'}</SelectItem>
                    <SelectItem value="yearly">{language === 'id' ? 'Tahunan' : 'Yearly'}</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-[240px] justify-start text-left font-normal"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>{language === 'id' ? 'Pilih rentang tanggal' : 'Pick a date range'}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange(range ? { from: range.from, to: range.to } : { from: undefined, to: undefined })}
                      initialFocus
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })} disabled={!dateRange.from && !dateRange.to}>
                  {language === 'id' ? 'Reset Tanggal' : 'Reset Dates'}
                </Button>
              </div>
              
              {processedChartData && processedChartData.length > 1 ? (
                <div style={{ width: '100%', height: 250 }} className="bg-white p-2 rounded shadow">
                  <ResponsiveContainer>
                    <LineChart data={processedChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(tick) => formatDateForChart(tick, granularity)} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, language === 'id' ? 'Skor' : 'Score']}
                        labelFormatter={(label: string) => formatDateForChart(label, granularity)}
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
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {language === 'id' ? 'Tidak cukup data untuk granularitas atau rentang tanggal yang dipilih.' : 'Not enough data for selected granularity or date range.'}
                </div>
              )}
            </div>
          ) : null}
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
