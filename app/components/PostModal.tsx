'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Post, PostsPage } from '@/lib/types';
import { useMemo } from 'react';

interface PostModalProps {
  slug: string;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}

export default function PostModal({ slug, onClose, onNavigate }: PostModalProps) {
  const queryClient = useQueryClient();

  // 1. GET DATA FROM CACHE (Instant)
  const cachedData = useMemo(() => {
    const postsData = queryClient.getQueryData(['posts']) as { 
      pages: PostsPage[] 
    } | undefined;
    
    return postsData?.pages
      ?.flatMap((p) => p.items)
      ?.find((item) => item.slug === slug);
  }, [queryClient, slug]);

  // 2. FETCH FULL DETAILS (Background)
  const { data: fullPost, isFetching } = useQuery<Post>({
    queryKey: ['post', slug],
    queryFn: async () => {
      console.log('🔄 Fetching post:', slug);
      const res = await fetch(`/api/post/${slug}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      const data = await res.json();
      console.log('✅ Post fetched:', data.slug, 'Related:', data.relatedPosts?.length);
      return data;
    },
    placeholderData: cachedData ?? undefined,
  });

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="max-w-4xl mx-auto py-10 px-4 min-h-screen"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-black hover:text-black mb-6 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feed
        </button>

        <article className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  🎭 Modal View
                </span>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  ⚡ Instant Cache
                </span>
                {isFetching && (
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full animate-pulse">
                    🔄 Loading Details...
                  </span>
                )}
              </div>
              <h1 className="text-5xl font-bold mb-4 text-black leading-tight">
                {fullPost?.title || 'Loading...'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-black">
                {fullPost?.author && <span className="font-medium">By {fullPost.author}</span>}
                {fullPost?.publishedAt && (
                  <span>
                    {new Date(fullPost.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>

            <img 
              src={fullPost?.thumbnail} 
              alt={fullPost?.title}
              className="w-full h-96 object-cover rounded-lg mb-8 shadow-md" 
            />

            <div className="text-black text-xl leading-relaxed mb-8">
              {fullPost?.shortDesc}
            </div>

            {fullPost?.content && (
              <div 
                className="prose prose-lg max-w-none prose-headings:text-black prose-p:text-black prose-li:text-black"
                dangerouslySetInnerHTML={{ __html: fullPost.content }}
              />
            )}

            <div className="mt-12 border-t pt-8">
              <h3 className="font-bold text-2xl mb-6 text-black">Related Posts</h3>
              {!fullPost?.relatedPosts || fullPost.relatedPosts.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="w-full h-32 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fullPost.relatedPosts.map((related) => (
                    <button
                      key={related.id}
                      onClick={() => onNavigate(related.slug)}
                      className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow text-left w-full"
                    >
                      <img 
                        src={related.thumbnail} 
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={related.title}
                      />
                      <div className="p-3">
                        <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-700 transition-colors">
                          {related.title}
                        </h4>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>
    </div>
  );
}