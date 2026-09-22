// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, ThumbsUp, ThumbsDown, Clock, Users, BookOpen, DollarSign, Home, Shield, Briefcase, Stethoscope, PiggyBank } from 'lucide-react';
import { PageInsights } from "@/components/PageInsights";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  postCount: number;
  lastActivity: string;
}

interface Thread {
  id: string;
  title: string;
  author: string;
  specialty: string;
  categoryId: string;
  replies: number;
  lastReply: string;
  posts: Post[];
}

interface Post {
  id: string;
  content: string;
  author: string;
  specialty: string;
  upvotes: number;
  downvotes: number;
  timestamp: string;
}

const categories: Category[] = [
  { id: 'loans', name: 'Student Loans & PSLF', description: 'Discuss loan repayment and forgiveness', icon: BookOpen, postCount: 42, lastActivity: '2h ago' },
  { id: 'tax', name: 'Tax Strategies', description: 'Tax planning for physicians', icon: DollarSign, postCount: 18, lastActivity: '1d ago' },
  { id: 'retirement', name: 'Retirement Planning', description: 'Secure your financial future', icon: PiggyBank, postCount: 25, lastActivity: '5h ago' },
  { id: 'insurance', name: 'Insurance & Disability', description: 'Protecting income and assets', icon: Shield, postCount: 12, lastActivity: '3d ago' },
  { id: 'realestate', name: 'Real Estate', description: 'Investing in property as a physician', icon: Home, postCount: 30, lastActivity: '1h ago' },
  { id: 'contracts', name: 'Contract Negotiation', description: 'Navigating employment terms', icon: Briefcase, postCount: 15, lastActivity: '2d ago' },
  { id: 'specialty', name: 'Specialty-Specific', description: 'Financial topics by specialty', icon: Stethoscope, postCount: 50, lastActivity: '30m ago' },
  { id: 'general', name: 'General Financial', description: 'Broad financial discussions', icon: DollarSign, postCount: 38, lastActivity: '4h ago' },
];

const initialThreads: Thread[] = [
  { id: 't1', title: 'Best PSLF servicers for 2023?', author: 'Dr. Smith', specialty: 'Cardiology', categoryId: 'loans', replies: 8, lastReply: '1h ago', posts: [] },
  { id: 't2', title: 'Tax deductions for private practice', author: 'Dr. Jones', specialty: 'Orthopedics', categoryId: 'tax', replies: 5, lastReply: '3h ago', posts: [] },
];

