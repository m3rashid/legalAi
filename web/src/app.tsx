import { useState, type ChangeEvent, type FormEvent } from "react";
import { Upload, FileText, MessageCircle, Download, Bot, User, CheckCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fillDocument, generateDocument, uploadFile } from "@/apis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState<{ type: "user" | "bot"; message: string }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const progress = placeholders.length > 0 ? ((currentIndex + (isComplete ? 1 : 0)) / placeholders.length) * 100 : 0;

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      const { sessionId, placeholders } = await uploadFile(file);

      setSessionId(sessionId);
      setPlaceholders(placeholders);
      setChatHistory([
        {
          type: "bot",
          message: `Perfect! I've analyzed your document and found ${placeholders.length} fields that need to be filled. Let's go through them one by one.`,
        },
      ]);
      setCurrentIndex(0);
      setIsComplete(false);
    } catch (err: any) {
      setError(err.message || "Failed to upload and process file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnswerSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentAnswer.trim()) return;
    if (!sessionId) throw new Error("No session ID");

    // Add user answer to chat
    setChatHistory((prev) => [...prev, { type: "user", message: currentAnswer }]);

    try {
      // Send answer to backend
      await fillDocument(sessionId, placeholders[currentIndex], currentAnswer);

      setCurrentAnswer("");

      // Move to next question or complete
      if (currentIndex < placeholders.length - 1) setCurrentIndex(currentIndex + 1);
      else {
        setIsComplete(true);
        setChatHistory((prev) => [
          ...prev,
          {
            type: "bot",
            message: "Excellent! All fields have been completed. Your document is ready to be generated.",
          },
        ]);
      }
    } catch (err: any) {
      setError("Failed to save your answer. Please try again.");
    }
  };

  const handleGenerateDocument = async () => {
    setIsGenerating(true);
    try {
      if (!sessionId) throw new Error("No session ID");

      const response = await generateDocument(sessionId);

      const url = window.URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "completed_document.docx");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      // Reset state for a new document
      setSessionId(null);
      setPlaceholders([]);
      setChatHistory([]);
      setCurrentIndex(0);
      setIsComplete(false);
    } catch (err: any) {
      setError("Failed to generate the document.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getCurrentQuestion = () => {
    if (!placeholders || placeholders.length === 0) return "";
    const placeholder = placeholders[currentIndex];
    // Make the question more human-friendly
    let question = placeholder.replace(/[\]$_]/g, " ").trim();
    question = question.charAt(0).toUpperCase() + question.slice(1);
    return `What should I put for "${question}"?`;
  };

  const formatPlaceholder = (placeholder: string) => {
    return placeholder.replace(/[\]$_]/g, " ").trim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Legal Document Assistant</h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload your Word document template and I'll help you fill in all the required information through a simple
            conversation.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* File Upload Section */}
        {!sessionId && (
          <Card className="mb-8 border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-slate-700">
                <Upload className="h-5 w-5" />
                Upload Your Document
              </CardTitle>
              <CardDescription>Choose a .docx file with placeholders like [Company Name] or $[_____]</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="relative">
                <Input
                  type="file"
                  accept=".docx"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="cursor-pointer h-16 text-lg border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md">
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span>Processing document...</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Chat Interface */}
        {sessionId && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Progress Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Completion</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Fields to Fill ({placeholders.length})</h4>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {placeholders.map((placeholder, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded-lg text-sm ${
                              index < currentIndex
                                ? "bg-green-100 text-green-800"
                                : index === currentIndex && !isComplete
                                ? "bg-blue-100 text-blue-800 ring-2 ring-blue-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {index < currentIndex ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : index === currentIndex && !isComplete ? (
                                <MessageCircle className="h-4 w-4 text-blue-600" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                              )}
                              <span className="truncate">{formatPlaceholder(placeholder)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Document Assistant
                  </CardTitle>
                  <CardDescription>I'll help you fill in each field step by step</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Chat History */}
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {chatHistory.map((entry, index) => (
                        <div
                          key={index}
                          className={`flex gap-3 ${entry.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {entry.type === "bot" && (
                            <Avatar className="h-8 w-8 bg-blue-600">
                              <AvatarFallback>
                                <Bot className="h-4 w-4 text-white" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              entry.type === "user" ? "bg-blue-600 text-white ml-auto" : "bg-slate-100 text-slate-900"
                            }`}
                          >
                            {entry.message}
                          </div>
                          {entry.type === "user" && (
                            <Avatar className="h-8 w-8 bg-slate-600">
                              <AvatarFallback>
                                <User className="h-4 w-4 text-white" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {/* Current Question */}
                      {!isComplete && placeholders.length > 0 && (
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8 bg-blue-600">
                            <AvatarFallback>
                              <Bot className="h-4 w-4 text-white" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-slate-100 text-slate-900 p-3 rounded-lg max-w-[80%]">
                            {getCurrentQuestion()}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-6 border-t">
                    {!isComplete ? (
                      <form onSubmit={handleAnswerSubmit} className="flex gap-2">
                        <Input
                          type="text"
                          value={currentAnswer}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          className="flex-1"
                          autoFocus
                        />
                        <Button type="submit" disabled={!currentAnswer.trim()}>
                          Send
                        </Button>
                      </form>
                    ) : (
                      <Button
                        onClick={handleGenerateDocument}
                        disabled={isGenerating}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating Document...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download Completed Document
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
