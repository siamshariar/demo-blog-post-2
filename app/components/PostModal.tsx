'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Post, PostsPage } from '@/lib/types';
import { useMemo, useEffect, useRef } from 'react';
import PostContainer from '@/app/components/PostContainer';

interface PostModalProps {
  slug: string;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}

export default function PostModal({ slug, onClose, onNavigate }: PostModalProps) {
  const queryClient = useQueryClient();
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const originalMetadataRef = useRef<{
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  } | null>(null);

  // Lock body scroll when modal is open - preserve scroll position
  useEffect(() => {
    // Add class for instant scroll
    document.documentElement.classList.add('modal-opening');
    
    // Save original metadata
    originalMetadataRef.current = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
    };
    
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Prevent layout shift by compensating for scrollbar
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.documentElement.classList.remove('modal-opening');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
      
      // Restore original metadata
      if (originalMetadataRef.current) {
        document.title = originalMetadataRef.current.title;
        updateMetaTag('name', 'description', originalMetadataRef.current.description);
        updateMetaTag('property', 'og:title', originalMetadataRef.current.ogTitle);
        updateMetaTag('property', 'og:description', originalMetadataRef.current.ogDescription);
        updateMetaTag('property', 'og:image', originalMetadataRef.current.ogImage);
      }
      // Don't restore scroll here - parent component handles it
    };
  }, []);

  // Scroll modal to top when slug changes (related post clicked)
  useEffect(() => {
    if (modalContainerRef.current) {
      modalContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [slug]);

  // Helper function to update meta tags
  const updateMetaTag = (attr: string, key: string, content: string) => {
    let element = document.querySelector(`meta[${attr}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

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
    initialData: cachedData,
    staleTime: 5 * 60 * 1000,
  });

  // Update metadata when post data loads
  useEffect(() => {
    if (fullPost) {
      // Update document title
      document.title = `${fullPost.title} | Blog`;
      
      // Update meta description
      updateMetaTag('name', 'description', fullPost.shortDesc || '');
      
      // Update Open Graph tags for social sharing
      updateMetaTag('property', 'og:title', fullPost.title);
      updateMetaTag('property', 'og:description', fullPost.shortDesc || '');
      updateMetaTag('property', 'og:image', fullPost.thumbnail);
      updateMetaTag('property', 'og:url', `${window.location.origin}/post/${fullPost.slug}`);
      updateMetaTag('property', 'og:type', 'article');
      
      // Update Twitter Card tags
      updateMetaTag('name', 'twitter:card', 'summary_large_image');
      updateMetaTag('name', 'twitter:title', fullPost.title);
      updateMetaTag('name', 'twitter:description', fullPost.shortDesc || '');
      updateMetaTag('name', 'twitter:image', fullPost.thumbnail);
    }
  }, [fullPost]);

  return (
    <div 
      ref={modalContainerRef}
      data-modal-open="true"
      className="modal-container fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-50 overflow-y-auto"
    >
      <PostContainer header={
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-black hover:text-black mb-6 group cursor-pointer"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      }>
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
              {isFetching && (!fullPost?.relatedPosts || fullPost.relatedPosts.length === 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg overflow-hidden animate-pulse">
                      <div className="w-full h-32 bg-gray-200"></div>
                      <div className="p-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !fullPost?.relatedPosts || fullPost.relatedPosts.length === 0 ? (
                <p className="text-gray-500">No related posts available.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fullPost.relatedPosts
                    .filter(related => related.slug !== slug)
                    .map((related) => (
                    <button
                      key={related.id}
                      onClick={() => onNavigate(related.slug)}
                      className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow text-left w-full cursor-pointer"
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
      </PostContainer>
    </div>
  );
}