'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Post, PostsPage } from '@/lib/types';
import { useEffect, useMemo, use } from 'react';

export default function InterceptedPostModal({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Unwrap params INSTANTLY during render (not in useEffect!)
  const { slug } = use(params);

  // 1. GET DATA FROM CACHE (Instant)
  // We search the 'posts' cache for an item that matches this slug
  // This data exists because the user just saw it on the List Page!
  const cachedData = useMemo(() => {
    const postsData = queryClient.getQueryData(['posts']) as { 
      pages: PostsPage[] 
    } | undefined;
    
    return postsData?.pages
      ?.flatMap((p) => p.items)
      ?.find((item) => item.slug === slug);
  }, [queryClient, slug]);

  // 2. FETCH FULL DETAILS (Background)
  // This fetches the full body, related cards, etc.
  const { data: fullPost, isLoading } = useQuery<Post>({
    queryKey: ['post', slug],
    queryFn: async () => {
      const res = await fetch(`/api/post/${slug}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      return res.json();
    },
    initialData: cachedData ?? undefined, // <--- CRITICAL: Uses list data until full data arrives
  });

  // Handle Modal Close (Browser Back works automatically)
  const onDismiss = () => router.back();

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto p-4"
      onClick={onDismiss}
    >
      <div 
        className="bg-white max-w-4xl w-full my-8 rounded-xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onDismiss} 
          className="sticky top-4 float-right mr-4 mt-4 z-10 w-10 h-10 flex items-center justify-center text-black hover:text-black bg-white/90 backdrop-blur rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* INSTANTLY VISIBLE PART (From Cache) */}
        <div className="p-8 pt-16">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-green-100 text-black text-xs font-semibold rounded-full mb-4">
              ⚡ Instant Load from Cache
            </span>
            <h1 className="text-4xl font-bold text-black leading-tight">
              {fullPost?.title || 'Loading...'}
            </h1>
            <div className="flex items-center gap-4 mt-4 text-sm text-black">
              {fullPost?.author && <span>By {fullPost.author}</span>}
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
          
          {fullPost?.thumbnail && (
            <img 
              src={fullPost.thumbnail} 
              alt={fullPost.title}
              className="w-full h-96 object-cover rounded-lg shadow-md mb-8" 
            />
          )}
          
          <div className="text-black text-lg leading-relaxed mb-4">
            {fullPost?.shortDesc}
          </div>
          
          {/* LOADING PART (Waiting for API) */}
          {isLoading ? (
            <div className="animate-pulse space-y-4 mt-8 border-t pt-8">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : (
            <>
              {/* Full Content loaded from API */}
              {fullPost?.content && (
                <div 
                  className="prose prose-lg max-w-none mt-8 border-t pt-8 prose-headings:text-black prose-p:text-black prose-li:text-black"
                  dangerouslySetInnerHTML={{ __html: fullPost.content }} 
                />
              )}
              
              {/* Related Cards */}
              {fullPost?.relatedPosts && fullPost.relatedPosts.length > 0 && (
                <div className="mt-12 border-t pt-8">
                  <h3 className="font-bold text-2xl mb-6 text-black">Related Posts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {fullPost.relatedPosts.map((related: Post) => (
                      <a
                        key={related.id}
                        href={`/post/${related.slug}`}
                        className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <img 
                          src={related.thumbnail} 
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                          alt={related.title}
                        />
                        <div className="p-3">
                          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-black">
                            {related.title}
                          </h4>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