const PhysicianForum: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [searchTerm, setSearchTerm] = useState('');
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState(categories[0].id);

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (!activeCategory || t.categoryId === activeCategory)
  );

  const handleNewThread = () => {
    if (newThreadTitle) {
      const newThread: Thread = {
        id: `t${threads.length + 1}`,
        title: newThreadTitle,
        author: 'Dr. User',
        specialty: 'Internal Medicine',
        categoryId: newThreadCategory,
        replies: 0,
        lastReply: 'Just now',
        posts: [],
      };
      setThreads([...threads, newThread]);
      setNewThreadTitle('');
      setNewThreadOpen(false);
      setActiveCategory(newThreadCategory);
    }
  };

  const handleVote = (threadId: string, postId: string, type: 'up' | 'down') => {
    setThreads(threads.map(t => {
      if (t.id === threadId) {
        const updatedPosts = t.posts.map(p => {
          if (p.id === postId) {
            return type === 'up' 
              ? { ...p, upvotes: p.upvotes + 1 } 
              : { ...p, downvotes: p.downvotes + 1 };
          }
          return p;
        });
        return { ...t, posts: updatedPosts };
      }
      return t;
    }));
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-[#94a3b8] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <MessageSquare className="text-green-500" /> Grand Rounds Discussion
        </h1>
        <Input 
          placeholder="Search forum topics..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="mb-6 bg-[#0d1526] border-[#1e3a5f] text-white focus:ring-green-500"
        />

        {!activeCategory && !activeThread && (
          <Card className="bg-[#0d1526] border-[#1e3a5f] mb-6">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Users className="text-green-500" /> Physician Lounge
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(cat => (
                <Card key={cat.id} className="bg-slate-700 border-[#1e3a5f] cursor-pointer hover:border-green-500" onClick={() => setActiveCategory(cat.id)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center gap-2">
                      <cat.icon className="text-green-500" /> {cat.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#94a3b8] text-sm">{cat.description}</p>
                    <div className="flex justify-between text-xs text-[#7a95b8] mt-2">
                      <span>Posts: {cat.postCount}</span>
                      <span>Last: {cat.lastActivity}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {activeCategory && !activeThread && (
          <div>
            <Button variant="outline" onClick={() => setActiveCategory(null)} className="mb-4 text-green-500 border-green-500 hover:bg-green-500 hover:text-white">
              Back to Categories
            </Button>
            <Dialog open={newThreadOpen} onOpenChange={setNewThreadOpen}>
              <DialogTrigger asChild>
                <Button className="mb-4 ml-2 bg-green-600 hover:bg-green-700">New Thread</Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0d1526] border-[#1e3a5f]">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Thread</DialogTitle>
                </DialogHeader>
                <Input value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} placeholder="Thread Title" className="bg-slate-700 text-white mb-4" />
                <select value={newThreadCategory} onChange={e => setNewThreadCategory(e.target.value)} className="bg-slate-700 text-white p-2 rounded-md mb-4 w-full">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <textarea placeholder="Your post..." className="bg-slate-700 text-white p-2 rounded-md mb-4 w-full h-32" />
                <Button onClick={handleNewThread} className="bg-green-600 hover:bg-green-700">Post Thread</Button>
              </DialogContent>
            </Dialog>
            <Card className="bg-[#0d1526] border-[#1e3a5f]">
              <CardContent className="p-0">
                {filteredThreads.map(thread => (
                  <div key={thread.id} className="p-4 border-b border-[#1e3a5f] hover:bg-[#162a4a] cursor-pointer" onClick={() => setActiveThread(thread)}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-medium">{thread.title}</h3>
                      <div className="flex items-center gap-2 text-[#7a95b8] text-sm">
                        <span className="flex items-center gap-1"><MessageSquare size={16} /> {thread.replies}</span>
                        <span className="flex items-center gap-1"><Clock size={16} /> {thread.lastReply}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#7a95b8] text-xs">by {thread.author}</span>
                      <Badge variant="outline" className="text-green-500 border-green-500">{thread.specialty}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeThread && (
          <div>
            <Button variant="outline" onClick={() => setActiveThread(null)} className="mb-4 text-green-500 border-green-500 hover:bg-green-500 hover:text-white">
              Back to Threads
            </Button>
            <Card className="bg-[#0d1526] border-[#1e3a5f]">
              <CardHeader>
                <CardTitle className="text-white">{activeThread.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-[#7a95b8] text-sm">by {activeThread.author}</span>
                  <Badge variant="outline" className="text-green-500 border-green-500">{activeThread.specialty}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {activeThread.posts.map(post => (
                  <div key={post.id} className="p-4 border-b border-[#1e3a5f]">
                    <p className="text-[#94a3b8]">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-[#7a95b8] text-sm">
                      <Button size="sm" variant="ghost" onClick={() => handleVote(activeThread.id, post.id, 'up')} className="text-green-500"><ThumbsUp size={16} /> {post.upvotes}</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleVote(activeThread.id, post.id, 'down')} className="text-red-500"><ThumbsDown size={16} /> {post.downvotes}</Button>
                      <span>{post.timestamp}</span>
                    </div>
                  </div>
                ))}
                <Button className="mt-4 bg-green-600 hover:bg-green-700">Reply</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <PageInsights section="physician-forum" />
    </div>
  );
};

export default PhysicianForum;