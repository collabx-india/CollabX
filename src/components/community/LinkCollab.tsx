import React, { useState } from 'react';
import { LinkCollabPost } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { 
  ThumbsUp, 
  Send, 
  Sparkles, 
  PlusCircle, 
  Shield, 
  Award,
  Filter
} from 'lucide-react';

const COMMUNITY_TAGS = [
  'All',
  'Water',
  'Civil',
  'IoT',
  'Disaster Management',
  'Agriculture',
  'Healthcare',
  'Education'
];

export const LinkCollab: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useAccessibility();

  const [posts, setPosts] = useState<LinkCollabPost[]>(() => storageService.getPosts());
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState<string[]>(['Water', 'IoT']);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const filteredPosts = posts.filter(post => {
    if (selectedTag === 'All') return true;
    return post.tags.includes(selectedTag);
  });

  const handleUpvote = (postId: string) => {
    const target = posts.find(p => p.id === postId);
    if (target) {
      target.upvotes += 1;
      storageService.savePost(target);
      setPosts([...storageService.getPosts()]);
    }
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const target = posts.find(p => p.id === postId);
    if (target) {
      const isExpert = currentUser.role === 'expert' || currentUser.role === 'professor' || currentUser.role === 'industry';
      target.comments.push({
        id: `c-${Date.now()}`,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        content: text,
        isExpertAnswer: isExpert,
        createdAt: new Date().toISOString(),
      });
      target.commentsCount = target.comments.length;
      storageService.savePost(target);
      setPosts([...storageService.getPosts()]);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    }
  };

  const handleConvertToProjectIdea = (postId: string) => {
    const target = posts.find(p => p.id === postId);
    if (target) {
      target.hasProjectConversionBadge = true;
      storageService.savePost(target);
      setPosts([...storageService.getPosts()]);

      // Add notification for University & Govt
      storageService.addNotification({
        id: `notif-${Date.now()}`,
        title: 'Community Idea Flagged for Formal Project Conversion',
        message: `Thread "${target.title.slice(0, 40)}..." has been earmarked for university proposal drafting.`,
        type: 'info',
        timestamp: 'Just now',
        read: false,
      });

      alert(
        'Flagged for Formal Project Idea! This thread is now marked with an official GovTech endorsement badge. University faculty can import this into their Challenge proposals.'
      );
    }
  };

  const handleCreateNewPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPost: LinkCollabPost = {
      id: `post-${Date.now()}`,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorOrg: currentUser.organization || 'Jharkhand GovTech Participant',
      title: newTitle,
      content: newContent,
      tags: newTags,
      upvotes: 1,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      comments: [],
    };

    storageService.savePost(newPost);
    setPosts(storageService.getPosts());
    setNewTitle('');
    setNewContent('');
    setIsCreatingPost(false);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-lg border border-gov-border shadow-gov flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-gov-blue" />
            <h2 className="text-lg font-bold text-gov-navy">
              {t('Advisory & Stakeholder Dialogue', 'सलाहकार एवं हितधारक संवाद')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              'A cross-sector exchange where Citizens, Students, Professors, Industry & Experts share practical advice and convert real problems into project ideas.',
              'नागरिक, विद्यार्थी, प्राध्यापक और उद्योग विशेषज्ञ यहाँ तकनीकी परामर्श एवं समाधान साझा करते हैं।'
            )}
          </p>
        </div>

        <button
          onClick={() => setIsCreatingPost(prev => !prev)}
          className="px-4 py-2 bg-gov-navy hover:bg-gov-navy-dark text-white rounded text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isCreatingPost ? t('Close Post Form', 'बंद करें') : t('Post Query / Idea', 'नया विचार / प्रश्न पूछें')}</span>
        </button>
      </div>

      {/* Create New Post Form */}
      {isCreatingPost && (
        <form onSubmit={handleCreateNewPost} className="bg-white rounded-lg border border-gov-border shadow-gov p-4 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-gov-navy">{t('Share an Idea, Query, or Technical Doubt', 'नया विचार अथवा तकनीकी प्रश्न')}</h3>
            <p className="text-xs text-slate-500">Posting as: <span className="font-semibold text-slate-700">{currentUser.name} ({currentUser.subRole || currentUser.role})</span></p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Core Problem</label>
            <input
              type="text"
              required
              placeholder="e.g. Need guidance for low-cost rural drainage desilting in Ranchi"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full p-2 text-xs border border-slate-300 rounded focus:border-gov-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
            <textarea
              required
              rows={3}
              placeholder="Explain the context, engineering constraints, or specific assistance needed..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="w-full p-2 text-xs border border-slate-300 rounded focus:border-gov-blue leading-relaxed"
            ></textarea>
          </div>

          {/* Tag Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select GovTech Domain Tags</label>
            <div className="flex flex-wrap gap-2">
              {['Water', 'Civil', 'IoT', 'Disaster Management', 'Agriculture'].map(tag => {
                const isSelected = newTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => {
                      if (isSelected) {
                        setNewTags(newTags.filter(t => t !== tag));
                      } else {
                        setNewTags([...newTags, tag]);
                      }
                    }}
                    className={`px-2.5 py-1 text-xs rounded border transition ${
                      isSelected
                        ? 'bg-gov-blue text-white border-gov-blue font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreatingPost(false)}
              className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-gov-navy text-white text-xs font-bold rounded hover:bg-gov-navy-dark"
            >
              Publish Post
            </button>
          </div>
        </form>
      )}

      {/* Domain Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 font-semibold flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>{t('Domain:', 'डोमेन:')}</span>
        </span>
        {COMMUNITY_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1 text-xs rounded border transition ${
              selectedTag === tag
                ? 'bg-gov-navy text-white border-gov-navy font-bold'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {tag === 'All' ? t('All Domains', 'सभी डोमेन') : `#${tag}`}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.map(post => (
          <div
            key={post.id}
            className="bg-white rounded-lg border border-gov-border shadow-gov p-4 sm:p-5 space-y-4"
          >
            {/* Post Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-gov-navy flex items-center justify-center font-bold text-xs">
                  {post.authorName.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>{post.authorName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                      {post.authorRole}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {post.authorOrg} • {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Conversion Badge */}
              {post.hasProjectConversionBadge && (
                <div className="px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-gov-saffron" />
                  <span>{t('Flagged for Formal Project Idea', 'परियोजना विचार के लिए चिन्हित')}</span>
                </div>
              )}
            </div>

            {/* Post Body */}
            <div>
              <h3 className="text-base font-bold text-gov-navy">{post.title}</h3>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-line">
                {post.content}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-blue-50 text-gov-blue text-xs font-semibold border border-blue-100"
                >
                  #{t}
                </span>
              ))}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleUpvote(post.id)}
                  className="px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center space-x-1 transition font-medium"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-gov-blue" />
                  <span>{post.upvotes} {t('Support / Upvote', 'समर्थन')}</span>
                </button>

                <span className="text-slate-500 font-medium">
                  {post.comments.length} {t('Responses', 'उत्तर')}
                </span>
              </div>

              {/* "Convert to Project Idea" button */}
              {!post.hasProjectConversionBadge && (
                <button
                  onClick={() => handleConvertToProjectIdea(post.id)}
                  title="Earmark this community thread to be converted into a formal university proposal"
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-300 hover:border-amber-300 font-semibold flex items-center space-x-1 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-gov-saffron" />
                  <span>{t('Convert to Project Idea', 'प्रोजेक्ट विचार में बदलें')}</span>
                </button>
              )}
            </div>

            {/* Existing Comments / Expert Answers */}
            {post.comments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 bg-slate-50 p-3 rounded">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Technical Responses & Expert Advice:
                </div>

                {post.comments.map(c => (
                  <div
                    key={c.id}
                    className={`p-2.5 rounded text-xs space-y-1 ${
                      c.isExpertAnswer
                        ? 'bg-white border-l-4 border-gov-saffron shadow-sm'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-gov-navy">{c.authorName}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {c.authorRole}
                        </span>
                        {c.isExpertAnswer && (
                          <span className="text-xs font-bold text-gov-saffron bg-amber-50 px-1.5 rounded flex items-center space-x-0.5">
                            <Award className="w-3 h-3" />
                            <span>Expert Response</span>
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 text-xs">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Input */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                placeholder={t('Add a technical suggestion or comment...', 'सुझाव या तकनीकी टिप्पणी लिखें...')}
                value={commentInputs[post.id] || ''}
                onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddComment(post.id);
                }}
                className="flex-1 p-2 text-xs border border-slate-300 rounded focus:border-gov-blue"
              />
              <button
                onClick={() => handleAddComment(post.id)}
                className="p-2 bg-gov-navy text-white rounded hover:bg-gov-navy-dark transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
