"use client";
import { useState, FormEvent, FC } from 'react';
import { Search, BrainCircuit, Bot, Zap, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

type SearchResult = {
  title: string;
  url: string;
  content: string;
};

// --- Components ---

const FeatureCard: FC<{ icon: React.ReactNode; title: string; }> = ({ icon, title }) => (
  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all hover:bg-gray-50 cursor-pointer">
    {icon}
    <span className="text-sm font-medium text-gray-700">{title}</span>
  </div>
);

const StatusBadge: FC<{ status: string | null }> = ({ status }) => {
  if (!status) return null;

  const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    'Действующий': { icon: <CheckCircle2 size={16} />, color: 'text-green-600 bg-green-100' },
    'Отменен': { icon: <XCircle size={16} />, color: 'text-red-600 bg-red-100' },
    'Заменен': { icon: <XCircle size={16} />, color: 'text-red-600 bg-red-100' },
    'Не действующий': { icon: <XCircle size={16} />, color: 'text-red-600 bg-red-100' },
    'Не определен': { icon: <HelpCircle size={16} />, color: 'text-gray-600 bg-gray-100' },
    'Анализ...': { icon: <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>, color: 'text-blue-600 bg-blue-100' },
  };

  const defaultConfig = { icon: <HelpCircle size={16} />, color: 'text-gray-600 bg-gray-100' };

  const foundKey = Object.keys(statusConfig).find(key => status.includes(key));
  const config = foundKey ? statusConfig[foundKey] : defaultConfig;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.icon}
      <span>{status}</span>
    </div>
  );
};

