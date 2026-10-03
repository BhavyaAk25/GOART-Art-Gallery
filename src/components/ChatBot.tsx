import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Painting } from '../data/paintings'

type Message = { role: 'user' | 'assistant'; content: string; error?: boolean }
type Thread = { paintingId: string; messages: Message[] }

type Props = { painting: Painting }

const SUGGESTED_QUESTIONS = [
  'What technique did the artist use?',
  'What was happening when this was made?',
  'What should I look for in this work?',
  'Tell me about the artist',
]

async function askGuide(paintingId: string, messages: Message[]): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paintingId,
      messages: messages.filter((m) => !m.error).map(({ role, content }) => ({ role, content })),
    }),
  })
  const data = (await response.json().catch(() => ({}))) as { reply?: string; error?: string }
  if (!response.ok || !data.reply) {
    throw new Error(data.error ?? 'The guide could not answer right now. Please try again.')
  }
  return data.reply
}

function ChatBot({ painting }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [thread, setThread] = useState<Thread>({ paintingId: painting.id, messages: [] })
  const [input, setInput] = useState('')
  const [pendingFor, setPendingFor] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Each painting gets its own fresh conversation.
  const messages = thread.paintingId === painting.id ? thread.messages : []
  const isLoading = pendingFor === painting.id

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, isLoading])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || isLoading) return
    const paintingId = painting.id
    const history: Message[] = [...messages, { role: 'user', content: question }]
    setThread({ paintingId, messages: history })
    setInput('')
    setPendingFor(paintingId)

    let reply: Message
    try {
      reply = { role: 'assistant', content: await askGuide(paintingId, history) }
    } catch (error) {
      reply = { role: 'assistant', content: (error as Error).message, error: true }
    }
    // Ignore the answer if the visitor has moved on to another painting.
    setThread((current) =>
      current.paintingId === paintingId ? { paintingId, messages: [...current.messages, reply] } : current,
    )
    setPendingFor((current) => (current === paintingId ? null : current))
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-ink-900 px-4 text-sand-50 shadow-card transition hover:bg-ink-700 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 sm:bottom-6 sm:right-6"
        aria-label={isOpen ? 'Close the art guide' : 'Ask the art guide about this painting'}
        aria-expanded={isOpen}
        aria-controls="art-guide"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
              <path
                d="M12 3C7.03 3 3 6.58 3 11c0 2.52 1.33 4.76 3.4 6.22L5 21l4.29-2.14c.87.22 1.78.34 2.71.34 4.97 0 9-3.58 9-8s-4.03-8-9-8z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="8" cy="11" r="1" fill="currentColor" />
              <circle cx="12" cy="11" r="1" fill="currentColor" />
              <circle cx="16" cy="11" r="1" fill="currentColor" />
            </svg>
            <span className="hidden text-sm font-semibold sm:inline">Ask the guide</span>
          </>
        )}
      </button>

      {isOpen && (
        <section
          id="art-guide"
          aria-label="Art guide chat"
          className="fixed bottom-20 left-3 right-3 z-40 mx-auto flex max-h-[70dvh] max-w-md flex-col overflow-hidden rounded-2xl bg-sand-50 shadow-2xl ring-1 ring-ink-900/10 sm:bottom-24 sm:left-auto sm:right-6 sm:w-96"
        >
          <header className="bg-ink-900 px-4 py-3 text-sand-50">
            <h2 className="text-sm font-semibold">Art Guide</h2>
            <p className="truncate text-xs text-sand-200">
              {painting.title} · {painting.artist}
            </p>
          </header>

          <div className="min-h-[12rem] flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-ink-700">
                  Hi! Ask me anything about this work by {painting.artist}.
                </p>
                <div className="space-y-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void send(q)}
                      className="block w-full rounded-lg bg-sand-100 px-3 py-2 text-left text-xs text-ink-800 transition hover:bg-sand-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-ink-900 text-sand-50'
                        : msg.error
                          ? 'bg-red-50 text-red-900 ring-1 ring-red-200'
                          : 'bg-sand-200 text-ink-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start" role="status" aria-label="The guide is typing">
                <div className="flex gap-1 rounded-2xl bg-sand-200 px-4 py-3">
                  {[0, 0.15, 0.3].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-700/70"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={onSubmit} className="flex gap-2 border-t border-ink-900/10 p-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this painting…"
              maxLength={600}
              aria-label="Your question"
              className="min-w-0 flex-1 rounded-full bg-sand-100 px-4 py-2 text-sm text-ink-900 placeholder-ink-700/50 outline-none focus:ring-2 focus:ring-ink-900/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sand-50 transition hover:bg-ink-700 disabled:opacity-40"
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </section>
      )}
    </>
  )
}

export default ChatBot
