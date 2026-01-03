import { useState, useRef, useEffect } from 'react'
import type { Painting } from '../data/paintings'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Props = {
  painting: Painting
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

function ChatBot({ painting }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Reset chat when painting changes
  useEffect(() => {
    setMessages([])
  }, [painting.id])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    const systemPrompt = `You are an expert art historian and guide at a museum. You are helping a visitor learn about a specific painting they are viewing.

CURRENT PAINTING:
- Title: "${painting.title}"
- Artist: ${painting.artist}
- Year: ${painting.year}
- Medium: ${painting.medium}
- Description: ${painting.description}

Your role:
- Answer questions about this specific painting
- Provide historical context, technique analysis, symbolism, and artistic significance
- Share interesting facts about the artist and their style
- Compare with other works when relevant
- Be engaging, educational, and concise (2-3 paragraphs max)
- If asked about something unrelated to art, politely redirect to discussing the painting

Speak in a warm, knowledgeable tone like a friendly museum guide.`

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const data = await response.json()
      const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestedQuestions = [
    'What technique did the artist use?',
    'What is the historical context?',
    'What symbols are in this painting?',
    'Tell me about the artist',
  ]

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-sand-50 shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={isOpen ? 'Close chat' : 'Ask about this painting'}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
            <path
              d="M12 3C7.03 3 3 6.58 3 11c0 2.52 1.33 4.76 3.4 6.22L5 21l4.29-2.14c.87.22 1.78.34 2.71.34 4.97 0 9-3.58 9-8s-4.03-8-9-8z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="8" cy="11" r="1" fill="currentColor" />
            <circle cx="12" cy="11" r="1" fill="currentColor" />
            <circle cx="16" cy="11" r="1" fill="currentColor" />
          </svg>
        )}
      </button>

      {/* Chat Dialog */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 left-4 z-50 mx-auto max-w-md overflow-hidden rounded-2xl bg-sand-50 shadow-2xl ring-1 ring-ink-900/10 sm:left-auto sm:right-6 sm:w-96">
          {/* Header */}
          <div className="border-b border-ink-900/10 bg-ink-900 px-4 py-3 text-sand-50">
            <h3 className="font-semibold">Art Guide</h3>
            <p className="text-xs text-sand-200 truncate">Ask about "{painting.title}"</p>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-ink-700">
                  Hello! I'm your art guide. Ask me anything about this painting by {painting.artist}.
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-ink-700/70">Suggested questions:</p>
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className="block w-full text-left text-xs bg-sand-100 hover:bg-sand-200 rounded-lg px-3 py-2 text-ink-800 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-ink-900 text-sand-50'
                        : 'bg-sand-200 text-ink-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-sand-200 text-ink-900 rounded-2xl px-4 py-2 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-ink-900/10 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about this painting..."
                className="flex-1 rounded-full bg-sand-100 px-4 py-2 text-sm text-ink-900 placeholder-ink-700/50 outline-none focus:ring-2 focus:ring-ink-900/20"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-sand-50 transition hover:bg-ink-800 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot
