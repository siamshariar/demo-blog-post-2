'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState, useRef } from 'react';
import { PostsPage } from '@/lib/types';
import PostModal from './PostModal';

export default function Feed() {
  // Use larger rootMargin for earlier trigger (2000px before reaching the element)
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '2000px',
  });
  const queryClient = useQueryClient();
  const [modalSlug, setModalSlug] = useState<string | null>(null);
  const savedScrollRef = useRef<number>(0);
  
  // Check URL on mount for direct navigation or reload
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/post/')) {
        const slug = path.replace('/post/', '');
        setModalSlug(slug);
      }
    }
  }, []);
  
  // Handle instant modal open (state-based, no navigation)
  const handlePostClick = (slug: string) => {
    // Save scroll position before opening modal
    savedScrollRef.current = window.scrollY;
    setModalSlug(slug);
    // Update URL without navigation (for reload support)
    window.history.pushState(null, '', `/post/${slug}`);
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setModalSlug(null);
    // Restore URL to home
    window.history.pushState(null, '', '/');
    // Restore scroll position after modal closes
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedScrollRef.current, behavior: 'instant' });
    });
  };
  
  // Handle modal navigate (when clicking related posts)
  const handleModalNavigate = (slug: string) => {
    // Don't reset scroll position when navigating between modals
    setModalSlug(slug);
    // Update URL without navigation
    window.history.pushState(null, '', `/post/${slug}`);
  };
  
  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/post/')) {
        const slug = path.replace('/post/', '');
        setModalSlug(slug);
      } else {
        setModalSlug(null);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // ESC key to close modal if open
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalSlug) {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [modalSlug]);
  
  // This uses the server-prefetched data immediately (Instant Load)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery<PostsPage>({
    queryKey: ['posts'],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`/api/posts?page=${pageParam}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Infinite Scroll Logic
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="border rounded shadow bg-white animate-pulse">
            <div className="w-full h-48 bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {modalSlug && (
        <PostModal 
          slug={modalSlug}
          onClose={handleModalClose}
          onNavigate={handleModalNavigate}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Trending Posts</h1>
          <p className="text-black mb-3">Instant-loading with smart caching • Click any post to see the magic ✨</p>
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
              🎭 Click = Modal View (instant)
            </span>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
              📄 Refresh = Detail Page (SEO)
            </span>
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
              ⚡ Virtualized Rendering
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.pages.flatMap((page) => page.items).map((post) => (
            <button
              key={post.id}
              onClick={() => handlePostClick(post.slug)}
              className="group text-left w-full cursor-pointer"
            >
              <article className="border rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden transform group-hover:-translate-y-1">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={post.thumbnail} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-4">
                  <h2 className="font-bold text-lg text-black mb-2 group-hover:text-black transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-black text-sm line-clamp-3 mb-3">
                    {post.shortDesc}
                  </p>
                  <div className="flex items-center justify-between text-xs text-black">
                    <span>{post.author}</span>
                    <span>ID: {post.id}</span>
                  </div>
                </div>
              </article>
            </button>
          ))}
        </div>

        {/* Infinite Scroll Trigger */}
        <div ref={ref} className="h-20 flex items-center justify-center mt-8">
          {isFetchingNextPage && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
          )}
          {!hasNextPage && data && (
            <p className="text-black text-sm">🎉 You've reached the end!</p>
          )}
        </div>
        </div>
      </div>
    </>
  );
}