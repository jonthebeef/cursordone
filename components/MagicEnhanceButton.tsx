import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Wand2, Send } from 'lucide-react'
import { DeepseekAPI } from '@/lib/ai/deepseek'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { MarkdownPreview } from '@/components/ui/markdown-preview'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface MagicEnhanceProps {
  fieldId: string
  currentContent: string
  onEnhancement: (enhanced: string) => void
  context?: {
    relatedTasks?: string[]
    epic?: string
    tags?: string[]
    userRequest?: string
  }
}

export function MagicEnhanceButton({
  fieldId,
  currentContent,
  onEnhancement,
  context
}: MagicEnhanceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [enhancedContent, setEnhancedContent] = useState("")
  const [changes, setChanges] = useState<Array<{ type: string, description: string }>>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [streamingContent, setStreamingContent] = useState("")
  const { toast } = useToast()
  const api = new DeepseekAPI()

  const handleEnhance = async () => {
    if (!currentContent.trim()) {
      toast({
        title: "Nothing to enhance",
        description: "Please add some content first.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setStreamingContent("")
    try {
      const result = await api.enhanceContent({
        content: currentContent,
        context,
        onProgress: (chunk) => {
          setStreamingContent(prev => prev + chunk)
        }
      })

      setEnhancedContent(result.enhanced)
      setChanges(result.changes)
      setMessages([{
        role: 'assistant',
        content: "I've enhanced the content. Let me know if you'd like any further adjustments!"
      }])
      setShowPreview(true)
    } catch (error) {
      console.error('Enhancement error:', error)
      toast({
        title: "Enhancement failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setStreamingContent("")
    }
  }

  const handleAccept = () => {
    onEnhancement(enhancedContent)
    setShowPreview(false)
    setMessages([])
    toast({
      title: "Changes applied",
      description: (
        <div className="mt-2 space-y-2">
          {changes.map((change, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{change.type}:</span> {change.description}
            </div>
          ))}
        </div>
      ),
    })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = inputMessage
    setInputMessage("")
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    setIsLoading(true)
    try {
      const result = await api.enhanceContent({
        content: enhancedContent,
        context: {
          ...context,
          userRequest: userMessage
        }
      })

      setEnhancedContent(result.enhanced)
      setChanges(prev => [...prev, ...result.changes])
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I've made those adjustments. How does this look now?" 
      }])
    } catch (error) {
      console.error('Enhancement error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I had trouble making those changes. Could you try rephrasing your request?" 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleEnhance}
        disabled={isLoading}
        title="Enhance content with AI"
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="h-4 w-4" />
        )}
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col z-[100]">
          <DialogHeader>
            <DialogTitle>Review AI Enhancements</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 flex gap-4">
            {/* Left side: Preview */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-4">
              <Accordion type="single" collapsible defaultValue="changes">
                <AccordionItem value="changes" className="border-zinc-800">
                  <AccordionTrigger className="text-sm font-medium text-zinc-400 hover:text-zinc-300 hover:no-underline">
                    Changes Made
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 bg-zinc-900/50 border border-zinc-800 rounded-md p-3">
                      {changes.map((change, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium capitalize">{change.type}:</span>{' '}
                          {change.description}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-400">Preview:</h3>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-3">
                  <MarkdownPreview content={streamingContent || enhancedContent} />
                </div>
              </div>
            </div>

            {/* Right side: Chat */}
            <div className="w-96 flex flex-col border-l border-zinc-800 pl-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Discuss Changes</h3>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[80%] ${
                        msg.role === 'assistant'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && !streamingContent && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full bg-zinc-400 animate-bounce",
                          "animation-delay-0"
                        )} />
                        <div className={cn(
                          "w-2 h-2 rounded-full bg-zinc-400 animate-bounce",
                          "animation-delay-[200ms]"
                        )} />
                        <div className={cn(
                          "w-2 h-2 rounded-full bg-zinc-400 animate-bounce",
                          "animation-delay-[400ms]"
                        )} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Request changes... (⌘+Enter to send)"
                  className="flex-1 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 min-h-[80px] resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPreview(false)
                setMessages([])
              }}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50"
            >
              Reject
            </Button>
            <Button
              onClick={handleAccept}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Accept Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 