const SearchResultItem: FC<{ result: SearchResult, onSelect: () => void, isSelected: boolean, isAnalyzing: boolean }> = ({ result, onSelect, isSelected, isAnalyzing }) => (
  <div
    onClick={onSelect}
    className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${isSelected
      ? 'border-blue-500 bg-blue-50 shadow-md'
      : 'border-gray-200 bg-white hover:border-blue-300'
      }`}
  >
    <h3 className="font-semibold text-sm text-blue-600">{result.title}</h3>
    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{result.content}</p>
    {(isSelected && isAnalyzing) && (
      <div className="flex items-center gap-2 mt-2">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
        <span className="text-xs text-blue-600 font-medium">Анализируется...</span>
      </div>
    )}
  </div>
);

type AnalysisState = 'idle' | 'loading' | 'streaming' | 'error' | 'success';

const SearchPage: FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState('');

  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [gigachatError, setGigachatError] = useState<string | null>(null);
  const [gigachatContent, setGigachatContent] = useState<string>('');
  const [documentStatus, setDocumentStatus] = useState<string | null>(null);

  const resetAnalysisState = () => {
    setAnalysisState('idle');
    setGigachatContent('');
    setGigachatError(null);
    setDocumentStatus(null);
  };

  const handleSelectResult = async (result: SearchResult) => {
    console.log(`[FRONTEND] handleSelectResult triggered for: "${result.title}"`);
    setSelectedResult(result);
    resetAnalysisState();
    setAnalysisState('loading');
    setDocumentStatus('Анализ...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[FRONTEND] Request timed out after 15 seconds.");
      controller.abort();
    }, 15000); // Increased timeout to 15 seconds

    try {
      console.log("[FRONTEND] Sending request to /api/gigachat");
      const response = await fetch('/api/gigachat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Проанализируй следующий нормативный документ и сделай краткую выжимку основных требований и положений.`,
          url: result.url,
          title: result.title,
          query: activeQuery,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("[FRONTEND] Received response from /api/gigachat, status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[FRONTEND] API error response text:", errorText);
        try {
          const errData = JSON.parse(errorText);
          throw new Error(errData.error || 'Ошибка ответа от API');
        } catch (e) {
          throw new Error(errorText || 'Не удалось получить анализ от GigaChat');
        }
      }

      if (!response.body) {
        throw new Error("Streaming body is not available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let statusFound = false;
      let hasReceivedData = false;
      setAnalysisState('streaming');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (!hasReceivedData) {
            throw new Error("Получен пустой ответ от GigaChat");
          }
          setAnalysisState('success');
          break;
        }

        hasReceivedData = true;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6);
            if (jsonStr.includes('[DONE]')) {
              if (!hasReceivedData) {
                throw new Error("Получен пустой ответ от GigaChat");
              }
              setAnalysisState('success');
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);

              // Проверяем на ошибку в стриме
              if (parsed.error) {
                throw new Error(parsed.error);
              }

              const contentChunk = parsed.choices[0]?.delta?.content;

              if (contentChunk) {
                accumulatedContent += contentChunk;
                if (!statusFound) {
                  const newlineIndex = accumulatedContent.indexOf('\n');
                  if (newlineIndex !== -1) {
                    const statusLine = accumulatedContent.substring(0, newlineIndex).replace('Статус:', '').trim();
                    setDocumentStatus(statusLine);
                    setGigachatContent(accumulatedContent.substring(newlineIndex + 1));
                    statusFound = true;
                  }
                } else {
                  setGigachatContent(prev => prev + contentChunk);
                }
              }
            } catch (e) {
              console.warn("Could not parse stream chunk:", e);
            }
          }
        }
        if (analysisState !== 'streaming') break; // Exit if state changed (e.g. by DONE signal)
      }

    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[FRONTEND] Error in handleSelectResult:", err);
      setAnalysisState('error');

      if (err.name === 'AbortError') {
        setGigachatError('Время ожидания ответа от сервера истекло (15 сек). Попробуйте еще раз.');
        setDocumentStatus('Нет данных');
      } else {
        setGigachatError(err.message);
        setDocumentStatus(null);
      }
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setActiveQuery(query);
    setError(null);
    setResults([]);
    setSelectedResult(null);
    resetAnalysisState();

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Не удалось выполнить поиск');
      }

      const data = await response.json();
      setResults(data.results || []);
      if (data.results?.length > 0) {
        handleSelectResult(data.results[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Найди ГОСТ</h1>
          <p className="mt-2 text-lg text-gray-600">
            Поиск и анализ российских нормативных документов с ИИ
          </p>
        </header>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <FeatureCard icon={<Search size={20} className="text-blue-500" />} title="Поиск в реальном времени" />
          <FeatureCard icon={<BrainCircuit size={20} className="text-green-500" />} title="AI-Powered" />
          <FeatureCard icon={<Bot size={20} className="text-purple-500" />} title="Контекстуальный анализ" />
          <FeatureCard icon={<Zap size={20} className="text-yellow-500" />} title="Быстро и точно" />
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Найдите ГОСТ, СНиП или другой нормативный документ..."
              className="w-full rounded-full border-2 border-gray-300 bg-white py-4 pl-6 pr-16 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute inset-y-0 right-0 flex items-center justify-center rounded-full bg-blue-600 w-12 h-12 my-auto mx-2 text-white hover:bg-blue-700 disabled:bg-blue-300 transition"
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Search size={20} />}
            </button>
          </div>
        </form>

        {/* Main Content */}
        <main className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Content Display */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-8 min-h-[24rem] flex flex-col">
            {analysisState === 'idle' && !selectedResult ? (
              // Initial State (no document selected yet)
              <div className="text-center text-gray-500 h-full flex flex-col justify-center items-center">
                <Bot size={48} className="mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold">Результат анализа GigaChat</h2>
                <p>Выберите документ из списка справа, чтобы получить его анализ.</p>
              </div>
            ) : selectedResult && (
              // Analysis State (a document has been selected)
              <>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <div className='flex items-center gap-2'>
                    <Bot size={24} className="text-blue-500" />
                    <h2 className="text-xl font-semibold mb-0">Анализ документа</h2>
                  </div>
                  <StatusBadge status={documentStatus} />
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 flex-shrink-0">
                  <a href={selectedResult.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-800 font-medium hover:underline">
                    {selectedResult.title}
                  </a>
                </div>

                <div className="flex-grow overflow-y-auto">
                  {analysisState === 'error' && gigachatError && (
                    <div className="text-center text-red-500 h-full flex flex-col justify-center items-center">
                      <Bot size={48} className="mb-4 text-red-300" />
                      <h2 className="text-xl font-semibold">Ошибка анализа</h2>
                      <p className="text-sm">{gigachatError}</p>
                      <button
                        onClick={() => handleSelectResult(selectedResult)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Попробовать снова
                      </button>
                    </div>
                  )}
                  {analysisState === 'loading' && (
                    <div className="text-center text-gray-500 h-full flex flex-col justify-center items-center py-10">
                      <BrainCircuit size={48} className="mb-4 text-gray-300 animate-pulse" />
                      <p>Подготовка к анализу...</p>
                    </div>
                  )}
                  {(analysisState === 'streaming' || analysisState === 'success') && (
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {gigachatContent}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Panel: Search Results */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Search size={20} />
              Результаты поиска
              {results.length > 0 && <span className="text-sm font-normal text-gray-500">({results.length})</span>}
            </h2>
            <div className="mt-4 space-y-3 h-96 overflow-y-auto pr-2">
              {results.map((res, i) => (
                <SearchResultItem
                  key={i}
                  result={res}
                  onSelect={() => handleSelectResult(res)}
                  isSelected={res.url === selectedResult?.url}
                  isAnalyzing={res.url === selectedResult?.url && (analysisState === 'loading' || analysisState === 'streaming')}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SearchPage;
