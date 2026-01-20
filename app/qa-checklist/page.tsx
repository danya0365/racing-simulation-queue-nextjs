'use client';

/**
 * QA Checklist Page
 * Manual testing checklist for the racing queue system
 * Helps track testing progress with persistent checkboxes
 */

import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { useQAChecklistStore } from '@/src/presentation/stores/useQAChecklistStore';
import { useEffect, useState } from 'react';

export default function QAChecklistPage() {
  const { testCases, toggleTest, resetAll, getProgress, getCategoryProgress, addNote } = useQAChecklistStore();
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-racing-gradient flex items-center justify-center">
        <div className="text-muted">กำลังโหลด...</div>
      </div>
    );
  }

  const progress = getProgress();
  const categories = [...new Set(testCases.map(tc => tc.category))];

  const handleSaveNote = (id: string) => {
    addNote(id, noteInput);
    setNoteInput('');
    setExpandedId(null);
  };

  return (
    <div className="min-h-screen bg-racing-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  🧪 QA Checklist
                </span>
              </h1>
              <p className="text-muted text-sm mt-1">รายการทดสอบสำหรับระบบ Racing Queue</p>
            </div>
            <GlowButton
              color="red"
              size="sm"
              onClick={() => {
                if (confirm('รีเซ็ตความคืบหน้าทั้งหมด?')) {
                  resetAll();
                }
              }}
            >
              🔄 รีเซ็ต
            </GlowButton>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <section className="max-w-4xl mx-auto px-4 py-6">
        <AnimatedCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-foreground">ความคืบหน้าโดยรวม</h2>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              {progress.percentage}%
            </span>
          </div>
          
          <div className="w-full bg-card rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-muted">
            <span>{progress.completed} / {progress.total} tests</span>
            <span>
              {progress.completed === progress.total && progress.total > 0 ? (
                <span className="text-emerald-400">✅ ทดสอบครบแล้ว!</span>
              ) : (
                <span>เหลืออีก {progress.total - progress.completed} รายการ</span>
              )}
            </span>
          </div>
        </AnimatedCard>
      </section>

      {/* Test Cases by Category */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="space-y-6">
          {categories.map(category => {
            const categoryProgress = getCategoryProgress(category);
            const categoryTests = testCases.filter(tc => tc.category === category);
            const isComplete = categoryProgress.completed === categoryProgress.total;

            return (
              <AnimatedCard key={category} className="overflow-hidden">
                {/* Category Header */}
                <div className={`px-6 py-4 border-b border-border ${
                  isComplete ? 'bg-emerald-500/10' : 'bg-purple-500/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      {isComplete ? '✅' : '📋'} {category}
                    </h3>
                    <span className={`text-sm font-medium ${
                      isComplete ? 'text-emerald-400' : 'text-muted'
                    }`}>
                      {categoryProgress.completed}/{categoryProgress.total}
                    </span>
                  </div>
                </div>

                {/* Test Cases */}
                <div className="divide-y divide-border">
                  {categoryTests.map(tc => (
                    <div
                      key={tc.id}
                      className={`p-4 transition-colors ${
                        tc.completed ? 'bg-emerald-500/5' : 'hover:bg-card/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTest(tc.id)}
                          className={`w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            tc.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-muted hover:border-cyan-400'
                          }`}
                        >
                          {tc.completed && '✓'}
                        </button>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className={`font-medium ${
                                tc.completed ? 'text-muted line-through' : 'text-foreground'
                              }`}>
                                {tc.title}
                              </h4>
                              <p className="text-sm text-muted mt-1">{tc.description}</p>
                            </div>
                            <button
                              onClick={() => setExpandedId(expandedId === tc.id ? null : tc.id)}
                              className="text-muted hover:text-cyan-400 text-sm"
                            >
                              {expandedId === tc.id ? '▲ ซ่อน' : '▼ รายละเอียด'}
                            </button>
                          </div>

                          {/* Expanded Details */}
                          {expandedId === tc.id && (
                            <div className="mt-4 space-y-4 animate-fade-in">
                              {/* Steps */}
                              <div>
                                <h5 className="text-sm font-medium text-foreground mb-2">📝 ขั้นตอน:</h5>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-muted">
                                  {tc.steps.map((step, idx) => (
                                    <li key={idx}>{step}</li>
                                  ))}
                                </ol>
                              </div>

                              {/* Expected Result */}
                              <div>
                                <h5 className="text-sm font-medium text-foreground mb-2">✅ ผลลัพธ์ที่คาดหวัง:</h5>
                                <p className="text-sm text-emerald-400">{tc.expectedResult}</p>
                              </div>

                              {/* Notes */}
                              <div>
                                <h5 className="text-sm font-medium text-foreground mb-2">📌 บันทึก:</h5>
                                {tc.notes ? (
                                  <p className="text-sm text-muted bg-card p-2 rounded">{tc.notes}</p>
                                ) : (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={noteInput}
                                      onChange={(e) => setNoteInput(e.target.value)}
                                      placeholder="เพิ่มบันทึก..."
                                      className="flex-1 bg-card border border-border rounded px-3 py-2 text-sm text-foreground"
                                    />
                                    <button
                                      onClick={() => handleSaveNote(tc.id)}
                                      className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded text-sm hover:bg-purple-500/30"
                                    >
                                      บันทึก
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Tested At */}
                              {tc.testedAt && (
                                <div className="text-xs text-muted">
                                  ทดสอบเมื่อ: {new Date(tc.testedAt).toLocaleString('th-TH')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="fixed bottom-4 right-4">
        <AnimatedCard className="p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">🚀 Quick Links</h4>
          <div className="space-y-2 text-sm">
            <a href="/customer" target="_blank" className="block text-cyan-400 hover:underline">
              → หน้าลูกค้า
            </a>
            <a href="/backend" target="_blank" className="block text-purple-400 hover:underline">
              → หน้า Backend
            </a>
            <a href="/time-booking" target="_blank" className="block text-emerald-400 hover:underline">
              → หน้าจองล่วงหน้า
            </a>
          </div>
        </AnimatedCard>
      </section>
    </div>
  );
}
