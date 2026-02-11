'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePathname } from 'next/navigation';
import { PostsPage } from '@/lib/types';

export default function VirtualizedFeed() {
  const queryClient = useQueryClient();
  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const pathname = usePathname();
  const currentModalSlug = pathname && pathname.startsWith('/post/') ? pathname.replace('/post/', '') : null;
  const savedScrollRef = useRef<number>(0);
  const [modalSlug, setModalSlug] = useState<string | null>(currentModalSlug);

  useEffect(() => {
    setModalSlug(currentModalSlug);
  }, [currentModalSlug]);
  
  // Detect columns based on screen width
  const [columns, setColumns] = useState(3);
  
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 768) setColumns(1);
      else if (width < 1024) setColumns(2);
      else setColumns(3);
    };
    
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);
  
  // Prefetch function for post details
  const prefetchPost = (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ['post', slug],
      queryFn: async () => {
        const res = await fetch(`/api/post/${slug}`);
        if (!res.ok) throw new Error('Failed to fetch post');
        return res.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  };
  
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

  // Flatten all posts
  const allPosts = useMemo(() => {
    return data?.pages.flatMap(page => page.items) || [];
  }, [data]);

  // Group posts into rows based on columns
  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < allPosts.length; i += columns) {
      result.push(allPosts.slice(i, i + columns));
    }
    return result;
  }, [allPosts, columns]);

  // Virtualizer for rows (using window scroll for native browser behavior)
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => (typeof window !== 'undefined' ? document.documentElement : null),
    // base estimate (380) + card bottom margin (mb-6 = 24px) to account for spacing between rows
    estimateSize: () => 404,
    overscan: 5,
  });

  // Pinterest-style: Load more when user scrolls near bottom (within 800px)
  useEffect(() => {
    const handleScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return;
      
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Trigger when within 800px of bottom
      if (scrollTop + windowHeight >= documentHeight - 800) {
        setShouldLoadMore(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (shouldLoadMore && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
      setShouldLoadMore(false);
    }
  }, [shouldLoadMore, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Save and restore scroll position for modal navigation
  useEffect(() => {
    if (pathname.startsWith('/post/')) {
      // Save scroll position when navigating to modal
      savedScrollRef.current = window.scrollY;
    } else {
      // Restore scroll position when back to feed
      if (savedScrollRef.current > 0) {
        // Wait for virtualizer to render content before restoring scroll
        const scrollPos = savedScrollRef.current;
        
        // Use multiple attempts with increasing delays to ensure proper restoration
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollPos, behavior: 'instant' });
          
          setTimeout(() => {
            window.scrollTo({ top: scrollPos, behavior: 'instant' });
            
            setTimeout(() => {
              window.scrollTo({ top: scrollPos, behavior: 'instant' });
            }, 100);
          }, 50);
        });
      }
    }
  }, [pathname]);

  // Handle scroll position for browser tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Save scroll position when tab becomes hidden
        savedScrollRef.current = window.scrollY;
      } else {
        // Browser automatically restores scroll position on tab switch
        // No manual restoration needed for better native feel
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ESC key to close modal if open
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pathname.startsWith('/post/')) {
        window.history.back();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [pathname]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Trending Posts</h1>
          <p className="text-black mb-3">Instant-loading with smart caching • Virtualized for performance ⚡</p>
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

        {/* Virtualized Grid - Using Window Scroll */}
        <div
          key={`virtual-grid-${modalSlug ?? 'none'}`}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowPosts = rows[virtualRow.index];
              
              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className={`grid gap-x-6 gap-y-6 ${
                    columns === 1 ? 'grid-cols-1' : 
                    columns === 2 ? 'grid-cols-2' : 
                    'grid-cols-3'
                  }`}>
                    {rowPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/post/${post.slug}`}
                        onMouseEnter={() => prefetchPost(post.slug)}
                        className="group"
                      >
                        <article className="relative border rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden transform group-hover:-translate-y-1 mb-6">
                          <div className="relative h-48 overflow-hidden">
                            <span className={`absolute top-3 left-3 z-20 inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full transition-opacity duration-200 ${currentModalSlug === post.slug ? 'opacity-100' : 'opacity-0'}`}>
                              🎭 Modal View
                            </span>
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
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        {/* Loading Indicator */}
        <div className="h-20 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
          )}
          {!hasNextPage && data && (
            <p className="text-black text-sm">🎉 You've reached the end! ({allPosts.length} posts)</p>
          )}
        </div>
      </div>
    </div>
  );
}
