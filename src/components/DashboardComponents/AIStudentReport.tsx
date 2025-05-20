import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { AISummaryReport } from '@/services/studentProgressService';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChevronDown, ChevronUp, AlertCircle, CalendarDays, RefreshCw, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';

interface AIStudentReportProps {
  report: AISummaryReport | null;
  isExpanded: boolean;
  toggleExpanded: () => void;
  isLoading: boolean;
  studentRealAge?: number;
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

// Helper to format date for chart based on granularity
const formatDateForChart = (dateString?: string, granularity: Granularity = 'daily') => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Invalid date

    switch (granularity) {
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

const AIStudentReport: React.FC<AIStudentReportProps> = ({ report, isExpanded, toggleExpanded, isLoading, studentRealAge }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  // Default to 'daily' granularity
  const [granularity, setGranularity] = useState<Granularity>('daily');
  // Clear date range by default to show all available data
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Auto-expand the report if there's real chart data available
  useEffect(() => {
    if (
      !isExpanded && 
      report?.knowledgeGrowthChartData && 
      Array.isArray(report.knowledgeGrowthChartData) && 
      report.knowledgeGrowthChartData.length > 3
    ) {
      toggleExpanded();
    }
  }, [report, isExpanded, toggleExpanded]);

  // Debug output to console to help identify data issues
  console.log("AI Report Data Check:", {
    hasOverallSummary: !!report?.overallSummary,
    strengthsLength: report?.strengths?.length || 0,
    areasForImprovementLength: report?.areasForImprovement?.length || 0,
    hasChartData: !!(report?.knowledgeGrowthChartData && report.knowledgeGrowthChartData.length > 0),
    studentRealAge: studentRealAge || report?.studentAge || 'unknown',
    reportData: report ? 'exists' : 'missing'
  });

  // Always call useMemo, but return empty array if no data
  const processedChartData = useMemo(() => {
    if (!report?.knowledgeGrowthChartData || !Array.isArray(report.knowledgeGrowthChartData)) return [];

    // Ensure we have valid data with dates and scores
    const validData = report.knowledgeGrowthChartData.filter(
      (item: ChartDataPoint) => item.date && !isNaN(new Date(item.date).getTime()) && typeof item.score === 'number'
    );

    if (validData.length === 0) return [];

    // Filter data based on date range
    const filteredData = validData.filter((item: ChartDataPoint) => {
      const itemDate = new Date(item.date);
      if (dateRange.from && itemDate < dateRange.from) return false;
      if (dateRange.to && itemDate > new Date(dateRange.to.getTime() + 86399999)) return false; // Include the whole 'to' day
      return true;
    });

    // If we don't have enough data points, avoid aggregation
    if (filteredData.length <= 5 && granularity === 'daily') {
      return filteredData
        .map(item => ({
          date: new Date(item.date).toISOString(),
          score: item.score
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // Process data based on granularity
    const aggregatedData: Record<string, { sum: number; count: number; date: Date }> = {};

    filteredData.forEach((item: ChartDataPoint) => {
      const date = new Date(item.date);
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

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {language === 'id' 
          ? 'Memuat laporan AI...' 
          : 'Loading AI report...'}
      </div>
    );
  }

  // No report state - Only show this if truly no report exists
  if (!report) {
    return (
      <Alert variant="default" className="my-4 border-yellow-400 bg-yellow-50 text-yellow-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
            <AlertDescription>
              {language === 'id' 
                ? 'Data tidak cukup untuk menampilkan laporan. Lakukan lebih banyak aktivitas belajar untuk mendapatkan laporan lengkap.' 
                : 'Not enough data to display a report. Complete more learning activities to get a full report.'}
            </AlertDescription>
          </div>
          <div className="mt-2 flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white hover:bg-white/90"
              onClick={() => {
                // Dispatch an event to trigger a refresh in the parent component
                window.dispatchEvent(new CustomEvent('force-refresh-ai-report', { 
                  detail: { studentId: 'refresh-all' } 
                }));
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {language === 'id' ? 'Muat Ulang Laporan' : 'Refresh Report'}
            </Button>
          </div>
        </div>
      </Alert>
    );
  }

  // Main report state - Now we'll always show this if there's a report object, even if it has minimal data
  return (
    <div className="space-y-4">
      {/* Basic Summary Section - Always Visible */}
      <div>
        <h4 className="font-semibold mb-2 text-gray-800">{language === 'id' ? 'Ringkasan Umum' : 'Overall Summary'}</h4>
        <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
          {report.overallSummary || (language === 'id' 
            ? 'Belum cukup data pembelajaran untuk membuat ringkasan yang lengkap. Lanjutkan aktivitas belajar untuk mendapatkan wawasan yang lebih baik.'
            : 'Not enough learning data to create a complete summary. Continue learning activities to get better insights.')}
        </p>
      </div>

      {/* Student Info - Basic Details */}
      {report.studentName && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
          <div>
            <h4 className="font-semibold text-gray-800">{language === 'id' ? 'Siswa' : 'Student'}</h4>
            <p className="text-gray-700">{report.studentName}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{language === 'id' ? 'Usia' : 'Age'}</h4>
            <p className="text-gray-700">{studentRealAge || report.studentAge || '-'}</p>
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

      {/* Message when there's no expanded data available */}
      {isExpanded && 
        (!report.strengths?.length && !report.areasForImprovement?.length && !report.activityAnalysis && (!report.knowledgeGrowthChartData || report.knowledgeGrowthChartData.length === 0)) && (
        <div className="pt-2 space-y-4 border-t">
          <Alert variant="default" className="my-4 bg-yellow-50 text-yellow-800 border-yellow-200">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">
                  {language === 'id' ? 'Belum Ada Data Detail' : 'No Detailed Data Available'}
                </p>
                <p className="text-sm">
                  {language === 'id' 
                    ? 'Selesaikan lebih banyak aktivitas pembelajaran untuk membuka laporan detail dan wawasan personalisasi.'
                    : 'Complete more learning activities to unlock detailed reports and personalized insights.'}
                </p>
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white hover:bg-white/90"
                    onClick={() => {
                      navigate('/lessons');
                    }}
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1" />
                    {language === 'id' ? 'Jelajahi Pelajaran' : 'Explore Lessons'}
                  </Button>
                </div>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* Expanded Content - Only Visible when Expanded */}
      {isExpanded && (report.strengths?.length > 0 || report.areasForImprovement?.length > 0 || report.activityAnalysis || (report.knowledgeGrowthChartData && report.knowledgeGrowthChartData.length > 0)) && (
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
                        <span>{language === 'id' ? 'Semua data' : 'All data'}</span>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDateRange({ from: undefined, to: undefined })} 
                  disabled={!dateRange.from && !dateRange.to}
                >
                  {language === 'id' ? 'Tampilkan Semua' : 'Show All Data'}
                </Button>
              </div>
              
              {processedChartData && processedChartData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }} className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-md">
                  <ResponsiveContainer>
                    <LineChart data={processedChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(tick) => formatDateForChart(tick, granularity)} 
                        stroke="#888"
                        fontSize={12}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        stroke="#888" 
                        fontSize={12}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, language === 'id' ? 'Skor' : 'Score']}
                        labelFormatter={(label: string) => formatDateForChart(label, granularity)}
                        contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        activeDot={{ r: 8, fill: '#8884d8', stroke: 'white', strokeWidth: 2 }} 
                        name={language === 'id' ? 'Skor Rata-rata' : 'Average Score'} 
                        unit="%" 
                        dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-6 border rounded-lg bg-gray-50">
                  <p className="text-muted-foreground mb-2">
                    {language === 'id' ? 'Tidak cukup data untuk granularitas atau rentang tanggal yang dipilih.' : 'Not enough data for selected granularity or date range.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGranularity('daily');
                      setDateRange({ from: undefined, to: undefined });
                    }}
                  >
                    {language === 'id' ? 'Reset ke Tampilan Default' : 'Reset to Default View'}
                  </Button>
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
