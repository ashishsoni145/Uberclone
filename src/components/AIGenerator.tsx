import { useState } from 'react';
import { Sparkles, Image as ImageIcon, Video, Download, Loader2, Key, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export function AIGenerator() {
  const [activeMode, setActiveMode] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  const checkKey = async () => {
    const selected = await window.aistudio.hasSelectedApiKey();
    setHasKey(selected);
    return selected;
  };

  const handleSelectKey = async () => {
    await window.aistudio.openSelectKey();
    setHasKey(true);
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    const keySelected = await checkKey();
    if (!keySelected) {
      await handleSelectKey();
    }

    setLoading(true);
    setResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            imageSize: size,
            aspectRatio: '1:1'
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setResult(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    const keySelected = await checkKey();
    if (!keySelected) {
      await handleSelectKey();
    }

    setLoading(true);
    setResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: { 'x-goog-api-key': process.env.API_KEY || '' },
        });
        const blob = await response.blob();
        setResult(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error('Video generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Creative Studio</h1>
          <p className="text-slate-500">Generate custom visuals for your Uber profile or social media.</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 w-fit mx-auto">
          <button
            onClick={() => setActiveMode('image')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all ${
              activeMode === 'image' ? 'bg-black text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Image Generation
          </button>
          <button
            onClick={() => setActiveMode('video')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all ${
              activeMode === 'video' ? 'bg-black text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Video className="w-4 h-4" />
            Video Generation
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeMode === 'image' ? "A futuristic Uber car flying over a neon city..." : "A cinematic shot of a luxury car driving through a scenic mountain road..."}
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            {activeMode === 'image' ? (
              <div>
                <label className="block text-sm font-bold mb-2">Resolution</label>
                <div className="flex gap-2">
                  {(['1K', '2K', '4K'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`flex-1 py-2 rounded-xl border-2 font-medium transition-all ${
                        size === s ? 'border-black bg-slate-50' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold mb-2">Aspect Ratio</label>
                <div className="flex gap-2">
                  {(['16:9', '9:16'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setAspectRatio(r)}
                      className={`flex-1 py-2 rounded-xl border-2 font-medium transition-all ${
                        aspectRatio === r ? 'border-black bg-slate-50' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {r === '16:9' ? 'Landscape (16:9)' : 'Portrait (9:16)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!hasKey && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-1">API Key Required</p>
                  <p className="mb-2">Advanced models require a paid Google Cloud project API key.</p>
                  <button onClick={handleSelectKey} className="text-amber-900 font-bold underline flex items-center gap-1">
                    <Key className="w-3 h-3" /> Select Key
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={activeMode === 'image' ? generateImage : generateVideo}
              disabled={loading || !prompt.trim()}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300 shadow-lg shadow-black/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {activeMode === 'image' ? 'Creating Image...' : 'Generating Video (may take minutes)...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate {activeMode === 'image' ? 'Image' : 'Video'}
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 min-h-[400px] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400">Preview</span>
              {result && (
                <a
                  href={result}
                  download={activeMode === 'image' ? 'uber-gen.png' : 'uber-gen.mp4'}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <Download className="w-5 h-5" />
                </a>
              )}
            </div>
            
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
              {loading ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto">
                    <Loader2 className="w-10 h-10 animate-spin text-black" />
                  </div>
                  <p className="text-sm text-slate-500 animate-pulse">
                    {activeMode === 'image' ? 'Painting your vision...' : 'Rendering your masterpiece...'}
                  </p>
                </div>
              ) : result ? (
                activeMode === 'image' ? (
                  <img src={result} alt="Generated" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
                ) : (
                  <video src={result} controls className="max-w-full max-h-full rounded-2xl shadow-2xl" />
                )
              ) : (
                <div className="text-center text-slate-300">
                  {activeMode === 'image' ? <ImageIcon className="w-20 h-20 mx-auto mb-4 opacity-10" /> : <Video className="w-20 h-20 mx-auto mb-4 opacity-10" />}
                  <p>Your creation will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
